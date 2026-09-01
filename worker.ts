import { EmailMessage } from "cloudflare:email";

/**
 * Unique-IP counter. IPs are SHA-256 hashed with a random salt inside the
 * Durable Object. The raw IP is never stored or logged.
 */
export interface Env {
  ASSETS: Fetcher;
  VISITORS: DurableObjectNamespace;
  EMAIL: {
    send: (message: EmailMessage) => Promise<void>;
  };
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
    if (url.pathname === "/feedback-rl" && request.method === "POST") {
      const hash = (await request.text()).trim();
      if (!/^[0-9a-f]{64}$/.test(hash)) return Response.json({ ok: true });
      const now = Date.now();
      const key = `fb:${hash}`;
      const rec = await this.state.storage.get<{ n: number; t: number }>(key);
      if (rec && now - rec.t < 60 * 60 * 1000) {
        if (rec.n >= 5) return Response.json({ ok: false }, { status: 429 });
        await this.state.storage.put(key, { n: rec.n + 1, t: rec.t });
      } else {
        await this.state.storage.put(key, { n: 1, t: now });
      }
      return Response.json({ ok: true });
    }
    if (url.pathname === "/report-rl" && request.method === "POST") {
      const hash = (await request.text()).trim();
      if (!/^[0-9a-f]{64}$/.test(hash)) return Response.json({ ok: true });
      const now = Date.now();
      const key = `st:rl:${hash}`;
      const rec = await this.state.storage.get<{ n: number; t: number }>(key);
      if (rec && now - rec.t < 60 * 60 * 1000) {
        if (rec.n >= 5) return Response.json({ ok: false }, { status: 429 });
        await this.state.storage.put(key, { n: rec.n + 1, t: rec.t });
      } else {
        await this.state.storage.put(key, { n: 1, t: now });
      }
      return Response.json({ ok: true });
    }
    if (url.pathname === "/reports" && request.method === "GET") {
      const listed = await this.state.storage.list<StationReport>({ prefix: "st:" });
      const reports: Record<string, StationReport> = {};
      for (const [key, rec] of listed) {
        if (key.startsWith("st:rl:")) continue;
        const id = key.slice(3);
        if (rec && (rec.status === "ok" || rec.status === "broken")) reports[id] = rec;
      }
      return Response.json({ reports });
    }
    if (url.pathname === "/reports" && request.method === "POST") {
      let body: { id?: string; status?: string; note?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return Response.json({ ok: false, error: "invalid" }, { status: 400 });
      }
      const id = typeof body.id === "string" ? body.id.trim() : "";
      const status = body.status;
      if (!STATION_ID_RE.test(id) || (status !== "ok" && status !== "broken")) {
        return Response.json({ ok: false, error: "invalid" }, { status: 400 });
      }
      let note: string | undefined;
      if (typeof body.note === "string") {
        note = body.note.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 200);
        if (!note) note = undefined;
      }
      const rec: StationReport = { status, at: Date.now() };
      if (note) rec.note = note;
      await this.state.storage.put(`st:${id}`, rec);
      return Response.json({ ok: true, report: rec });
    }
    return new Response("not found", { status: 404 });
  }
}

type StationReport = { status: "ok" | "broken"; note?: string; at: number };

const STATION_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,79}$/;

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


const FEEDBACK_TO = "woolwichvcc@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://blue-lagune.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...corsHeaders() } });
}

function escapeText(s: string): string {
  return s.replace(/\r/g, "").slice(0, 4000);
}

async function allowFeedback(env: Env, ip: string | null): Promise<boolean> {
  if (!ip) return true;
  const stub = env.VISITORS.get(env.VISITORS.idFromName("global"));
  const saltRes = await stub.fetch("https://visitors/salt");
  const salt = saltRes.ok ? await saltRes.text() : "bluelagune";
  const hash = await sha256Hex(`${salt}\n${ip}`);
  const res = await stub.fetch("https://visitors/feedback-rl", { method: "POST", body: hash });
  return res.ok;
}

async function hashedIp(env: Env, ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const stub = env.VISITORS.get(env.VISITORS.idFromName("global"));
  const saltRes = await stub.fetch("https://visitors/salt");
  const salt = saltRes.ok ? await saltRes.text() : "bluelagune";
  return sha256Hex(`${salt}\n${ip}`);
}

async function allowReport(env: Env, ip: string | null): Promise<boolean> {
  const hash = await hashedIp(env, ip);
  if (!hash) return true;
  const stub = env.VISITORS.get(env.VISITORS.idFromName("global"));
  const res = await stub.fetch("https://visitors/report-rl", { method: "POST", body: hash });
  return res.ok;
}

async function handleReport(request: Request, env: Env): Promise<Response> {
  let body: { id?: string; status?: string; note?: string; company?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }
  if (typeof body.company === "string" && body.company.trim()) {
    return json({ ok: true });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = body.status;
  if (!STATION_ID_RE.test(id) || (status !== "ok" && status !== "broken")) {
    return json({ ok: false, error: "invalid" }, 400);
  }
  let note: string | undefined;
  if (typeof body.note === "string") {
    note = body.note.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 200);
    if (!note) note = undefined;
  }
  const ip = request.headers.get("CF-Connecting-IP");
  if (!(await allowReport(env, ip))) return json({ ok: false, error: "rate" }, 429);
  const stub = env.VISITORS.get(env.VISITORS.idFromName("global"));
  const payload: { id: string; status: "ok" | "broken"; note?: string } = { id, status };
  if (note) payload.note = note;
  const res = await stub.fetch("https://visitors/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return json(data, res.status);
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: { name?: string; email?: string; message?: string; company?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }
  if (typeof body.company === "string" && body.company.trim()) {
    return json({ ok: true });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (name.length < 2 || name.length > 80) return json({ ok: false, error: "name" }, 400);
  if (!EMAIL_RE.test(email) || email.length > 120) return json({ ok: false, error: "email" }, 400);
  if (message.length < 10 || message.length > 4000) return json({ ok: false, error: "message" }, 400);

  const ip = request.headers.get("CF-Connecting-IP");
  if (!(await allowFeedback(env, ip))) return json({ ok: false, error: "rate" }, 429);

  const text = [
    "Neues Feedback von blue-lagune.com",
    "",
    `Name: ${escapeText(name)}`,
    `E-Mail: ${escapeText(email)}`,
    "",
    escapeText(message),
  ].join("\n");

  const fromAddr = "feedback@blue-lagune.com";
  const subject = `Feedback: ${escapeText(name).slice(0, 60)}`;
  const subj = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const raw = [
    `From: Blue Lagune <${fromAddr}>`,
    `To: ${FEEDBACK_TO}`,
    `Reply-To: ${email}`,
    `Subject: ${subj}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
  ].join("\r\n");
  try {
    await env.EMAIL.send(new EmailMessage(fromAddr, FEEDBACK_TO, raw));
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const code = e?.code || e?.message || "mail";
    console.error(JSON.stringify({ feedbackMail: String(code) }));
    return json({ ok: false, error: "mail", code: String(code) }, 502);
  }
  return json({ ok: true });
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

    if (url.pathname === "/api/reports" && request.method === "GET") {
      const stub = env.VISITORS.get(env.VISITORS.idFromName("global"));
      const res = await stub.fetch("https://visitors/reports");
      const data = await res.json();
      return json(data, res.status);
    }
    if (url.pathname === "/api/reports" && request.method === "POST") {
      return handleReport(request, env);
    }
    if (url.pathname === "/api/reports" && request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      return handleFeedback(request, env);
    }
    if (url.pathname === "/api/feedback" && request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method === "GET" && isSitePage(url)) {
      const ip = request.headers.get("CF-Connecting-IP");
      ctx.waitUntil(uniqueCount(env, ip).then(() => undefined));
    }

    return env.ASSETS.fetch(request);
  },
};
