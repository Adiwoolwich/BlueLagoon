import { useEffect, useMemo, useState } from "react";
import { MapHost } from "./components/map-host";
import {
  LocateButton,
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
    <div className="relative h-dvh overflow-hidden bg-bg text-fg" data-chrome="map">
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
          <SiteFooter className="justify-start pt-1" onGuide={() => setGuide(true)} />
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
