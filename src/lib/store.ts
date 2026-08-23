import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  deriveStatus,
  findCity,
  isOpenNow,
  STATIONS,
  type LocalReport,
  type Station,
} from "./stations";
import { distanceToSegmentKm, haversineKm } from "./geo";

export type Filters = {
  freeOnly: boolean;
  openNow: boolean;
  hose: boolean;
  cassette: boolean;
  camperclean: boolean;
  confirmed: boolean;
  place: string;
  radiusKm: number;
};

export const RADIUS_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Ort" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
  { value: 30, label: "30 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
  { value: 150, label: "150 km" },
  { value: 200, label: "200 km" },
];

const defaultFilters: Filters = {
  freeOnly: false,
  openNow: false,
  hose: false,
  cassette: true,
  camperclean: false,
  confirmed: false,
  place: "",
  radiusKm: 20,
};

type RouteEnds = { from: string; to: string } | null;

type AppState = {
  query: string;
  filters: Filters;
  selectedId: string | null;
  favorites: string[];
  recent: string[];
  reports: Record<string, LocalReport>;
  notes: Record<string, string>;
  userPos: { lat: number; lng: number } | null;
  route: RouteEnds;
  panel: "list" | "detail" | "saved" | "route" | "add";
  extraStations: Station[];
  sheet: "peek" | "mid" | "full";
  setQuery: (q: string) => void;
  setFilters: (p: Partial<Filters>) => void;
  resetFilters: () => void;
  select: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  setFavorites: (ids: string[]) => void;
  report: (r: LocalReport) => void;
  setNote: (id: string, note: string) => void;
  setUserPos: (pos: { lat: number; lng: number } | null) => void;
  setRoute: (r: RouteEnds) => void;
  setPanel: (p: AppState["panel"]) => void;
  setSheet: (s: AppState["sheet"]) => void;
  setExtraStations: (list: Station[]) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      query: "",
      filters: defaultFilters,
      selectedId: null,
      favorites: [],
      recent: [],
      reports: {},
      notes: {},
      userPos: null,
      route: null,
      panel: "list",
      extraStations: [],
      sheet: "mid",
      setQuery: (query) => set({ query }),
      setFilters: (p) => set({ filters: { ...get().filters, ...p } }),
      resetFilters: () => set({ filters: defaultFilters }),
      select: (id) => {
        if (!id) {
          set({ selectedId: null, panel: "list" });
          return;
        }
        const recent = [id, ...get().recent.filter((x) => x !== id)].slice(0, 12);
        set({ selectedId: id, recent, panel: "detail", sheet: "full" });
      },
      toggleFavorite: (id) => {
        const favorites = get().favorites.includes(id)
          ? get().favorites.filter((x) => x !== id)
          : [id, ...get().favorites];
        set({ favorites });
      },
      setFavorites: (favorites) => set({ favorites }),
      report: (r) => set({ reports: { ...get().reports, [r.stationId]: r } }),
      setNote: (id, note) => set({ notes: { ...get().notes, [id]: note } }),
      setUserPos: (userPos) => set({ userPos }),
      setRoute: (route) => set({ route }),
      setPanel: (panel) =>
        set({
          panel,
          sheet: panel === "list" ? "mid" : "full",
        }),
      setSheet: (sheet) => set({ sheet }),
      setExtraStations: (extraStations) => set({ extraStations }),
    }),
    {
      name: "blue-lagoon-v3",
      skipHydration: true,
      partialize: (s) => ({
        favorites: s.favorites,
        recent: s.recent,
        reports: s.reports,
        notes: s.notes,
      }),
    },
  ),
);

export function allStations(extra: Station[] = []): Station[] {
  if (extra.length === 0) return STATIONS;
  const seen = new Set(STATIONS.map((s) => s.id));
  return [...STATIONS, ...extra.filter((s) => !seen.has(s.id))];
}

export function applyFilters(
  list: Station[],
  state: Pick<AppState, "query" | "filters" | "reports" | "userPos" | "route">,
  opts?: { now?: Date },
): Station[] {
  const now = opts?.now ?? new Date();
  const q = state.query.trim().toLowerCase();
  const f = state.filters;
  const routeA = state.route?.from ? findCity(state.route.from) : undefined;
  const routeB = state.route?.to ? findCity(state.route.to) : undefined;
  const place = findCity(state.query) ?? (f.place.trim() ? findCity(f.place) : undefined);

  return list.filter((s) => {
    if (q && !place) {
      const hay = `${s.name} ${s.city} ${s.postalCode} ${s.state} ${s.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.cassette && !s.cassette) return false;
    if (f.freeOnly && s.fee !== "free") return false;
    if (f.hose && !s.hose) return false;
    if (f.camperclean && s.type !== "camperclean") return false;
    if (f.openNow) {
      if (!isOpenNow(s, now) || deriveStatus(s, state.reports[s.id]) === "broken") {
        return false;
      }
    }
    if (f.confirmed && deriveStatus(s, state.reports[s.id]) !== "confirmed") {
      return false;
    }
    if (place) {
      if (f.radiusKm === 0) {
        const same = s.city.toLowerCase() === place.name.toLowerCase();
        if (!same && haversineKm(place, s) > 4) return false;
      } else if (haversineKm(place, s) > f.radiusKm) {
        return false;
      }
    } else if (state.userPos && f.radiusKm > 0 && !routeA) {
      if (haversineKm(state.userPos, s) > f.radiusKm) return false;
    }
    if (routeA && routeB) {
      if (distanceToSegmentKm(s, routeA, routeB) > 28) return false;
    }
    return true;
  });
}

export function getStation(id: string | null, extra: Station[] = []): Station | undefined {
  if (!id) return undefined;
  return allStations(extra).find((s) => s.id === id);
}
