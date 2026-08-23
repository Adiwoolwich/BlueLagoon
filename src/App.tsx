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
    sheet === "peek" ? "12.5rem" : sheet === "full" ? "auto" : "min(58dvh, 34rem)";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="z-30 flex items-center gap-2 border-b border-border px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-4 sm:pt-3 sm:pb-3">
        <button type="button" className="flex min-w-0 items-center gap-2" onClick={() => setGuide(false)}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary shadow-border">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.7c.3 0 .6.2.8.4 2.6 3 7.2 8.3 7.2 12a8 8 0 1 1-16 0c0-3.7 4.6-9 7.2-12 .2-.2.5-.4.8-.4Z" />
              <path d="M8 14c.8 2 2 3 4 3s3.2-1 4-3" />
            </svg>
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-display text-lg leading-none tracking-tight">Blue Lagoon</span>
            <span className="hidden text-xs tracking-wide text-muted uppercase sm:block">Entsorgungsstationen</span>
          </span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden md:block">
            <LocateButton />
          </div>
          <RouteToggle />
          <button
            type="button"
            onClick={() => setGuide((g) => !g)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-fg shadow-border sm:w-auto sm:gap-2 sm:px-3"
            aria-label="Entleeren"
          >
            <svg viewBox="0 0 24 24" className="size-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              <path d="M8 7h8M8 11h8M8 15h5" />
            </svg>
            <span className="hidden sm:inline">Entleeren</span>
          </button>
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
            "rounded-t-2xl transition-[height] duration-200 ease-out",
            "md:static md:order-1 md:h-full md:w-[400px] md:flex-none md:rounded-none md:transition-none",
            sheet === "peek" && "h-48 md:h-full",
            sheet === "mid" && "h-[min(58dvh,34rem)] md:h-full",
            sheet === "full" && "h-[calc(100%-0.5rem)] md:h-full",
          )}
        >
          <button
            type="button"
            onClick={cycleSheet}
            className="flex h-11 shrink-0 flex-col items-center justify-center md:hidden"
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
        "pointer-events-none absolute left-3 z-10 rounded-xl bg-bg-elevated/90 px-3 py-2 text-xs shadow-border backdrop-blur-sm",
        "top-3 md:top-auto md:right-3 md:bottom-3 md:left-auto",
        sheet === "full" && "hidden md:block",
      )}
    >
      <p className="mb-1.5 text-xs tracking-wide text-muted uppercase">Status</p>
      <ul className="space-y-1">
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
