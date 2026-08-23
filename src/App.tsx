import { useMemo } from "react";
import { MapHost } from "./components/map-host";
import { STATIONS } from "./lib/stations";
import { useAppStore, applyFilters, allStations } from "./lib/store";

export function App() {
  const query = useAppStore((s) => s.query);
  const filters = useAppStore((s) => s.filters);
  const reports = useAppStore((s) => s.reports);
  const userPos = useAppStore((s) => s.userPos);
  const route = useAppStore((s) => s.route);
  const extraStations = useAppStore((s) => s.extraStations);

  const stations = useMemo(
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

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-950 text-slate-100">
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-3 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-lg font-bold text-cyan-400">Blue Lagoon</h1>
          <p className="text-xs text-slate-400">Chemietoiletten-Entsorgung</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {stations.length} Stationen
        </span>
      </header>
      <div className="absolute inset-0 pt-14">
        <MapHost stations={stations.length ? stations : STATIONS} />
      </div>
    </div>
  );
}
