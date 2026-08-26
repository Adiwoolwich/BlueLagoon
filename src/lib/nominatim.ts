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
  if (/^\d{1,5}$/.test(q)) {
    url.searchParams.set("postalcode", q);
    url.searchParams.set("country", "de");
  } else {
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "de");
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
    out.push({
      name,
      lat,
      lng,
      state: addr?.state ?? "",
      postalCode: addr?.postcode,
    });
  }
  cache.set(key, out);
  return out;
}
