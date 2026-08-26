import { haversineKm, type LatLng } from "./geo";

export type RoutePath = {
  from: string;
  to: string;
  coords: LatLng[];
  distanceKm: number;
  durationMin: number;
  source: "osrm" | "straight";
};

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

function straightPath(from: string, to: string, a: LatLng, b: LatLng): RoutePath {
  return {
    from,
    to,
    coords: [a, b],
    distanceKm: haversineKm(a, b),
    durationMin: Math.round((haversineKm(a, b) / 80) * 60),
    source: "straight",
  };
}

/**
 * Driving geometry via the public OSRM demo server (no API key).
 * Falls back to a straight corridor if the request fails or times out.
 */
export async function fetchDrivingRoute(
  fromLabel: string,
  toLabel: string,
  a: LatLng,
  b: LatLng,
  signal?: AbortSignal,
): Promise<RoutePath> {
  const fallback = straightPath(fromLabel, toLabel, a, b);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const url = `${OSRM_URL}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      code?: string;
      routes?: {
        distance: number;
        duration: number;
        geometry?: { coordinates?: [number, number][] };
      }[];
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !route || !coords || coords.length < 2) return fallback;
    return {
      from: fromLabel,
      to: toLabel,
      coords: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      source: "osrm",
    };
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
