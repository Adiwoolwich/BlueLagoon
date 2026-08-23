import { deriveStatus, type Station, type LocalReport } from "@/lib/stations";

export const STATUS_COLOR: Record<string, string> = {
  open: "#34d399",
  closed: "#f87171",
  limited: "#fbbf24",
  unknown: "#94a3b8",
  confirmed: "#2bb8a8",
  broken: "#ef4444",
};

const styles: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  closed: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  unknown: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  limited: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  confirmed: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  broken: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function StatusBadge({
  station,
  report,
}: {
  station: Station;
  report?: LocalReport;
}) {
  const status = deriveStatus(station, report);
  const label =
    status === "open"
      ? "Geöffnet"
      : status === "closed"
        ? "Geschlossen"
        : status === "limited"
          ? "Eingeschränkt"
          : status === "confirmed"
            ? "Bestätigt"
            : status === "broken"
              ? "Defekt"
              : "Unbekannt";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.unknown}`}
    >
      {label}
    </span>
  );
}
