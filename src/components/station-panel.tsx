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
import { canNavigateTo, findCity, hasPreciseCoords, isHttpPhotoUrl, type Station } from "../lib/stations";
import {
  allStations,
  CORRIDOR_OPTIONS,
  RADIUS_OPTIONS,
  serverToLocal,
  useAppStore,
  type Filters,
} from "../lib/store";
import { copyShareUrl, shareUrl } from "../lib/url-state";
import { postReport } from "../lib/reports";
import { feeLabel, hoursLine, t, typeLabel, useLang } from "../lib/i18n";
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

export function SearchBar({ overlay }: { overlay?: boolean }) {
  useLang();
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
          placeholder={t("placePh")}
          warnUnmatched={false}
          compactMenu={overlay}
        />
      </div>
      <label className="relative block w-[4.6rem] shrink-0 self-end">
        <span className="sr-only">{t("radius")}</span>
        <select
          value={filters.radiusKm}
          disabled={!hasOrigin}
          onChange={(e) => setFilters({ radiusKm: Number(e.target.value) })}
          className="h-11 w-full appearance-none rounded-xl bg-surface py-0 pr-6 pl-2 text-sm text-fg ring-1 ring-border outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          aria-label={t("radius")}
        >
          {RADIUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === 0 ? t("radiusPlace") : o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-muted" />
      </label>
    </div>
  );
}

const CHIP_KEYS: {
  key: keyof Filters;
  label:
    | "chipCassette"
    | "chipGrey"
    | "chipFresh"
    | "chipFree"
    | "chipPaid"
    | "chipGuest"
    | "chipOpen"
    | "chip24"
    | "chipCamp"
    | "chipCc"
    | "chipHose"
    | "chipOk"
    | "chipDe"
    | "chipNl";
  aria:
    | "ariaCassette"
    | "ariaGrey"
    | "ariaFresh"
    | "ariaFree"
    | "ariaPaid"
    | "ariaGuest"
    | "ariaOpen"
    | "aria24"
    | "ariaCamp"
    | "ariaCc"
    | "ariaHose"
    | "ariaOk"
    | "ariaDe"
    | "ariaNl";
}[] = [
  { key: "cassette", label: "chipCassette", aria: "ariaCassette" },
  { key: "countryDe", label: "chipDe", aria: "ariaDe" },
  { key: "countryNl", label: "chipNl", aria: "ariaNl" },
  { key: "greywater", label: "chipGrey", aria: "ariaGrey" },
  { key: "freshwater", label: "chipFresh", aria: "ariaFresh" },
  { key: "feeFree", label: "chipFree", aria: "ariaFree" },
  { key: "feePaid", label: "chipPaid", aria: "ariaPaid" },
  { key: "feeGuest", label: "chipGuest", aria: "ariaGuest" },
  { key: "openNow", label: "chipOpen", aria: "ariaOpen" },
  { key: "h24", label: "chip24", aria: "aria24" },
  { key: "campsite", label: "chipCamp", aria: "ariaCamp" },
  { key: "camperclean", label: "chipCc", aria: "ariaCc" },
  { key: "hose", label: "chipHose", aria: "ariaHose" },
  { key: "confirmed", label: "chipOk", aria: "ariaOk" },
];

export function FilterChips() {
  useLang();
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CHIP_KEYS.map((c) => (
        <Chip
          key={c.key}
          active={Boolean(filters[c.key])}
          onClick={() => setFilters({ [c.key]: !filters[c.key] })}
          label={t(c.aria)}
        >
          {t(c.label)}
        </Chip>
      ))}
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs text-muted ring-1 ring-border hover:text-fg"
      >
        {t("reset")}
      </button>
    </div>
  );
}

export function ListToolbar({ count }: { count: number }) {
  useLang();
  const setPanel = useAppStore((s) => s.setPanel);
  const panel = useAppStore((s) => s.panel);
  const route = useAppStore((s) => s.route);
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted">
      <span className="tabular-nums">{t("inView", { n: count })}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPanel(panel === "route" ? "list" : "route")}
          className={cn("h-9 px-2 hover:text-fg", (panel === "route" || route) && "text-primary")}
        >
          {t("route")}
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "saved" ? "list" : "saved")}
          className={cn("h-9 px-2 hover:text-fg", panel === "saved" && "text-primary")}
        >
          {t("saved")}
        </button>
        <button
          type="button"
          onClick={() => setPanel("add")}
          className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg"
          aria-label={t("addPlace")}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SearchAndFilters({
  count,
  compact,
  embedSearch,
}: {
  count: number;
  compact?: boolean;
  embedSearch?: boolean;
}) {
  useLang();
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
          <span className="tabular-nums">{t("stationsN", { n: count })}</span>
          <span className="text-primary">{t("list")}</span>
        </button>
        <button
          type="button"
          onClick={() => setPanel("add")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg"
          aria-label={t("addPlace")}
        >
          <Plus className="size-5" />
        </button>
      </div>
    );
  }
  return (
    <div className="shrink-0 space-y-2">
      <div className={embedSearch ? "block" : "hidden md:block"}>
        <SearchBar />
      </div>
      <FilterChips />
      <ListToolbar count={count} />
    </div>
  );
}

function StationList({ stations }: { stations: Station[] }) {
  useLang();
  const userPos = useAppStore((s) => s.userPos);
  const reports = useAppStore((s) => s.reports);
  const serverReports = useAppStore((s) => s.serverReports);
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
      return a.name.localeCompare(b.name);
    });
  }, [stations, userPos, bounds]);

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted">
        <p className="text-sm">{t("emptyView")}</p>
        <p className="text-xs">{t("emptyHint")}</p>
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
                    {s.city} · {typeLabel(s.type)}
                    {s.fee ? ` · ${feeLabel(s.fee)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {km != null ? <span className="text-xs tabular-nums text-muted">{formatKm(km)}</span> : null}
                  <StatusBadge station={s} report={serverToLocal(s.id, serverReports[s.id], reports[s.id])} compact />
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
  useLang();
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
      <div data-bl-keep-clear className="sticky top-0 z-20 -mx-1 mb-2 bg-bg-elevated px-1 pb-1">
        <button type="button" onClick={() => setPanel("list")} className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg">
          {t("backList")}
        </button>
        <h2 className="mt-1 text-lg font-semibold">{t("saved")}</h2>
      </div>
      <div className="bl-scroll">
        {saved.length === 0 ? (
          <p className="text-sm text-muted">{t("savedEmpty")}</p>
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
            <h3 className="mt-6 mb-2 text-sm font-medium text-muted">{t("recently")}</h3>
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
  useLang();
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
      setError(t("routeNeedCities"));
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
      <div data-bl-keep-clear className="sticky top-0 z-20 bg-bg-elevated pb-1">
        <button type="button" onClick={() => setPanel("list")} className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg">
          {t("backList")}
        </button>
        <h2 className="text-lg font-semibold">{t("route")}</h2>
      </div>
      <p className="text-sm text-muted">{t("routeLead")}</p>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t("from")}</span>
        <CitySelect value={from} onChange={setFrom} placeholder={t("startPlace")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t("to")}</span>
        <CitySelect value={to} onChange={setTo} placeholder={t("endPlace")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t("corridor")}</span>
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
        <p className="rounded-xl bg-stale/10 px-3 py-2 text-sm text-stale">{t("routeAir")}</p>
      ) : null}
      {routePath?.source === "osrm" ? (
        <p className="text-sm text-muted">
          {t("routeKmMin", { km: Math.round(routePath.distanceKm), min: routePath.durationMin })}
        </p>
      ) : null}
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void apply()}
        className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-fg disabled:opacity-60"
      >
        {busy ? t("routeBusy") : t("routeApply")}
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
          {t("routeClear")}
        </button>
      ) : null}
    </div>
  );
}

function Detail({ station }: { station: Station }) {
  useLang();
  const reports = useAppStore((s) => s.reports);
  const extra = useAppStore((s) => s.extraStations);
  const serverReports = useAppStore((s) => s.serverReports);
  const upsertServerReport = useAppStore((s) => s.upsertServerReport);
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
  const [publicNote, setPublicNote] = useState(serverReports[station.id]?.note ?? "");
  const [copied, setCopied] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const km = userPos && hasPreciseCoords(station) ? haversineKm(userPos, station) : null;
  const fav = favorites.includes(station.id);
  const canDelete = extra.some((s) => s.id === station.id);
  const navOk = canNavigateTo(station);
  const live = serverReports[station.id];
  const photoOk = isHttpPhotoUrl(station.photoUrl);
  const hoursText = hoursLine(station);

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

  async function sendStatus(status: "ok" | "broken") {
    if (reportBusy) return;
    setReportBusy(true);
    setReportMsg(null);
    const res = await postReport(station.id, status, publicNote);
    setReportBusy(false);
    if (res.status === 429) {
      setReportMsg(t("reportRate"));
      return;
    }
    if (!res.ok) {
      setReportMsg(t("reportErr"));
      return;
    }
    const rec = res.report ?? { status, at: Date.now(), note: publicNote.trim() || undefined };
    upsertServerReport(station.id, rec);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div data-bl-keep-clear className="sticky top-0 z-20 mb-3 flex shrink-0 items-center justify-between gap-2 bg-bg-elevated">
        <button
          type="button"
          onClick={() => {
            select(null);
            setPanel("list");
          }}
          className="inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg"
        >
          {t("back")}
        </button>
        <div className="flex gap-2">
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                removeExtra(station.id);
              }}
              className="inline-flex h-11 items-center rounded-xl bg-bad/12 px-3 text-sm text-bad ring-1 ring-border"
            >
              {t("delete")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => toggleFavorite(station.id)}
            className="inline-flex h-11 items-center gap-1 rounded-xl bg-surface px-3 text-sm ring-1 ring-border"
          >
            <Star className={cn("size-4", fav && "fill-primary text-primary")} />
            {fav ? t("savedYes") : t("save")}
          </button>
        </div>
      </div>
      <div className="bl-scroll space-y-4 pr-1">
        {photoOk ? (
          <img
            src={station.photoUrl}
            alt=""
            className="h-40 w-full rounded-xl object-cover"
          />
        ) : null}
        <header>
          <p className="text-xs tracking-wide text-muted uppercase">
            {station.state} · {typeLabel(station.type)}
          </p>
          <h2 className="mt-1 text-2xl leading-tight font-semibold text-fg">{station.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {station.address}, {station.postalCode} {station.city}
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <StatusBadge station={station} report={serverToLocal(station.id, live, reports[station.id])} />
          {station.fee ? (
            <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted ring-1 ring-border">
              {feeLabel(station.fee)}
            </span>
          ) : (
            <span className="inline-flex h-6 items-center rounded-full bg-surface px-2.5 text-xs text-subtle ring-1 ring-border">
              {t("feeUnknown")}
            </span>
          )}
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
            {copied ? t("linkCopied") : t("share")}
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
          <p className="rounded-lg bg-stale/10 px-3 py-2 text-xs text-stale">{t("seasonalWarn")}</p>
        ) : null}
        {hoursText || station.weeklyHours || station.hours === "24h" || station.hoursNote ? (
          <HoursTable station={station} />
        ) : (
          <p className="text-sm text-subtle">{t("hoursOpen")}: {t("hoursUnknown")}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              [t("chipCassette"), station.cassette],
              [t("chipGrey"), station.greywater],
              [t("chipFresh"), station.freshwater],
              [t("chipHose"), station.hose],
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
          <h3 className="mb-2 text-sm font-medium">{t("reportStatus")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["ok", t("geht"), false],
                ["broken", t("broken"), true],
              ] as const
            ).map(([kind, label, bad]) => {
              const selected = live?.status === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={reportBusy}
                  onClick={() => void sendStatus(kind)}
                  className={cn(
                    "h-11 rounded-xl text-sm font-medium ring-1 ring-border disabled:opacity-60",
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
          {live?.note ? <p className="mt-2 text-xs text-muted">{live.note}</p> : null}
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-muted">{t("reportNote")}</span>
            <input
              value={publicNote}
              onChange={(e) => setPublicNote(e.target.value.slice(0, 200))}
              className="h-11 w-full rounded-xl bg-surface px-3 text-sm ring-1 ring-border outline-none"
              placeholder={t("reportNotePh")}
              maxLength={200}
            />
          </label>
          {reportMsg ? <p className="mt-2 text-sm text-bad">{reportMsg}</p> : null}
        </section>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t("note")}</span>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => setNote(station.id, noteDraft)}
            rows={3}
            className="w-full resize-none rounded-xl bg-surface p-3 text-sm ring-1 ring-border outline-none"
            placeholder={t("notePh")}
          />
        </label>
      </div>
    </div>
  );
}

export function LocateButton({ iconOnly, floating }: { iconOnly?: boolean; floating?: boolean }) {
  useLang();
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
      data-bl-keep-clear
      className={cn(
        "inline-flex items-center justify-center bg-bg-elevated text-fg ring-1 ring-border",
        floating ? "size-11 shrink-0 rounded-full shadow-panel" : "h-11 shrink-0 rounded-xl",
        iconOnly || floating ? "w-11" : "px-3",
      )}
      aria-label={t("locate")}
    >
      <LocateFixed className="size-5" />
      {iconOnly || floating ? null : <span className="ml-1.5 text-sm">{t("locate")}</span>}
    </button>
  );
}
