import { deriveStatus, STATUS_LABEL, type LocalReport, type Station, type TrustStatus } from "@/lib/stations";
import { cn } from "@/lib/utils";

const tone: Record<TrustStatus, string> = {
  confirmed: "bg-ok/15 text-ok",
  stale: "bg-stale/15 text-stale",
  broken: "bg-bad/15 text-bad",
  closed: "bg-muted/15 text-muted",
  unknown: "bg-subtle/20 text-muted",
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
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium tracking-wide",
        tone[resolved],
        className,
      )}
    >
      {STATUS_LABEL[resolved]}
    </span>
  );
}

export const STATUS_COLOR: Record<string, string> = {
  confirmed: "#2bb8a8",
  stale: "#c9a45c",
  broken: "#e05a4f",
  closed: "#8aa3a6",
  unknown: "#5e7679",
  open: "#34d399",
  limited: "#fbbf24",
};
