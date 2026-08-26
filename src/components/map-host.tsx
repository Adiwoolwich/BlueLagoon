import { lazy, Suspense, useEffect, useState } from "react";
import type { Station } from "@/lib/stations";
import type { MapView } from "@/lib/store";

const StationMap = lazy(() =>
  import("./station-map").then((m) => ({ default: m.StationMap })),
);

export function MapHost({
  stations,
  initialView,
}: {
  stations: Station[];
  initialView?: MapView;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <div className="h-full w-full bg-bg-elevated" aria-hidden />;
  }
  return (
    <Suspense fallback={<div className="h-full w-full bg-bg-elevated" />}>
      <StationMap stations={stations} initialView={initialView} />
    </Suspense>
  );
}
