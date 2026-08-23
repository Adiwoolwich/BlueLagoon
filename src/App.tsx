import { useEffect, useMemo, useState } from "react";
import { MapHost } from "./components/map-host";
import {
  LocateButton,
  RouteToggle,
  SearchAndFilters,
  StationPanel,
} from "./components/station-panel";
import { SiteFooter } from "./components/site-footer";
import { DatenschutzPage, ImpressumPage } from "./components/legal-pages";
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
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/impressum") return <ImpressumPage />;
  if (path === "/datenschutz") return <DatenschutzPage />;

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
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <section className="sr-only">
        <h1>Blue Lagune – Chemietoilette und Kassette entsorgen in Deutschland</h1>
        <p>
          Interaktive Karte mit Entsorgungsstationen für Chemietoiletten, Kassettentoiletten
          und Grauwasser. Suche nach Stadt, Ortsteil oder Postleitzahl.
        </p>
      </section>

      <main className="absolute inset-0">
        <MapHost stations={stations.length ? stations : STATIONS} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgb(7_17_20_/_0.38)_100%)]" />
        {sheet !== "full" ? (
          <div className="absolute right-3 z-10 md:hidden" style={{ bottom: `calc(${fabBottom} + 0.75rem)` }}>
            <LocateButton floating />
          </div>
        ) : null}
      </main>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[max(0.45rem,env(safe-area-inset-top))] sm:px-4">
        <div className="pointer-events-auto mx-auto flex h-12 max-w-[1100px] items-center gap-2 rounded-full bg-bg-elevated/80 px-2 shadow-panel ring-1 ring-border-strong backdrop-blur-xl md:ml-[24.5rem] md:mr-0 md:max-w-none">
          <button type="button" className="flex min-w-0 items-center gap-2.5 pl-1.5" onClick={() => setGuide(false)}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/35">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.25">
                <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.95 4.95" />
              </svg>
            </span>
            <span className="block truncate font-display text-[1.05rem] leading-none tracking-tight">Blue Lagune</span>
          </button>
          <div className="ml-auto flex items-center p-0.5">
            <RouteToggle />
            <button
              type="button"
              onClick={() => setGuide((g) => !g)}
              className="inline-flex size-9 items-center justify-center rounded-full text-fg hover:bg-surface-2 sm:size-10 sm:w-auto sm:gap-1.5 sm:px-3"
              aria-label="Anleitung Kassette entleeren"
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

      <aside
        className={cn(
          "absolute z-20 flex min-h-0 flex-col bg-bg-elevated/92 shadow-panel ring-1 ring-border backdrop-blur-xl",
          "inset-x-0 bottom-0 rounded-t-3xl transition-[height] duration-200 ease-out",
          "md:inset-auto md:top-3 md:bottom-3 md:left-3 md:w-[23.5rem] md:rounded-3xl md:transition-none",
          sheet === "peek" && "h-[11.25rem] md:h-auto",
          sheet === "mid" && "h-[min(52dvh,32rem)] md:h-auto",
          sheet === "full" && "h-[calc(100%-0.35rem)] md:h-auto",
        )}
      >
        <button type="button" onClick={cycleSheet} className="flex h-7 shrink-0 items-center justify-center md:hidden" aria-label="Liste größer oder kleiner">
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:p-4">
          {panel === "list" ? <SearchAndFilters count={stations.length} compact={sheet === "peek"} /> : null}
          {sheet === "peek" && panel === "list" ? null : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <StationPanel stations={stations} />
            </div>
          )}
          <SiteFooter className="pt-1" />
        </div>
      </aside>

      {guide ? <GuideOverlay onClose={() => setGuide(false)} /> : null}
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
      <SiteFooter className="mt-auto px-4 pb-4" />
    </div>
  );
}
