import { deriveStatus, type LocalReport, type Station, type TrustStatus } from "@/lib/stations";
import { statusLabel, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tone: Record<TrustStatus, string> = {
  confirmed: "bg-ok/12 text-ok ring-1 ring-ok/25",
  stale: "bg-stale/12 text-stale ring-1 ring-stale/25",
  broken: "bg-bad/12 text-bad ring-1 ring-bad/25",
  closed: "bg-muted/10 text-muted ring-1 ring-border",
  unknown: "bg-surface-2 text-muted ring-1 ring-border",
};

export function StatusBadge({
  status,
  station,
  report,
  className,
  compact,
}: {
  status?: TrustStatus;
  station?: Station;
  report?: LocalReport;
  className?: string;
  compact?: boolean;
}) {
  useLang();
  const resolved = status ?? (station ? deriveStatus(station, report) : "unknown");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide",
        compact ? "h-5 px-1.5 text-[10px]" : "h-7 px-2.5 text-xs",
        tone[resolved],
        className,
      )}
    >
      {statusLabel(resolved)}
    </span>
  );
}

export const STATUS_COLOR: Record<string, string> = {
  confirmed: "#0b7d86",
  stale: "#e39b16",
  broken: "#d94a4a",
  closed: "#5d7277",
  unknown: "#2f8ec4",
  open: "#0b7d86",
  limited: "#e39b16",
};
