/**
 * Unique-IP counter. IPs are SHA-256 hashed with a random salt inside the
 * Durable Object. The raw IP is never stored or logged.
 */
export interface Env {
  ASSETS: Fetcher;
  VISITORS: DurableObjectNamespace;
}

export class VisitorCounter {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/salt") {
      let salt = await this.state.storage.get<string>("salt");
      if (!salt) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        salt = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
        await this.state.storage.put("salt", salt);
      }
      return new Response(salt);
    }
    if (url.pathname === "/count") {
      const count = (await this.state.storage.get<number>("count")) ?? 0;
      return Response.json({ count });
    }
    if (url.pathname === "/visit" && request.method === "POST") {
      const hash = await request.text();
      if (!hash || hash.length < 32 || hash.length > 128) {
        const count = (await this.state.storage.get<number>("count")) ?? 0;
        return Response.json({ count });
      }
      const key = `h:${hash}`;
      const seen = await this.state.storage.get(key);
      let count = (await this.state.storage.get<number>("count")) ?? 0;
      if (!seen) {
        await this.state.storage.put(key, 1);
        count += 1;
        await this.state.storage.put("count", count);
      }
      return Response.json({ count });
    }
    return new Response("not found", { status: 404 });
  }
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uniqueCount(env: Env, ip: string | null): Promise<number> {
  const id = env.VISITORS.idFromName("global");
  const stub = env.VISITORS.get(id);
  if (!ip) {
    const res = await stub.fetch("https://visitors/count");
    const data = (await res.json()) as { count: number };
    return data.count ?? 0;
  }
  const saltRes = await stub.fetch("https://visitors/salt");
  const salt = saltRes.ok ? await saltRes.text() : "bluelagune";
  const hash = await sha256Hex(`${salt}\n${ip}`);
  const res = await stub.fetch("https://visitors/visit", { method: "POST", body: hash });
  const data = (await res.json()) as { count: number };
  return data.count ?? 0;
}

function isSitePage(url: URL): boolean {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/assets/")) return false;
  return !/\.(js|css|png|jpe?g|svg|ico|webp|woff2?|map|json|txt)$/i.test(url.pathname);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/visitors") {
      const ip = request.headers.get("CF-Connecting-IP");
      const count = await uniqueCount(env, ip);
      return Response.json(
        { count },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (request.method === "GET" && isSitePage(url)) {
      const ip = request.headers.get("CF-Connecting-IP");
      ctx.waitUntil(uniqueCount(env, ip).then(() => undefined));
    }

    return env.ASSETS.fetch(request);
  },
};
