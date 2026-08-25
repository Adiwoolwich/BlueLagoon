import { deriveStatus, STATUS_LABEL, type LocalReport, type Station, type TrustStatus } from "@/lib/stations";
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
}: {
  status?: TrustStatus;
  station?: Station;
  report?: LocalReport;
  className?: string;
}) {
  const resolved = status ?? (station ? deriveStatus(station, report) : "unknown");
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide",
        tone[resolved],
        className,
      )}
    >
      {STATUS_LABEL[resolved]}
    </span>
  );
}

export const STATUS_COLOR: Record<string, string> = {
  confirmed: "#0a7a70",
  stale: "#a67c1a",
  broken: "#c43c31",
  closed: "#5c747a",
  unknown: "#5c747a",
  open: "#0a7a70",
  limited: "#a67c1a",
};
