export type LatLng = { lat: number; lng: number };

export type MapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Distance from point P to segment AB in km */
export function distanceToSegmentKm(p: LatLng, a: LatLng, b: LatLng): number {
  const ab = haversineKm(a, b);
  if (ab < 0.05) return haversineKm(p, a);
  const ap = haversineKm(a, p);
  const bp = haversineKm(b, p);
  const t = Math.max(0, Math.min(1, (ap ** 2 + ab ** 2 - bp ** 2) / (2 * ab * ab)));
  const lat = a.lat + t * (b.lat - a.lat);
  const lng = a.lng + t * (b.lng - a.lng);
  return haversineKm(p, { lat, lng });
}

/** Shortest distance from a point to a polyline (route corridor). */
export function distanceToPolylineKm(p: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Number.POSITIVE_INFINITY;
  if (line.length === 1) return haversineKm(p, line[0]!);
  let min = Number.POSITIVE_INFINITY;
  const step = line.length > 400 ? 2 : 1;
  for (let i = 0; i < line.length - 1; i += step) {
    const d = distanceToSegmentKm(p, line[i]!, line[Math.min(i + step, line.length - 1)]!);
    if (d < min) min = d;
  }
  return min;
}

export function inBounds(p: LatLng, b: MapBounds, pad = 0): boolean {
  return (
    p.lat >= b.south - pad &&
    p.lat <= b.north + pad &&
    p.lng >= b.west - pad &&
    p.lng <= b.east + pad
  );
}

export function isFiniteLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

/** Distance along a polyline to the nearest vertex (km from start). */
export function alongRouteKm(p: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Number.POSITIVE_INFINITY;
  if (line.length === 1) return 0;
  const prefix: number[] = [0];
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    acc += haversineKm(line[i - 1]!, line[i]!);
    prefix.push(acc);
  }
  let bestI = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm(p, line[i]!);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return prefix[bestI] ?? 0;
}
