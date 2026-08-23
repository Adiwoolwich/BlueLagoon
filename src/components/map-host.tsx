import { lazy, Suspense, useEffect, useState } from "react";
import type { Station } from "@/lib/stations";

const StationMap = lazy(() =>
  import("./station-map").then((m) => ({ default: m.StationMap })),
);

export function MapHost({ stations }: { stations: Station[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <div className="h-full w-full bg-bg-elevated" aria-hidden />;
  }
  return (
    <Suspense fallback={<div className="h-full w-full bg-bg-elevated" />}>
      <StationMap stations={stations} />
    </Suspense>
  );
}
