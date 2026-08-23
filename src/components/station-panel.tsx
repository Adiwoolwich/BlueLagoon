import { useMemo, useState } from "react";
import { CitySelect } from "./city-select";
import { GoogleMapsButton } from "./google-maps-button";
import { HoursTable } from "./hours-table";
import { StatusBadge } from "./status-badge";
import { formatKm, haversineKm } from "../lib/geo";
import { CITIES, findCity, type Station } from "../lib/stations";
import { allStations, RADIUS_OPTIONS, useAppStore } from "../lib/store";
import { cn } from "../lib/utils";

const TYPE_LABEL: Record<Station["type"], string> = {
  cassette: "Kassette",
  combo: "Kombi V+E",
  camperclean: "CamperClean",
  municipal: "Kommunal",
  greywater: "Nur Grauwasser",
};

const FEE_LABEL: Record<Station["fee"], string> = {
  free: "Kostenlos",
  paid: "Gebühr",
  unknown: "Preis unklar",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
        active ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-border hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function StationPanel({ stations }: { stations: Station[] }) {
  const panel = useAppStore((s) => s.panel);
  const selectedId = useAppStore((s) => s.selectedId);
  const extra = useAppStore((s) => s.extraStations);
  const selected = allStations(extra).find((s) => s.id === selectedId);
  if (panel === "detail" && selected) return <Detail station={selected} />;
  if (panel === "saved") return <SavedList />;
  if (panel === "route") return <RoutePlanner stations={stations} />;
  return <StationList stations={stations} />;
}

export function SearchAndFilters({ count, compact }: { count: number; compact?: boolean }) {
  const query = useAppStore((s) => s.query);
  const setQuery = useAppStore((s) => s.setQuery);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const setPanel = useAppStore((s) => s.setPanel);
  const setSheet = useAppStore((s) => s.setSheet);
  const panel = useAppStore((s) => s.panel);
  const userPos = useAppStore((s) => s.userPos);
  const hasOrigin = Boolean(filters.place.trim() || userPos);

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, PLZ, Stichwort …"
          className="h-11 w-full rounded-xl bg-surface pr-3 pl-10 text-base text-fg shadow-border outline-none placeholder:text-subtle focus:ring-2 focus:ring-primary/50 md:text-sm"
        />
      </div>
      {compact ? (
        <button
          type="button"
          onClick={() => setSheet("mid")}
          className="flex h-11 w-full items-center justify-between rounded-xl bg-surface px-3 text-sm text-fg shadow-border"
        >
          <span className="tabular-nums">{count} Stationen</span>
          <span className="text-primary">Liste öffnen</span>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_7.25rem] gap-2">
            <CitySelect label="Ort" value={filters.place} onChange={(place) => setFilters({ place })} placeholder="Stadt wählen …" />
            <label className="relative block">
              <span className="mb-1 block text-xs font-medium text-muted">Umkreis</span>
              <select
                value={filters.radiusKm}
                disabled={!hasOrigin}
                onChange={(e) => setFilters({ radiusKm: Number(e.target.value) })}
                className="h-11 w-full appearance-none rounded-xl bg-surface py-0 pr-8 pl-3 text-base text-fg shadow-border outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 md:text-sm"
              >
                {RADIUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={filters.cassette} onClick={() => setFilters({ cassette: !filters.cassette })}>Kassette</Chip>
            <Chip active={filters.freeOnly} onClick={() => setFilters({ freeOnly: !filters.freeOnly })}>Kostenlos</Chip>
            <Chip active={filters.openNow} onClick={() => setFilters({ openNow: !filters.openNow })}>Jetzt offen</Chip>
            <Chip active={filters.hose} onClick={() => setFilters({ hose: !filters.hose })}>Schlauch</Chip>
            <Chip active={filters.camperclean} onClick={() => setFilters({ camperclean: !filters.camperclean })}>Automat</Chip>
            <Chip active={filters.confirmed} onClick={() => setFilters({ confirmed: !filters.confirmed })}>Bestätigt</Chip>
            <button type="button" onClick={resetFilters} className="inline-flex h-11 shrink-0 items-center px-2 text-xs text-muted hover:text-fg">Reset</button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="tabular-nums">{count} Stationen</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPanel(panel === "route" ? "list" : "route")} className={cn("h-11 px-1 hover:text-fg", panel === "route" && "text-primary")}>Route</button>
              <button type="button" onClick={() => setPanel(panel === "saved" ? "list" : "saved")} className={cn("h-11 px-1 hover:text-fg", panel === "saved" && "text-primary")}>Merkliste</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StationList({ stations }: { stations: Station[] }) {
  const userPos = useAppStore((s) => s.userPos);
  const reports = useAppStore((s) => s.reports);
  const select = useAppStore((s) => s.select);
  const selectedId = useAppStore((s) => s.selectedId);
  const favorites = useAppStore((s) => s.favorites);
  const sorted = useMemo(() => {
    return [...stations].sort((a, b) => {
      if (userPos) return haversineKm(userPos, a) - haversineKm(userPos, b);
      return a.name.localeCompare(b.name, "de");
    });
  }, [stations, userPos]);
  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-lg text-fg">Keine Station in der Filterung</p>
        <p className="mt-1 text-sm text-muted">Filter lockern oder anderen Ort suchen.</p>
      </div>
    );
  }
  return (
    <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
      {sorted.map((s) => {
        const km = userPos ? haversineKm(userPos, s) : null;
        return (
          <li key={s.id}>
            <button type="button" onClick={() => select(s.id)} className={cn("w-full rounded-xl p-3 text-left shadow-border", s.id === selectedId ? "bg-surface-2" : "bg-surface hover:bg-surface-2")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{s.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{s.postalCode} {s.city} · {TYPE_LABEL[s.type]}</p>
                </div>
                {favorites.includes(s.id) ? <span className="text-primary">★</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge station={s} report={reports[s.id]} />
                <span className="text-xs text-muted">{FEE_LABEL[s.fee]}</span>
                {km != null ? <span className="text-xs text-muted tabular-nums">{formatKm(km)}</span> : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SavedList() {
  const favorites = useAppStore((s) => s.favorites);
  const recent = useAppStore((s) => s.recent);
  const extra = useAppStore((s) => s.extraStations);
  const select = useAppStore((s) => s.select);
  const setPanel = useAppStore((s) => s.setPanel);
  const catalog = allStations(extra);
  const favs = favorites.map((id) => catalog.find((s) => s.id === id)).filter((s): s is Station => Boolean(s));
  const recents = recent.map((id) => catalog.find((s) => s.id === id)).filter((s): s is Station => Boolean(s));
  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">← Liste</button>
      <section>
        <h3 className="mb-2 font-display text-lg">Merkliste</h3>
        {favs.length === 0 ? <p className="text-sm text-muted">Noch keine Station gemerkt.</p> : (
          <ul className="space-y-2">{favs.map((s) => (<li key={s.id}><button type="button" onClick={() => select(s.id)} className="w-full rounded-xl bg-surface p-3 text-left shadow-border"><p className="font-medium">{s.name}</p><p className="text-xs text-muted">{s.city}</p></button></li>))}</ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-display text-lg">Zuletzt angesehen</h3>
        {recents.length === 0 ? <p className="text-sm text-muted">Noch keine Station geöffnet.</p> : (
          <ul className="space-y-2">{recents.map((s) => (<li key={s.id}><button type="button" onClick={() => select(s.id)} className="w-full rounded-xl bg-surface p-3 text-left shadow-border"><p className="font-medium">{s.name}</p><p className="text-xs text-muted">{s.city}</p></button></li>))}</ul>
        )}
      </section>
    </div>
  );
}

function RoutePlanner({ stations }: { stations: Station[] }) {
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const setPanel = useAppStore((s) => s.setPanel);
  const select = useAppStore((s) => s.select);
  const [from, setFrom] = useState(route?.from ?? "");
  const [to, setTo] = useState(route?.to ?? "");
  const [error, setError] = useState<string | null>(null);
  const fromCity = findCity(from);
  const toCity = findCity(to);
  function apply() {
    if (!fromCity || !toCity) { setError("Bitte Start und Ziel aus der Städteliste wählen."); return; }
    if (fromCity.name === toCity.name) { setError("Start und Ziel müssen unterschiedlich sein."); return; }
    setError(null);
    setRoute({ from: fromCity.name, to: toCity.name });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">← Liste</button>
      <h3 className="font-display text-lg">Stationen entlang der Route</h3>
      <CitySelect label="Von" value={from} onChange={setFrom} placeholder="Startstadt wählen …" />
      <CitySelect label="Nach" value={to} onChange={setTo} placeholder="Zielstadt wählen …" />
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={apply} disabled={!fromCity || !toCity || fromCity.name === toCity.name} className="h-11 flex-1 rounded-xl bg-primary text-sm font-medium text-primary-fg disabled:opacity-40">Korridor zeigen</button>
        <button type="button" onClick={() => { setRoute(null); setFrom(""); setTo(""); setError(null); }} className="h-11 rounded-xl bg-surface px-4 text-sm text-muted shadow-border">Reset</button>
      </div>
      {route && fromCity && toCity ? <p className="text-xs text-muted">Korridor {fromCity.name} → {toCity.name} · {stations.length} Stationen · {CITIES.length} Städte</p> : null}
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {stations.map((s) => (
          <li key={s.id}><button type="button" onClick={() => select(s.id)} className="w-full rounded-xl bg-surface p-3 text-left shadow-border"><p className="font-medium">{s.name}</p><p className="text-xs text-muted">{s.city} · {TYPE_LABEL[s.type]}</p></button></li>
        ))}
      </ul>
    </div>
  );
}

function Detail({ station }: { station: Station }) {
  const reports = useAppStore((s) => s.reports);
  const report = useAppStore((s) => s.report);
  const notes = useAppStore((s) => s.notes);
  const setNote = useAppStore((s) => s.setNote);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const select = useAppStore((s) => s.select);
  const setPanel = useAppStore((s) => s.setPanel);
  const userPos = useAppStore((s) => s.userPos);
  const [noteDraft, setNoteDraft] = useState(notes[station.id] ?? "");
  const km = userPos ? haversineKm(userPos, station) : null;
  const fav = favorites.includes(station.id);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button type="button" onClick={() => { select(null); setPanel("list"); }} className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg">← Zurück</button>
        <button type="button" onClick={() => toggleFavorite(station.id)} className="inline-flex h-11 items-center rounded-xl bg-surface px-3 text-sm shadow-border">{fav ? "Gemerkt ★" : "Merken"}</button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        <header>
          <p className="text-xs tracking-wide text-muted uppercase">{station.state} · {TYPE_LABEL[station.type]}</p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-fg">{station.name}</h2>
          <p className="mt-1 text-sm text-muted">{station.address}, {station.postalCode} {station.city}</p>
        </header>
        <div className="flex flex-wrap gap-2">
          <StatusBadge station={station} report={reports[station.id]} />
          <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted">{FEE_LABEL[station.fee]}</span>
          {km != null ? <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted tabular-nums">{formatKm(km)}</span> : null}
        </div>
        <GoogleMapsButton lat={station.lat} lng={station.lng} label={station.name} />
        <HoursTable station={station} />
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("rounded-md px-2 py-1 text-xs", station.cassette ? "bg-ok/12 text-ok" : "bg-surface-2 text-subtle")}>Kassette</span>
          <span className={cn("rounded-md px-2 py-1 text-xs", station.hose ? "bg-ok/12 text-ok" : "bg-surface-2 text-subtle")}>Schlauch</span>
        </div>
        {station.feeNote ? <p className="text-sm text-muted">{station.feeNote}</p> : null}
        <section>
          <h3 className="mb-2 text-sm font-medium">Status melden</h3>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => report({ stationId: station.id, status: "confirmed", at: Date.now() })} className="h-11 rounded-xl bg-surface text-sm shadow-border">Gerade genutzt</button>
            <button type="button" onClick={() => report({ stationId: station.id, status: "broken", at: Date.now() })} className="h-11 rounded-xl bg-bad/12 text-sm text-bad">Defekt</button>
            <button type="button" onClick={() => report({ stationId: station.id, status: "closed", at: Date.now() })} className="h-11 rounded-xl bg-surface text-sm shadow-border">Geschlossen</button>
            <button type="button" onClick={() => report({ stationId: station.id, status: "open", at: Date.now() })} className="h-11 rounded-xl bg-surface text-sm shadow-border">Offen</button>
          </div>
        </section>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Persönliche Notiz</span>
          <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={() => setNote(station.id, noteDraft)} rows={3} className="w-full resize-none rounded-xl bg-surface p-3 text-sm shadow-border outline-none" placeholder="Zufahrt, Münzen, Geruch …" />
        </label>
      </div>
    </div>
  );
}

export function LocateButton({ floating }: { floating?: boolean }) {
  const setUserPos = useAppStore((s) => s.setUserPos);
  const setFilters = useAppStore((s) => s.setFilters);
  const setSheet = useAppStore((s) => s.setSheet);
  return (
    <button
      type="button"
      onClick={() => {
        const apply = (lat: number, lng: number) => {
          setUserPos({ lat, lng });
          setFilters({ place: "", radiusKm: 50 });
          setSheet("mid");
        };
        if (!navigator.geolocation) { apply(50.1109, 8.6821); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => apply(pos.coords.latitude, pos.coords.longitude),
          () => apply(50.1109, 8.6821),
        );
      }}
      className={floating ? "grid size-12 place-items-center rounded-full bg-bg-elevated text-fg shadow-panel" : "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-fg shadow-border sm:w-auto sm:gap-2 sm:px-3"}
      aria-label="In der Nähe"
    >
      ⌖{floating ? null : <span className="hidden sm:inline">In der Nähe</span>}
    </button>
  );
}

export function RouteToggle() {
  const setPanel = useAppStore((s) => s.setPanel);
  return (
    <button type="button" onClick={() => setPanel("route")} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-fg shadow-border" aria-label="Route">
      ↗
    </button>
  );
}
