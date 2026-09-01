import { useEffect, useMemo, useRef, useState } from "react";
import { MapHost } from "./components/map-host";
import {
  LocateButton,
  SearchAndFilters,
  SearchBar,
  StationPanel,
} from "./components/station-panel";
import { SiteFooter } from "./components/site-footer";
import { DatenschutzPage, ImpressumPage } from "./components/legal-pages";
import { FeedbackPage } from "./components/feedback-form";
import { OfflineButton } from "./components/offline-panel";
import { hasPreciseCoords, STATIONS } from "./lib/stations";
import { allStations, applyFilters, useAppStore } from "./lib/store";
import { inBounds } from "./lib/geo";
import { hasMapDeepLink, parseUrl } from "./lib/url-state";
import { fetchReports } from "./lib/reports";
import { t, useLang } from "./lib/i18n";
import { cn } from "./lib/utils";

const SKIP_KEY = "bl-skip-landing";

function useFilteredStations() {
  const query = useAppStore((s) => s.query);
  const filters = useAppStore((s) => s.filters);
  const reports = useAppStore((s) => s.reports);
  const userPos = useAppStore((s) => s.userPos);
  const route = useAppStore((s) => s.route);
  const routePath = useAppStore((s) => s.routePath);
  const corridorKm = useAppStore((s) => s.corridorKm);
  const extraStations = useAppStore((s) => s.extraStations);
  const serverReports = useAppStore((s) => s.serverReports);
  return useMemo(
    () =>
      applyFilters(allStations(extraStations), {
        query,
        filters,
        reports,
        serverReports,
        userPos,
        route,
        routePath,
        corridorKm,
      }),
    [query, filters, reports, serverReports, userPos, route, routePath, corridorKm, extraStations],
  );
}

function Landing({ onDone }: { onDone: () => void }) {
  const lang = useLang();
  const n = STATIONS.length;
  const [visitors, setVisitors] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/visitors")
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") setVisitors(d.count);
      })
      .catch(() => {});
  }, []);
  function go(persist: boolean) {
    if (persist) {
      try {
        localStorage.setItem(SKIP_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    onDone();
  }
  return (
    <div className="bl-landing relative min-h-dvh overflow-hidden text-fg">
      <div className="bl-landing-glow" aria-hidden />
      <svg className="bl-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
        <path
          className="bl-wave-a"
          fill="#1498a3"
          fillOpacity="0.22"
          d="M0,192L80,176C160,160 320,128 480,133C640,139 800,181 960,181C1120,181 1280,139 1360,128L1440,117L1440,320L0,320Z"
        />
        <path
          className="bl-wave-b"
          fill="#0b7d86"
          fillOpacity="0.18"
          d="M0,256L80,245C160,235 320,213 480,208C640,203 800,213 960,218C1120,224 1280,229 1360,232L1440,235L1440,320L0,320Z"
        />
      </svg>
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-xl sm:px-8">
        <header className="flex items-center gap-3">
          <span className="bl-mark">
            <span className="bl-ripple" aria-hidden />
            <svg className="bl-drop-bob" viewBox="0 0 24 32" width="22" height="28" aria-hidden>
              <path
                fill="currentColor"
                d="M12 1.5C12 1.5 3.5 12.2 3.5 19.2a8.5 8.5 0 0 0 17 0C20.5 12.2 12 1.5 12 1.5z"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-xl leading-none font-semibold sm:text-2xl">Blue Lagune</p>
            <p className="mt-1 text-sm text-muted">{t("landingKicker")}</p>
          </div>
        </header>
        <main className="mt-7 flex flex-1 flex-col sm:mt-12">
          <h1 className="text-[1.55rem] leading-snug font-semibold sm:text-3xl">{t("landingH1")}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{t("landingLead")}</p>
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            <li className="bl-tile">
              <span className="bl-float text-primary" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="9.8" r="2.2" fill="currentColor" />
                </svg>
              </span>
              <p className="text-[13px] leading-tight font-medium">{t("landingTileFind")}</p>
              <p className="text-[11px] leading-snug text-muted">{t("landingTileFindSub")}</p>
            </li>
            <li className="bl-tile">
              <span className="bl-float bl-float-2 text-primary" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path fill="currentColor" d="M12 2C12 2 5 11.2 5 16a7 7 0 0 0 14 0C19 11.2 12 2 12 2z" />
                  <circle className="bl-drip" cx="12" cy="8.2" r="1.35" fill="#04151c" />
                  <ellipse className="bl-icon-ripple" cx="12" cy="20" rx="4.2" ry="1.15" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <p className="text-[13px] leading-tight font-medium">{t("landingTileWater")}</p>
              <p className="text-[11px] leading-snug text-muted">{t("landingTileWaterSub")}</p>
            </li>
            <li className="bl-tile">
              <span className="bl-float bl-float-3 text-primary" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 16.5V8.8c0-.7.5-1.3 1.2-1.4L12 6l6.8 1.4c.7.1 1.2.7 1.2 1.4v7.7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M4 16.5c1.6 0 2.2 1.5 4 1.5s2.4-1.5 4-1.5 2.2 1.5 4 1.5 2.4-1.5 4-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <p className="text-[13px] leading-tight font-medium">{t("landingTileSave")}</p>
              <p className="text-[11px] leading-snug text-muted">{t("landingTileSaveSub")}</p>
            </li>
          </ul>
          <p className="mt-6 text-center text-sm tabular-nums text-muted">
            {t("landingCount", { n })}
            {visitors != null
              ? ` · ${t("landingVisitors", { n: visitors.toLocaleString(lang === "en" ? "en-GB" : lang === "nl" ? "nl-NL" : "de-DE") })}`
              : ""}
          </p>
          <div className="mt-auto flex flex-col items-center pt-8">
            <button
              type="button"
              onClick={() => go(true)}
              className="bl-cta h-12 w-full max-w-sm rounded-full bg-primary text-base font-semibold text-primary-fg shadow-btn"
            >
              {t("landingCta")}
            </button>
            <p className="mt-3 text-center text-xs text-subtle">{t("landingNext")}</p>
            <button
              type="button"
              onClick={() => go(false)}
              className="mt-4 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("landingOnce")}
            </button>
            <SiteFooter className="mt-8" />
          </div>
        </main>
      </div>
    </div>
  );
}

function SheetHandle({
  label,
  onTap,
  onSwipeUp,
  onSwipeDown,
}: {
  label: string;
  onTap: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}) {
  const startY = useRef<number | null>(null);
  const lastY = useRef(0);
  const dragged = useRef(false);

  function begin(y: number, target?: HTMLDivElement, pointerId?: number) {
    startY.current = y;
    lastY.current = y;
    dragged.current = false;
    if (target && pointerId != null) {
      try {
        target.setPointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
  }

  function move(y: number) {
    if (startY.current == null) return;
    lastY.current = y;
    if (Math.abs(y - startY.current) > 8) dragged.current = true;
  }

  function end() {
    if (startY.current == null) return;
    const dy = lastY.current - startY.current;
    startY.current = null;
    if (dy < -18) onSwipeUp();
    else if (dy > 18) onSwipeDown();
    else if (!dragged.current) onTap();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      className="flex h-12 shrink-0 touch-none select-none items-center justify-center md:hidden"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        begin(e.clientY, e.currentTarget, e.pointerId);
      }}
      onPointerMove={(e) => move(e.clientY)}
      onPointerUp={end}
      onPointerCancel={end}
      onTouchStart={(e) => {
        const y = e.touches[0]?.clientY;
        if (y == null) return;
        begin(y);
      }}
      onTouchMove={(e) => {
        const y = e.touches[0]?.clientY;
        if (y == null) return;
        e.preventDefault();
        move(y);
      }}
      onTouchEnd={end}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onSwipeUp();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onSwipeDown();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
    >
      <span className="h-1.5 w-14 rounded-full bg-border-strong" />
    </div>
  );
}

export function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/impressum") return <ImpressumPage />;
  if (path === "/datenschutz") return <DatenschutzPage />;
  if (path === "/feedback") return <FeedbackPage />;
  return <MapApp />;
}

function MapApp() {
  useLang();
  const initial = useMemo(() => parseUrl(), []);
  const [showLanding, setShowLanding] = useState(() => {
    if (hasMapDeepLink()) return false;
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
  const routePath = useAppStore((s) => s.routePath);
  const bounds = useAppStore((s) => s.bounds);
  const inViewCount = useMemo(() => {
    if (!bounds) return stations.filter(hasPreciseCoords).length;
    return stations.filter((s) => hasPreciseCoords(s) && inBounds(s, bounds)).length;
  }, [stations, bounds]);

  useEffect(() => {
    fetch("/api/visitors").catch(() => {});
    void fetchReports()
      .then((r) => useAppStore.getState().setServerReports(r))
      .catch(() => {});
    void useAppStore.persist.rehydrate();
    const s = useAppStore.getState();
    if (Object.keys(initial.filters).length) s.setFilters(initial.filters);
    if (initial.query) {
      s.setQuery(initial.query);
      s.setFilters({ place: initial.query, ...initial.filters });
    }
    s.setMapView({ lat: initial.lat, lng: initial.lng, zoom: initial.zoom });
    if (initial.id) s.select(initial.id);
  }, [initial]);

  function cycleSheet() {
    if (panel !== "list") {
      setSheet(sheet === "full" ? "mid" : "full");
      return;
    }
    setSheet(sheet === "peek" ? "mid" : sheet === "mid" ? "full" : "peek");
  }

  function stepSheet(dir: "up" | "down") {
    if (panel !== "list") {
      if (dir === "up") setSheet("full");
      else setSheet("mid");
      return;
    }
    if (dir === "up") {
      if (sheet === "peek") setSheet("mid");
      else if (sheet === "mid") setSheet("full");
    } else if (sheet === "full") setSheet("mid");
    else if (sheet === "mid") setSheet("peek");
  }

  if (showLanding) {
    return <Landing onDone={() => setShowLanding(false)} />;
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg" data-chrome="map">
      <section className="sr-only">
        <h1>{t("srTitle")}</h1>
        <p>{t("srLead")}</p>
      </section>

      <main className="absolute inset-0">
        <MapHost stations={stations.length ? stations : STATIONS} initialView={initial} />
        <div
          data-bl-keep-clear
          className="absolute inset-x-0 top-0 z-30 flex items-start gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden"
        >
          <div className="min-w-0 flex-1">
            <SearchBar overlay />
          </div>
          <LocateButton floating />
          <OfflineButton floating />
        </div>
        <div className="absolute right-3 bottom-6 z-10 hidden md:flex md:flex-col md:gap-2">
          <LocateButton floating />
          <OfflineButton floating />
        </div>
      </main>

      <aside
        className={cn(
          "absolute z-20 flex min-h-0 flex-col bg-bg-elevated shadow-panel ring-1 ring-border",
          "inset-x-0 bottom-0 rounded-t-2xl transition-[height] duration-200 ease-out",
          "md:inset-auto md:top-3 md:bottom-3 md:left-3 md:w-[24rem] md:rounded-2xl md:transition-none",
          sheet === "peek" && "h-[11.25rem] md:h-auto",
          sheet === "mid" && "h-[min(52dvh,32rem)] md:h-auto",
          sheet === "full" &&
            "top-[calc(max(0.75rem,env(safe-area-inset-top))+3.25rem)] h-auto bottom-0 md:top-3 md:h-auto",
        )}
      >
        <SheetHandle
          label={t("sheetResize")}
          onTap={cycleSheet}
          onSwipeUp={() => stepSheet("up")}
          onSwipeDown={() => stepSheet("down")}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:p-4">
          {panel === "list" ? <SearchAndFilters count={inViewCount} compact={sheet === "peek"} /> : null}
          {routePath?.source === "straight" && panel === "list" && sheet !== "peek" ? (
            <p className="shrink-0 rounded-lg bg-stale/10 px-2.5 py-1.5 text-xs text-stale">{t("routeAir")}</p>
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
  useLang();
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-bg p-5">
      <div className="mx-auto w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("guideTitle")}</h2>
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-surface px-3 text-sm ring-1 ring-border">
            {t("close")}
          </button>
        </div>
        <ol className="space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-fg">{t("guide1t")}</span> {t("guide1")}
          </li>
          <li>
            <span className="font-medium text-fg">{t("guide2t")}</span>
          </li>
          <li>
            <span className="font-medium text-fg">{t("guide3t")}</span>
          </li>
          <li>
            <span className="font-medium text-fg">{t("guide4t")}</span>
          </li>
          <li>
            <span className="font-medium text-fg">{t("guide5t")}</span> {t("guide5")}
          </li>
        </ol>
      </div>
      <SiteFooter className="mt-auto px-4 pb-4" />
    </div>
  );
}
