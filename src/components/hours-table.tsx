import {
  DAY_ORDER,
  getHoursCertainty,
  type DayKey,
  type Station,
} from "@/lib/stations";
import { certaintyLabel, dayShort, fmtSlot, hoursKindLabel, hoursLine, t, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const JS_DAY_TO_KEY: DayKey[] = ["su", "mo", "tu", "we", "th", "fr", "sa"];

export function HoursTable({ station }: { station: Station }) {
  useLang();
  const certainty = getHoursCertainty(station);
  const week = station.weeklyHours;
  const today = JS_DAY_TO_KEY[new Date().getDay()];
  const summary = hoursLine(station);
  const showTable = Boolean(week) || station.hours === "24h";
  const known = Boolean(summary) || showTable;

  if (!known) {
    return (
      <section className="rounded-lg bg-surface p-3 ring-1 ring-border">
        <p className="text-[11px] tracking-wide text-muted uppercase">{t("hoursOpen")}</p>
        <p className="mt-1 text-sm text-subtle">{t("hoursUnknown")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-surface p-3 ring-1 ring-border">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-wide text-muted uppercase">{t("hoursOpen")}</p>
          <p className="mt-1 text-sm text-fg">{summary ?? hoursKindLabel(station.hours)}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
            certainty === "exact" && "bg-ok/12 text-ok",
            certainty === "approx" && "bg-stale/12 text-stale",
            certainty === "unknown" && "bg-bad/12 text-bad",
          )}
        >
          {certainty === "unknown" ? t("hoursUnknown") : certaintyLabel(certainty)}
        </span>
      </div>
      {week ? (
        <ul className="mt-3 space-y-1 text-xs">
          {DAY_ORDER.map((d) => (
            <li
              key={d}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-1 py-0.5",
                d === today ? "bg-surface-2 text-fg" : "text-muted",
              )}
            >
              <span className="flex min-w-14 items-baseline gap-1 tabular-nums">
                {dayShort(d)}
                {d === today ? <span className="text-xs text-primary">{t("today")}</span> : null}
              </span>
              <span className={cn("tabular-nums", d === today && "text-fg")}>{fmtSlot(week[d])}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {station.hoursNote && summary && !summary.includes(station.hoursNote) ? (
        <p className="mt-2 text-xs text-muted">{station.hoursNote}</p>
      ) : null}
      {certainty !== "exact" ? <p className="mt-2 text-xs text-stale">{t("hoursCheck")}</p> : null}
    </section>
  );
}
