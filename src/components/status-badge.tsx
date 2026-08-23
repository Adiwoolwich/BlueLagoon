import { deriveStatus, type Station } from "@/lib/stations";

const styles: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  closed: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  unknown: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  limited: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

export function StatusBadge({ station }: { station: Station }) {
  const status = deriveStatus(station);
  const label =
    status === "open"
      ? "Geöffnet"
      : status === "closed"
        ? "Geschlossen"
        : status === "limited"
          ? "Eingeschränkt"
          : "Unbekannt";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.unknown}`}
    >
      {label}
    </span>
  );
}
