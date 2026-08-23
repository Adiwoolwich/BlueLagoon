import { useMemo, useState } from "react";
import { CitySelect } from "./city-select";
import { GoogleMapsButton } from "./google-maps-button";
import { AddStationForm } from "./add-station-form";
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
  guest: "Nur Gäste / im Preis",
};

function Chip({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-full items-center justify-center overflow-hidden rounded-full px-1 text-center text-xs font-medium md:h-10",
        active ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-border hover:text-fg",
      )}
    >
      <span className="block max-w-full truncate">{children}</span>
    </button>
  );
}

export function StationPanel({ stations }: { stations: Station[] }) {
  const panel = useAppStore((s) => s.panel);
  const selectedId = useAppStore((s) => s.selectedId);
  const extra = useAppStore((s) => s.extraStations);
  const selected = allStations(extra).find((s) => s.id === selectedId);
  let body: React.ReactNode;
  if (panel === "add") body = <AddStationForm />;
  else if (panel === "detail" && selected) body = <Detail station={selected} />;
  else if (panel === "saved") body = <SavedList />;
  else if (panel === "route") body = <RoutePlanner stations={stations} />;
  else body = <StationList stations={stations} />;
  return <div className="flex h-full min-h-0 flex-1 flex-col">{body}</div>;
}

export function SearchAndFilters({ count, compact }: { count: number; compact?: boolean }) {
  const query = useAppStore((s) => s.query);
  const setQuery = useAppStore((s) => s.setQuery);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const setPanel = useAppStore((s) => s.setPanel);
  const setSheet = useAppStore((s) => s.setSheet);
  const setUserPos = useAppStore((s) => s.setUserPos);
  const panel = useAppStore((s) => s.panel);
  const userPos = useAppStore((s) => s.userPos);
  const hasOrigin = Boolean(findCity(query) || findCity(filters.place) || userPos);

  return (
    <div className="shrink-0 space-y-2">
      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          <CitySelect
            value={filters.place || query}
            onChange={(place) => {
              setQuery(place);
              setFilters({ place });
              if (place.trim()) setUserPos(null);
            }}
            placeholder="Stadt, Ortsteil oder PLZ …"
            warnUnmatched={false}
          />
        </div>
        <LocateButton iconOnly />
        <label className="relative block w-[4.5rem] shrink-0 self-end">
          <span className="sr-only">Umkreis</span>
          <select
            value={filters.radiusKm}
            disabled={!hasOrigin}
            onChange={(e) => setFilters({ radiusKm: Number(e.target.value) })}
            className="h-11 w-full appearance-none rounded-2xl bg-surface py-0 pr-6 pl-2 text-sm text-fg shadow-border outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            aria-label="Umkreis"
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-muted" />
        </label>
      </div>
      {compact ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSheet("mid")}
            className="flex h-11 min-w-0 flex-1 items-center justify-between rounded-xl bg-surface px-3 text-sm text-fg shadow-border"
          >
            <span className="tabular-nums">{count} Stationen</span>
            <span className="text-primary">Liste öffnen</span>
          </button>
          <button
            type="button"
            onClick={() => setPanel("add")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-fg transition-[transform] active:scale-95"
            aria-label="Örtlichkeit hinzufügen"
          >
            +
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1">
            <Chip active={filters.cassette} onClick={() => setFilters({ cassette: !filters.cassette })} label="Kassette">Kassette</Chip>
            <Chip active={filters.freeOnly} onClick={() => setFilters({ freeOnly: !filters.freeOnly })} label="Kostenlos">Kostenlos</Chip>
            <Chip active={filters.openNow} onClick={() => setFilters({ openNow: !filters.openNow })} label="Jetzt offen">Offen</Chip>
            <Chip active={filters.hose} onClick={() => setFilters({ hose: !filters.hose })} label="Schlauch">Schlauch</Chip>
            <Chip active={filters.camperclean} onClick={() => setFilters({ camperclean: !filters.camperclean })} label="Automat">Automat</Chip>
            <Chip active={filters.campsite} onClick={() => setFilters({ campsite: !filters.campsite })} label="Campingplatz">Camping</Chip>
            <Chip active={filters.confirmed} onClick={() => setFilters({ confirmed: !filters.confirmed })} label="Bestätigt">Bestätigt</Chip>
            <button type="button" onClick={resetFilters} className="flex h-9 w-full items-center justify-center rounded-full bg-surface px-1 text-xs text-muted shadow-border hover:text-fg md:h-10">Reset</button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="tabular-nums">{count} Stationen</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPanel(panel === "route" ? "list" : "route")} className={cn("h-11 px-1 hover:text-fg", panel === "route" && "text-primary")}>Route</button>
              <button type="button" onClick={() => setPanel(panel === "saved" ? "list" : "saved")} className={cn("h-11 px-1 hover:text-fg", panel === "saved" && "text-primary")}>Merkliste</button>
              <button type="button" onClick={() => setPanel("add")} className="inline-flex h-11 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-fg transition-[transform,filter] active:scale-95" aria-label="Örtlichkeit hinzufügen">+</button>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted">
        <p className="text-sm">Keine Stationen für diese Filter.</p>
        <p className="text-xs">Filter zurücksetzen oder Umkreis vergrößern.</p>
      </div>
    );
  }
  return (
    <ul className="bl-scroll divide-y divide-border/50">
      {sorted.map((s) => {
        const km = userPos ? haversineKm(userPos, s) : null;
        const fav = favorites.includes(s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => select(s.id)}
              className={cn(
                "flex w-full items-start gap-3 px-1 py-3 text-left transition-[transform,background-color] duration-150 active:scale-[0.99]",
                selectedId === s.id ? "bg-primary/8" : "hover:bg-surface/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-fg">{s.name}</span>
                  {fav ? <span className="text-xs text-primary">★</span> : null}
                </div>
                <p className="truncate text-xs text-muted">{s.city} · {TYPE_LABEL[s.type]} · {FEE_LABEL[s.fee]}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {km != null ? <span className="text-xs tabular-nums text-muted">{formatKm(km)}</span> : null}
                <StatusBadge station={s} report={reports[s.id]} compact />
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
  const extra = useAppStore((s) => s.extraStations);
  const select = useAppStore((s) => s.select);
  const setPanel = useAppStore((s) => s.setPanel);
  const stations = allStations(extra).filter((s) => favorites.includes(s.id));
  return (
    <div className="flex h-full flex-col">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">← Liste</button>
      <h2 className="mt-2 mb-3 text-lg font-semibold">Merkliste</h2>
      {stations.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Stationen gemerkt.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {stations.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => select(s.id)} className="flex w-full items-center justify-between py-3 text-left">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted">{s.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoutePlanner({ stations }: { stations: Station[] }) {
  const setPanel = useAppStore((s) => s.setPanel);
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const [from, setFrom] = useState(route?.from ?? "");
  const [to, setTo] = useState(route?.to ?? "");
  return (
    <div className="flex h-full flex-col gap-4">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">← Liste</button>
      <h2 className="text-lg font-semibold">Route</h2>
      <Field label="Von">
        <CitySelect value={from} onChange={setFrom} placeholder="Startort" />
      </Field>
      <Field label="Nach">
        <CitySelect value={to} onChange={setTo} placeholder="Zielort" />
      </Field>
      <button
        type="button"
        onClick={() => {
          setRoute(from.trim() && to.trim() ? { from: from.trim(), to: to.trim() } : null);
          setPanel("list");
        }}
        className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-fg"
      >
        Route anwenden
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
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
  const removeExtra = useAppStore((s) => s.removeExtraStation);
  const [noteDraft, setNoteDraft] = useState(notes[station.id] ?? "");
  const km = userPos ? haversineKm(userPos, station) : null;
  const fav = favorites.includes(station.id);
  const isUserStation = station.id.startsWith("user-") || station.source === "community";
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button type="button" onClick={() => { select(null); setPanel("list"); }} className="inline-flex h-11 items-center gap-1 text-sm text-muted transition-[transform,color] duration-150 hover:text-fg active:scale-95">← Zurück</button>
        <div className="flex gap-2">
          {isUserStation ? (
            <button type="button" onClick={() => { removeExtra(station.id); }} className="inline-flex h-11 items-center rounded-xl bg-bad/12 px-3 text-sm text-bad shadow-border transition-[transform,background-color] duration-150 hover:bg-bad/22 active:scale-95">Löschen</button>
          ) : null}
          <button type="button" onClick={() => toggleFavorite(station.id)} className="inline-flex h-11 items-center rounded-xl bg-surface px-3 text-sm shadow-border transition-[transform,background-color] duration-150 hover:bg-surface-2 active:scale-95">{fav ? "Gemerkt ★" : "Merken"}</button>
        </div>
      </div>
      <div className="bl-scroll space-y-4 pr-1">
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
            {(
              [
                ["ok", "Gerade genutzt", false],
                ["broken", "Defekt", true],
                ["closed", "Geschlossen", false],
                ["dirty", "Unsauber", false],
              ] as const
            ).map(([kind, label, bad]) => {
              const selected = reports[station.id]?.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => report({ stationId: station.id, kind, at: new Date().toISOString() })}
                  className={cn(
                    "h-11 rounded-xl text-sm font-medium shadow-border transition-[transform,filter,background-color,color] duration-150 active:scale-95",
                    selected
                      ? bad
                        ? "bg-bad text-fg ring-2 ring-bad/50"
                        : "bg-primary text-primary-fg ring-2 ring-primary/40"
                      : bad
                        ? "bg-bad/12 text-bad hover:bg-bad/22"
                        : "bg-surface text-fg hover:bg-surface-2",
                  )}
                >
                  {label}
                </button>
              );
            })}
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

export function LocateButton({ iconOnly, floating }: { iconOnly?: boolean; floating?: boolean }) {
  const setUserPos = useAppStore((s) => s.setUserPos);
  const setFilters = useAppStore((s) => s.setFilters);
  const setQuery = useAppStore((s) => s.setQuery);
  return (
    <button
      type="button"
      onClick={() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setFilters({ place: "" });
            setQuery("");
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }}
      className={cn(
        "inline-flex items-center justify-center text-sm shadow-border transition-[transform] active:scale-95",
        floating
          ? "size-11 rounded-full bg-surface/95 backdrop-blur"
          : "h-11 shrink-0 rounded-2xl bg-surface",
        iconOnly || floating ? "w-11" : "px-3",
      )}
      aria-label="Standort"
    >
      {iconOnly || floating ? "◎" : "Standort"}
    </button>
  );
}

function RouteToggle() {
  const setPanel = useAppStore((s) => s.setPanel);
  return (
    <button type="button" onClick={() => setPanel("route")} className="inline-flex size-9 items-center justify-center rounded-full text-fg hover:bg-surface-2 sm:size-10" aria-label="Route">
      ↗
    </button>
  );
}
