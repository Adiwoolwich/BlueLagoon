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

const SKIP_KEY = "bl-skip-landing";

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

function Landing({ onDone }: { onDone: () => void }) {
  const [flushing, setFlushing] = useState(false);
  const n = STATIONS.length;
  function go(persist: boolean) {
    if (flushing) return;
    setFlushing(true);
    if (persist) {
      try {
        localStorage.setItem(SKIP_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    window.setTimeout(onDone, 900);
  }
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_55%)]"
      />
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-xl sm:px-8",
          flushing && "pointer-events-none opacity-40",
        )}
      >
        <header className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-fg sm:size-12">
            <svg viewBox="0 0 24 32" width="22" height="28" aria-hidden>
              <path
                fill="currentColor"
                d="M12 1.5C12 1.5 3.5 12.2 3.5 19.2a8.5 8.5 0 0 0 17 0C20.5 12.2 12 1.5 12 1.5z"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-xl leading-none sm:text-2xl">Blue Lagune</p>
            <p className="mt-1 text-sm text-muted">Entsorgungsstationen für Camper</p>
          </div>
        </header>
        <main className="mt-6 flex flex-1 flex-col sm:mt-10">
          <h1 className="font-display text-[1.4rem] leading-snug sm:text-3xl">
            Kassettentoilette entsorgen – ohne Sucherei.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            Finde verlässliche Stationen in Deutschland, navigiere dorthin und halte die Karte
            gemeinsam aktuell.
          </p>
          <ul className="mt-5 space-y-2.5 sm:mt-8">
            <li className="rounded-2xl bg-surface p-3 shadow-border">
              <p className="font-medium">Stationen finden &amp; navigieren</p>
              <p className="text-sm text-muted">Karte, Ortssuche, GPX</p>
            </li>
            <li className="rounded-2xl bg-surface p-3 shadow-border">
              <p className="font-medium">Community hält sie aktuell</p>
              <p className="text-sm text-muted">Eintragen und melden</p>
            </li>
            <li className="rounded-2xl bg-surface p-3 shadow-border">
              <p className="font-medium">Merkliste &amp; Notizen</p>
              <p className="text-sm text-muted">Wichtige Stellen speichern</p>
            </li>
          </ul>
          <p className="mt-6 text-center text-sm tabular-nums text-muted">Aktuell {n}+ Stationen</p>
          <div className="mt-auto flex flex-col items-center pt-8">
            <button
              type="button"
              onClick={() => go(true)}
              disabled={flushing}
              className={cn("bl-flush-btn w-full max-w-sm", flushing && "is-flushing")}
            >
              <span className="bl-flush-water" aria-hidden />
              <span className="bl-flush-label">{flushing ? "Spülen …" : "Spülen & starten"}</span>
            </button>
            <p className="mt-3 text-center text-xs text-subtle">Nächstes Mal direkt zur Karte.</p>
            <button
              type="button"
              onClick={() => go(false)}
              className="mt-4 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Nur diesmal zur Karte
            </button>
          </div>
        </main>
      </div>
      {flushing ? (
        <div className="bl-flush-overlay" aria-hidden>
          <div className="bl-flush-wave" />
        </div>
      ) : null}
    </div>
  );
}

export function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/impressum") return <ImpressumPage />;
  if (path === "/datenschutz") return <DatenschutzPage />;

  const [showLanding, setShowLanding] = useState(() => {
    try {
      return localStorage.getItem(SKIP_KEY) !== "1";
    } catch {
      return true;
    }
  });

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

  if (showLanding) {
    return <Landing onDone={() => setShowLanding(false)} />;
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg" data-chrome="map">
      <section className="sr-only">
        <h1>Blue Lagune – Chemietoilette und Kassette entsorgen in Deutschland</h1>
        <p>
          Interaktive Karte mit Entsorgungsstationen für Chemietoiletten und Kassettentoiletten
          in Deutschland.
        </p>
      </section>

      <main className="absolute inset-0">
        <MapHost stations={stations.length ? stations : STATIONS} />
        {sheet !== "full" ? (
          <div
            className="absolute right-3 z-10 md:hidden"
            style={{ bottom: `calc(${fabBottom} + 0.75rem)` }}
          >
            <LocateButton floating />
          </div>
        ) : null}
      </main>

      <aside
        className={cn(
          "absolute z-20 flex min-h-0 flex-col bg-bg-elevated/95 shadow-panel ring-1 ring-border backdrop-blur-xl",
          "inset-x-0 bottom-0 rounded-t-3xl transition-[height] duration-200 ease-out",
          "md:inset-auto md:top-3 md:bottom-3 md:left-3 md:w-[23.5rem] md:rounded-3xl md:transition-none",
          sheet === "peek" && "h-[11.25rem] md:h-auto",
          sheet === "mid" && "h-[min(52dvh,32rem)] md:h-auto",
          sheet === "full" && "h-[calc(100%-0.35rem)] md:h-auto",
        )}
      >
        <button
          type="button"
          onClick={cycleSheet}
          className="flex h-7 shrink-0 items-center justify-center md:hidden"
          aria-label="Liste größer oder kleiner"
        >
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:p-4">
          {panel === "list" ? (
            <SearchAndFilters count={stations.length} compact={sheet === "peek"} />
          ) : null}
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
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-surface px-3 text-sm shadow-border"
          >
            Schließen
          </button>
        </div>
        <ol className="space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-fg">1. Station finden.</span> Ort + Umkreis oder
            Standort.
          </li>
          <li>
            <span className="font-medium text-fg">2. Öffnungszeiten prüfen.</span>
          </li>
          <li>
            <span className="font-medium text-fg">3. Nur gekennzeichnete Grube.</span>
          </li>
          <li>
            <span className="font-medium text-fg">4. Nachspülen.</span>
          </li>
          <li>
            <span className="font-medium text-fg">5. Status melden.</span> Bei Defekt in der App
            markieren.
          </li>
        </ol>
      </div>
      <SiteFooter className="mt-auto px-4 pb-4" />
    </div>
  );
}
