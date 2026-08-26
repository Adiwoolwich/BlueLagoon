import { useMemo, useState } from "react";
import { LocateFixed, Plus, Share2, Star } from "lucide-react";
import { CitySelect } from "./city-select";
import { GoogleMapsButton } from "./google-maps-button";
import { AddStationForm } from "./add-station-form";
import { HoursTable } from "./hours-table";
import { StatusBadge } from "./status-badge";
import { formatKm, haversineKm, inBounds } from "../lib/geo";
import { downloadGpx, downloadStationGpx } from "../lib/gpx";
import { fetchDrivingRoute } from "../lib/osrm";
import {
  canNavigateTo,
  FEE_LABEL,
  findCity,
  hasPreciseCoords,
  hoursSummary,
  TYPE_LABEL,
  type Station,
} from "../lib/stations";
import {
  allStations,
  CORRIDOR_OPTIONS,
  RADIUS_OPTIONS,
  useAppStore,
  type Filters,
} from "../lib/store";
import { copyShareUrl, shareUrl } from "../lib/url-state";
import { cn } from "../lib/utils";

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
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-medium",
        active ? "bg-primary text-primary-fg" : "bg-surface text-fg ring-1 ring-border hover:ring-border-strong",
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
  let body: React.ReactNode;
  if (panel === "add") body = <AddStationForm />;
  else if (panel === "detail" && selected) body = <Detail station={selected} />;
  else if (panel === "saved") body = <SavedList />;
  else if (panel === "route") body = <RoutePlanner />;
  else body = <StationList stations={stations} />;
  return <div className="flex h-full min-h-0 flex-1 flex-col">{body}</div>;
}

export function SearchBar() {
  const query = useAppStore((s) => s.query);
  const setQuery = useAppStore((s) => s.setQuery);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const setUserPos = useAppStore((s) => s.setUserPos);
  const userPos = useAppStore((s) => s.userPos);
  const hasOrigin = Boolean(findCity(query) || findCity(filters.place) || userPos);

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <CitySelect
          value={filters.place || query}
          onChange={(place) => {
            setQuery(place);
            setFilters({ place });
            if (place.trim()) setUserPos(null);
          }}
          placeholder="Ort, Stadt oder PLZ …"
          warnUnmatched={false}
        />
      </div>
      <label className="relative block w-[4.6rem] shrink-0 self-end">
        <span className="sr-only">Umkreis</span>
        <select
          value={filters.radiusKm}
          disabled={!hasOrigin}
          onChange={(e) => setFilters({ radiusKm: Number(e.target.value) })}
          className="h-11 w-full appearance-none rounded-xl bg-surface py-0 pr-6 pl-2 text-sm text-fg ring-1 ring-border outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          aria-label="Umkreis"
        >
          {RADIUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-muted" />
      </label>
    </div>
  );
}

const CHIP_DEFS: {
  key: keyof Filters;
  label: string;
  aria: string;
}[] = [
  { key: "cassette", label: "Kassette", aria: "Kassette anzeigen" },
  { key: "greywater", label: "Grauwasser", aria: "Nur mit Grauwasser" },
  { key: "freshwater", label: "Frischwasser", aria: "Nur mit Frischwasser" },
  { key: "feeFree", label: "Kostenlos", aria: "Kostenlos" },
  { key: "feePaid", label: "Bezahlt", aria: "Mit Gebühr" },
  { key: "feeGuest", label: "Nur Gäste", aria: "Nur Gäste / im Preis" },
  { key: "openNow", label: "Jetzt offen", aria: "Jetzt geöffnet" },
  { key: "h24", label: "24h", aria: "Rund um die Uhr" },
  { key: "campsite", label: "Campingplatz", aria: "Campingplätze anzeigen" },
  { key: "camperclean", label: "CamperClean", aria: "CamperClean anzeigen" },
  { key: "hose", label: "Schlauch", aria: "Mit Schlauch" },
  { key: "confirmed", label: "Bestätigt", aria: "Community bestätigt" },
];

export function FilterChips() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CHIP_DEFS.map((c) => (
        <Chip
          key={c.key}
          active={Boolean(filters[c.key])}
          onClick={() => setFilters({ [c.key]: !filters[c.key] })}
          label={c.aria}
        >
          {c.label}
        </Chip>
      ))}
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs text-muted ring-1 ring-border hover:text-fg"
      >
        Reset
      </button>
    </div>
  );
}

export function ListToolbar({ count }: { count: number }) {
  const setPanel = useAppStore((s) => s.setPanel);
  const panel = useAppStore((s) => s.panel);
  const route = useAppStore((s) => s.route);
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted">
      <span className="tabular-nums">{count} im Ausschnitt</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPanel(panel === "route" ? "list" : "route")}
          className={cn("h-9 px-2 hover:text-fg", (panel === "route" || route) && "text-primary")}
        >
          Route
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "saved" ? "list" : "saved")}
          className={cn("h-9 px-2 hover:text-fg", panel === "saved" && "text-primary")}
        >
          Merkliste
        </button>
        <button
          type="button"
          onClick={() => setPanel("add")}
          className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg"
          aria-label="Örtlichkeit hinzufügen"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SearchAndFilters({ count, compact }: { count: number; compact?: boolean }) {
  const setSheet = useAppStore((s) => s.setSheet);
  const setPanel = useAppStore((s) => s.setPanel);
  if (compact) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSheet("mid")}
          className="flex h-11 min-w-0 flex-1 items-center justify-between rounded-xl bg-surface px-3 text-sm text-fg ring-1 ring-border"
        >
          <span className="tabular-nums">{count} Stationen</span>
          <span className="text-primary">Liste</span>
        </button>
        <button
          type="button"
          onClick={() => setPanel("add")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg"
          aria-label="Örtlichkeit hinzufügen"
        >
          <Plus className="size-5" />
        </button>
      </div>
    );
  }
  return (
    <div className="shrink-0 space-y-2">
      <div className="hidden md:block">
        <SearchBar />
      </div>
      <FilterChips />
      <ListToolbar count={count} />
    </div>
  );
}

function StationList({ stations }: { stations: Station[] }) {
  const userPos = useAppStore((s) => s.userPos);
  const reports = useAppStore((s) => s.reports);
  const select = useAppStore((s) => s.select);
  const selectedId = useAppStore((s) => s.selectedId);
  const favorites = useAppStore((s) => s.favorites);
  const bounds = useAppStore((s) => s.bounds);
  const visible = useMemo(() => {
    const inView = bounds
      ? stations.filter((s) => hasPreciseCoords(s) && inBounds(s, bounds))
      : stations.filter(hasPreciseCoords);
    return [...inView].sort((a, b) => {
      if (userPos) return haversineKm(userPos, a) - haversineKm(userPos, b);
      return a.name.localeCompare(b.name, "de");
    });
  }, [stations, userPos, bounds]);

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted">
        <p className="text-sm">Keine Stationen in diesem Kartenausschnitt.</p>
        <p className="text-xs">Zoome heraus oder Filter zurücksetzen.</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-1 flex items-center justify-end">
        <button
          type="button"
          onClick={() => downloadGpx(visible.slice(0, 200), "blue-lagune-ansicht.gpx")}
          className="h-8 text-[11px] text-muted hover:text-fg"
        >
          GPX
        </button>
      </div>
    <ul className="bl-scroll divide-y divide-border/50">
      {visible.map((s) => {
        const km = userPos && hasPreciseCoords(s) ? haversineKm(userPos, s) : null;
        const fav = favorites.includes(s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => select(s.id)}
              className={cn(
                "flex w-full items-start gap-3 px-1 py-3 text-left",
                selectedId === s.id ? "bg-primary/8" : "hover:bg-surface/80",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold text-fg">{s.name}</span>
                  {fav ? <Star className="size-3.5 shrink-0 fill-primary text-primary" /> : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {s.city} · {TYPE_LABEL[s.type]} · {FEE_LABEL[s.fee]}
                </p>
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
    </div>
  );
}

function SavedList() {
  const favorites = useAppStore((s) => s.favorites);
  const recent = useAppStore((s) => s.recent);
  const extra = useAppStore((s) => s.extraStations);
  const select = useAppStore((s) => s.select);
  const setPanel = useAppStore((s) => s.setPanel);
  const all = allStations(extra);
  const saved = all.filter((s) => favorites.includes(s.id));
  const last = recent
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is Station => Boolean(s))
    .slice(0, 8);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg">
        ← Liste
      </button>
      <h2 className="mt-1 mb-3 text-lg font-semibold">Merkliste</h2>
      <div className="bl-scroll">
        {saved.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Stationen gemerkt.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {saved.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => select(s.id)} className="flex w-full items-center justify-between py-3 text-left">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted">{s.city}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {last.length ? (
          <>
            <h3 className="mt-6 mb-2 text-sm font-medium text-muted">Zuletzt angesehen</h3>
            <ul className="divide-y divide-border/50">
              {last.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => select(s.id)} className="flex w-full items-center justify-between py-3 text-left">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted">{s.city}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function RoutePlanner() {
  const setPanel = useAppStore((s) => s.setPanel);
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const setRoutePath = useAppStore((s) => s.setRoutePath);
  const routePath = useAppStore((s) => s.routePath);
  const corridorKm = useAppStore((s) => s.corridorKm);
  const setCorridorKm = useAppStore((s) => s.setCorridorKm);
  const [from, setFrom] = useState(route?.from ?? "");
  const [to, setTo] = useState(route?.to ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setError("");
    const a = findCity(from);
    const b = findCity(to);
    if (!from.trim() || !to.trim()) {
      setRoute(null);
      setRoutePath(null);
      setPanel("list");
      return;
    }
    if (!a || !b) {
      setError("Start und Ziel aus der Vorschlagsliste wählen.");
      return;
    }
    setBusy(true);
    setRoute({ from: from.trim(), to: to.trim() });
    try {
      const path = await fetchDrivingRoute(from.trim(), to.trim(), a, b);
      setRoutePath(path);
      setPanel("list");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <button type="button" onClick={() => setPanel("list")} className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg">
        ← Liste
      </button>
      <h2 className="text-lg font-semibold">Route</h2>
      <p className="text-sm text-muted">Stationen entlang der Strecke, nicht nur Luftlinie.</p>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Von</span>
        <CitySelect value={from} onChange={setFrom} placeholder="Startort" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Nach</span>
        <CitySelect value={to} onChange={setTo} placeholder="Zielort" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Korridor</span>
        <select
          value={corridorKm}
          onChange={(e) => setCorridorKm(Number(e.target.value))}
          className="h-11 w-full rounded-xl bg-surface px-3 text-sm ring-1 ring-border outline-none"
        >
          {CORRIDOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {routePath?.source === "straight" ? (
        <p className="rounded-xl bg-stale/10 px-3 py-2 text-sm text-stale">
          Straßenroute nicht verfügbar – Luftlinie mit Korridor.
        </p>
      ) : null}
      {routePath?.source === "osrm" ? (
        <p className="text-sm text-muted">
          {Math.round(routePath.distanceKm)} km · ca. {routePath.durationMin} min
        </p>
      ) : null}
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void apply()}
        className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-fg disabled:opacity-60"
      >
        {busy ? "Route wird berechnet …" : "Route anwenden"}
      </button>
      {route ? (
        <button
          type="button"
          onClick={() => {
            setRoute(null);
            setRoutePath(null);
            setPanel("list");
          }}
          className="h-11 rounded-xl text-sm text-muted ring-1 ring-border hover:text-fg"
        >
          Route löschen
        </button>
      ) : null}
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
  const removeExtra = useAppStore((s) => s.removeExtraStation);
  const mapView = useAppStore((s) => s.mapView);
  const filters = useAppStore((s) => s.filters);
  const query = useAppStore((s) => s.query);
  const [noteDraft, setNoteDraft] = useState(notes[station.id] ?? "");
  const [copied, setCopied] = useState(false);
  const km = userPos && hasPreciseCoords(station) ? haversineKm(userPos, station) : null;
  const fav = favorites.includes(station.id);
  const isUserStation = station.id.startsWith("user-") || station.source === "community";
  const navOk = canNavigateTo(station);

  async function share() {
    const url = shareUrl({ ...mapView, id: station.id, filters, query });
    try {
      if (navigator.share) {
        await navigator.share({ title: station.name, url });
        return;
      }
    } catch {
      /* fall through */
    }
    const ok = await copyShareUrl();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            select(null);
            setPanel("list");
          }}
          className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg"
        >
          ← Zurück
        </button>
        <div className="flex gap-2">
          {isUserStation ? (
            <button
              type="button"
              onClick={() => {
                removeExtra(station.id);
              }}
              className="inline-flex h-11 items-center rounded-xl bg-bad/12 px-3 text-sm text-bad ring-1 ring-border"
            >
              Löschen
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => toggleFavorite(station.id)}
            className="inline-flex h-11 items-center gap-1 rounded-xl bg-surface px-3 text-sm ring-1 ring-border"
          >
            <Star className={cn("size-4", fav && "fill-primary text-primary")} />
            {fav ? "Gemerkt" : "Merken"}
          </button>
        </div>
      </div>
      <div className="bl-scroll space-y-4 pr-1">
        <header>
          <p className="text-xs tracking-wide text-muted uppercase">
            {station.state} · {TYPE_LABEL[station.type]}
          </p>
          <h2 className="mt-1 text-2xl leading-tight font-semibold text-fg">{station.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {station.address}, {station.postalCode} {station.city}
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <StatusBadge station={station} report={reports[station.id]} />
          <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted ring-1 ring-border">
            {FEE_LABEL[station.fee]}
          </span>
          {km != null ? (
            <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted tabular-nums ring-1 ring-border">
              {formatKm(km)}
            </span>
          ) : null}
        </div>
        <GoogleMapsButton
          lat={navOk && hasPreciseCoords(station) ? station.lat : undefined}
          lng={navOk && hasPreciseCoords(station) ? station.lng : undefined}
          label={station.name}
          address={station.address}
          city={station.city}
          postalCode={station.postalCode}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface text-sm ring-1 ring-border"
          >
            <Share2 className="size-4" />
            {copied ? "Link kopiert" : "Teilen"}
          </button>
          {hasPreciseCoords(station) ? (
            <button
              type="button"
              onClick={() => downloadStationGpx(station)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-surface text-sm ring-1 ring-border"
            >
              GPX
            </button>
          ) : null}
        </div>
        {station.hours === "seasonal" ? (
          <p className="rounded-lg bg-stale/10 px-3 py-2 text-xs text-stale">
            Saisonale Station – im Winter oft geschlossen. Zeiten vor der Anfahrt prüfen.
          </p>
        ) : null}
        <HoursTable station={station} />
        <p className="text-sm text-muted">{hoursSummary(station)}</p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["Kassette", station.cassette],
              ["Grauwasser", station.greywater],
              ["Frischwasser", station.freshwater],
              ["Schlauch", station.hose],
            ] as const
          ).map(([label, on]) => (
            <span
              key={label}
              className={cn("rounded-md px-2 py-1 text-xs", on ? "bg-ok/12 text-ok" : "bg-surface-2 text-subtle")}
            >
              {label}
            </span>
          ))}
        </div>
        {station.feeNote ? <p className="text-sm text-muted">{station.feeNote}</p> : null}
        {station.description ? <p className="text-sm leading-relaxed text-muted">{station.description}</p> : null}
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
                    "h-11 rounded-xl text-sm font-medium ring-1 ring-border",
                    selected
                      ? bad
                        ? "bg-bad text-fg"
                        : "bg-primary text-primary-fg"
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
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => setNote(station.id, noteDraft)}
            rows={3}
            className="w-full resize-none rounded-xl bg-surface p-3 text-sm ring-1 ring-border outline-none"
            placeholder="Zufahrt, Münzen, Geruch …"
          />
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
        "inline-flex items-center justify-center bg-bg-elevated text-fg ring-1 ring-border",
        floating
          ? "size-11 rounded-full shadow-panel"
          : "h-11 shrink-0 rounded-xl",
        iconOnly || floating ? "w-11" : "px-3",
      )}
      aria-label="Standort"
    >
      <LocateFixed className="size-5" />
      {iconOnly || floating ? null : <span className="ml-1.5 text-sm">Standort</span>}
    </button>
  );
}
