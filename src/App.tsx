import { useEffect, useMemo, useState } from "react";
import { MapHost } from "./components/map-host";
import {
  LocateButton,
  RouteToggle,
  SearchAndFilters,
  StationPanel,
} from "./components/station-panel";
import { STATUS_COLOR } from "./components/status-badge";
import { STATIONS } from "./lib/stations";
import { allStations, applyFilters, useAppStore } from "./lib/store";
import { cn } from "./lib/utils";

function useFilteredStations() {
  const query = useAppStore((s) => s.query);
  const filters = useAppStore((s) => s.filters);
  const reports = useAppStore((s) => s.reports);
  const userPos = useAppStore((s) => s.userPos);
  const route = useAppStore((s) => s.route);
  const extraStations = useAppStore((s) => s.extraStations);
  return useMemo(
    () =>
      applyFilters(allStations(extraStations), {
        query,
        filters,
        reports,
        userPos,
        route,
      }),
    [query, filters, reports, userPos, route, extraStations],
  );
}

export function App() {
  const stations = useFilteredStations();
  const panel = useAppStore((s) => s.panel);
  const sheet = useAppStore((s) => s.sheet);
  const setSheet = useAppStore((s) => s.setSheet);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  function cycleSheet() {
    if (panel !== "list") {
      setSheet(sheet === "full" ? "mid" : "full");
      return;
    }
    setSheet(sheet === "peek" ? "mid" : sheet === "mid" ? "full" : "peek");
  }

  const fabBottom =
    sheet === "peek" ? "11.25rem" : sheet === "full" ? "auto" : "min(52dvh, 32rem)";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="z-30 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="flex h-12 items-center gap-2.5 px-3 pt-[env(safe-area-inset-top)] sm:h-14 sm:px-4">
          <button type="button" className="flex min-w-0 items-center gap-2.5" onClick={() => setGuide(false)}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/35">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.25">
                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.95 4.95" />
              </svg>
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate font-display text-[1.05rem] leading-none tracking-tight sm:text-lg">Blue Lagune</span>
              <span className="mt-0.5 hidden text-[10px] tracking-[0.18em] text-muted uppercase sm:block">Entsorgung</span>
            </span>
          </button>
          <div className="ml-auto flex h-10 items-center rounded-full bg-surface/90 p-0.5 shadow-border sm:h-11">
            <RouteToggle />
            <button
              type="button"
              onClick={() => setGuide((g) => !g)}
              className="inline-flex size-9 items-center justify-center rounded-full text-fg hover:bg-surface-2 sm:size-10 sm:w-auto sm:gap-1.5 sm:px-3"
              aria-label="Entleeren"
            >
              <svg viewBox="0 0 24 24" className="size-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
              <span className="hidden text-sm sm:inline">Entleeren</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 md:flex">
        <main className="absolute inset-0 md:static md:order-2 md:min-h-0 md:flex-1">
          <MapHost stations={stations.length ? stations : STATIONS} />
          <Legend sheet={sheet} />
          {sheet !== "full" ? (
            <div className="absolute right-3 z-10 md:hidden" style={{ bottom: `calc(${fabBottom} + 0.75rem)` }}>
              <LocateButton floating />
            </div>
          ) : null}
        </main>

        <aside
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 flex min-h-0 flex-col bg-bg-elevated shadow-panel",
            "rounded-t-3xl transition-[height] duration-200 ease-out",
            "md:static md:order-1 md:h-full md:w-[400px] md:flex-none md:rounded-none md:transition-none",
            sheet === "peek" && "h-[11.25rem] md:h-full",
            sheet === "mid" && "h-[min(52dvh,32rem)] md:h-full",
            sheet === "full" && "h-[calc(100%-0.35rem)] md:h-full",
          )}
        >
          <button
            type="button"
            onClick={cycleSheet}
            className="flex h-8 shrink-0 flex-col items-center justify-center md:hidden"
            aria-label="Liste größer oder kleiner"
          >
            <span className="mb-1 h-1 w-10 rounded-full bg-border-strong" />
          </button>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
            {panel === "list" ? (
              <SearchAndFilters count={stations.length} compact={sheet === "peek"} />
            ) : null}
            {sheet === "peek" && panel === "list" ? null : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <StationPanel stations={stations} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {guide ? <GuideOverlay onClose={() => setGuide(false)} /> : null}
    </div>
  );
}

function Legend({ sheet }: { sheet: "peek" | "mid" | "full" }) {
  const items: [string, string][] = [
    ["Bestätigt", STATUS_COLOR.confirmed ?? "#2bb8a8"],
    ["Geöffnet", STATUS_COLOR.open ?? "#34d399"],
    ["Defekt", STATUS_COLOR.broken ?? "#ef4444"],
  ];
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 z-10 rounded-full bg-bg-elevated/90 px-2.5 py-1.5 text-xs shadow-border backdrop-blur-sm",
        "top-3 md:top-auto md:right-3 md:bottom-3 md:left-auto md:rounded-xl md:px-3 md:py-2",
        sheet === "full" && "hidden md:block",
      )}
    >
      <p className="mb-1.5 hidden text-xs tracking-wide text-muted uppercase md:block">Status</p>
      <ul className="flex gap-2.5 md:block md:space-y-1">
        {items.map(([label, color]) => (
          <li key={label} className="flex items-center gap-2 text-fg">
            <span className="size-2.5 rounded-full" style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-bg/95 p-5 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Kassette entleeren</h2>
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-surface px-3 text-sm shadow-border">
            Schließen
          </button>
        </div>
        <ol className="space-y-3 text-sm leading-relaxed text-muted">
          <li><span className="font-medium text-fg">1. Station finden.</span> Ort + Umkreis wählen oder Standort nutzen.</li>
          <li><span className="font-medium text-fg">2. Öffnungszeiten prüfen.</span> Vor der Anfahrt die Tabelle in der Station ansehen.</li>
          <li><span className="font-medium text-fg">3. Nur gekennzeichnete Grube.</span> Keine öffentliche Toilette, keinen Gulli.</li>
          <li><span className="font-medium text-fg">4. Schlauch / Spülung.</span> Nach dem Entleeren mit Wasser nachspülen.</li>
          <li><span className="font-medium text-fg">5. Status melden.</span> Wenn die Station defekt ist, in der App als Defekt markieren.</li>
        </ol>
      </div>
    </div>
  );
}
