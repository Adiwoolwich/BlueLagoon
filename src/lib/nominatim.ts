export type NominatimCity = {
  name: string;
  lat: number;
  lng: number;
  state: string;
  postalCode?: string;
};

const cache = new Map<string, NominatimCity[]>();

function placeName(addr: Record<string, string> | undefined, fallback: string): string {
  if (!addr) return fallback;
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.suburb ||
    addr.hamlet ||
    fallback
  );
}

export async function searchNominatimDe(query: string, limit = 8): Promise<NominatimCity[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  const compact = q.replace(/\s+/g, "").toUpperCase();
  const isDeZip = /^\d{5}$/.test(q);
  const isNlZip = /^\d{4}[A-Z]{0,2}$/.test(compact) && q.length <= 8;
  if (isDeZip) {
    url.searchParams.set("postalcode", q);
    url.searchParams.set("country", "de");
  } else if (isNlZip) {
    url.searchParams.set("postalcode", q);
    url.searchParams.set("country", "nl");
  } else {
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "de,nl");
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "de",
    },
  });
  if (!res.ok) return [];
  const raw = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }>;
  const out: NominatimCity[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const addr = row.address;
    const name = placeName(addr, row.display_name.split(",")[0] ?? q);
    const id = `${name}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const country = (addr?.country_code ?? "").toLowerCase();
    const state =
      addr?.state ||
      (country === "nl" ? "Nederland" : country === "de" ? "Deutschland" : addr?.country ?? "");
    out.push({
      name,
      lat,
      lng,
      state,
      postalCode: addr?.postcode,
    });
  }
  cache.set(key, out);
  return out;
}

const reverseCache = new Map<string, string>();
let lastReverseAt = 0;
const JUNK_ROAD = /^(unnamed|unbenannt|ohne namen|unknown)/i;

function nominatimZoom(mapZoom: number): number {
  if (mapZoom >= 14) return 18;
  if (mapZoom >= 12) return 16;
  return 14;
}

export function formatReverseLabel(
  addr: Record<string, string> | undefined,
  displayName: string,
  mapZoom: number,
): string {
  const fallback = (displayName.split(",")[0] ?? "").trim();
  if (!addr) return fallback;
  const road = [addr.road, addr.pedestrian, addr.residential, addr.footway].find(
    (r) => r && !JUNK_ROAD.test(r),
  );
  const street = road ? (addr.house_number ? `${road} ${addr.house_number}` : road) : "";
  const place =
    addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || addr.municipality || "";
  void mapZoom;
  if (street) return street;
  return place || fallback;
}

export async function reverseNominatim(lat: number, lng: number, mapZoom: number): Promise<string> {
  const qLat = lat.toFixed(4);
  const qLng = lng.toFixed(4);
  const z = nominatimZoom(mapZoom);
  const key = `${qLat},${qLng},${z}`;
  const hit = reverseCache.get(key);
  if (hit) return hit;
  const wait = 1100 - (Date.now() - lastReverseAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReverseAt = Date.now();
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", qLat);
  url.searchParams.set("lon", qLng);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", String(z));
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "de",
    },
  });
  if (!res.ok) return "";
  const raw = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
    error?: string;
  };
  if (raw.error) return "";
  const label = formatReverseLabel(raw.address, raw.display_name ?? "", mapZoom);
  if (label) reverseCache.set(key, label);
  return label;
}
