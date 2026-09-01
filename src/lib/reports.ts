import type { ServerReport } from "./store";

export type PublicReport = ServerReport;

export async function fetchReports(): Promise<Record<string, PublicReport>> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  if (!res.ok) return {};
  const data = (await res.json()) as { reports?: Record<string, PublicReport> };
  if (!data || typeof data.reports !== "object" || data.reports == null) return {};
  const out: Record<string, PublicReport> = {};
  for (const [id, rec] of Object.entries(data.reports)) {
    if (!rec || (rec.status !== "ok" && rec.status !== "broken")) continue;
    if (typeof rec.at !== "number") continue;
    const row: PublicReport = { status: rec.status, at: rec.at };
    if (typeof rec.note === "string" && rec.note.trim()) row.note = rec.note.trim().slice(0, 200);
    out[id] = row;
  }
  return out;
}

export async function postReport(
  id: string,
  status: "ok" | "broken",
  note?: string,
): Promise<{ ok: boolean; status: number; report?: PublicReport }> {
  const body: { id: string; status: "ok" | "broken"; note?: string; company: string } = { id, status, company: "" };
  const n = note?.trim();
  if (n) body.note = n.slice(0, 200);
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as { report?: PublicReport };
  return { ok: true, status: res.status, report: data.report };
}
