import raw from "../data/de-places.json";

export type City = {
  name: string;
  lat: number;
  lng: number;
  state: string;
  aliases?: string[];
  postalCode?: string;
};

const STATE_NAME: Record<string, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

type PlacesFile = {
  p: [string, string, number, number][];
  z: [string, number, number, number][];
};

const data = raw as PlacesFile;

const EXTRA_ALIASES: Record<string, string[]> = {
  "Frankfurt am Main": ["Frankfurt", "Frankfurt/Main", "Frankfurt a. M.", "Frankfurt a.M."],
  München: ["Munich", "Muenchen"],
  Köln: ["Cologne", "Koeln"],
  Nürnberg: ["Nuremberg", "Nuernberg"],
  Hannover: ["Hanover"],
  Braunschweig: ["Brunswick"],
  "Freiburg im Breisgau": ["Freiburg"],
  "Halle (Saale)": ["Halle"],
  "Ludwigshafen am Rhein": ["Ludwigshafen"],
  "Mülheim an der Ruhr": ["Mülheim", "Muelheim"],
  Westerland: ["Sylt"],
};

export const CITIES: City[] = data.p.map(([name, code, lat, lng]) => ({
  name,
  state: STATE_NAME[code] ?? code,
  lat,
  lng,
  aliases: EXTRA_ALIASES[name],
}));

const nameCount = new Map<string, number>();
for (const c of CITIES) nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);

const byFold = new Map<string, City[]>();
const byLower = new Map<string, City[]>();
const byZip = new Map<string, City>();
const byLabel = new Map<string, City>();

function addIndex(map: Map<string, City[]>, key: string, city: City) {
  const arr = map.get(key);
  if (arr) arr.push(city);
  else map.set(key, [city]);
}

export function foldCity(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function cityKey(c: City): string {
  if (c.postalCode) return c.postalCode;
  if ((nameCount.get(c.name) ?? 0) > 1) return `${c.name}, ${c.state}`;
  return c.name;
}

function namesOf(c: City): string[] {
  return [c.name, ...(c.aliases ?? [])];
}

for (const c of CITIES) {
  addIndex(byLower, c.name.toLowerCase(), c);
  addIndex(byFold, foldCity(c.name), c);
  byLabel.set(`${c.name}, ${c.state}`.toLowerCase(), c);
  byLabel.set(c.name.toLowerCase() + ", " + foldCity(c.state), c);
  for (const a of c.aliases ?? []) {
    addIndex(byLower, a.toLowerCase(), c);
    addIndex(byFold, foldCity(a), c);
  }
}

for (const [zip, idx, lat, lng] of data.z) {
  const base = CITIES[idx];
  if (!base) continue;
  byZip.set(zip, {
    name: base.name,
    state: base.state,
    lat,
    lng,
    postalCode: zip,
    aliases: base.aliases,
  });
}

const POPULAR_NAMES = [
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Frankfurt am Main",
  "Stuttgart",
  "Düsseldorf",
  "Leipzig",
  "Dortmund",
  "Essen",
  "Bremen",
  "Dresden",
  "Hannover",
  "Nürnberg",
  "Kiel",
  "Freiburg im Breisgau",
  "Rostock",
  "Erfurt",
  "Mainz",
  "Augsburg",
];

export const POPULAR_CITIES: City[] = POPULAR_NAMES.map(
  (n) => byLower.get(n.toLowerCase())?.[0],
).filter((c): c is City => Boolean(c));

export function findCity(name: string): City | undefined {
  const q = name.trim();
  if (!q) return undefined;
  const zipLead = q.match(/^(\d{5})(?:\s+|$)/);
  if (zipLead) return byZip.get(zipLead[1]);
  const lower = q.toLowerCase();
  const labeled = byLabel.get(lower);
  if (labeled) return labeled;
  const comma = q.match(/^(.*?),\s*(.+)$/);
  if (comma) {
    const nf = foldCity(comma[1]);
    const sf = foldCity(comma[2]);
    const hit = CITIES.find(
      (c) => foldCity(c.state) === sf && (foldCity(c.name) === nf || foldCity(c.name).startsWith(nf)),
    );
    if (hit) return hit;
  }
  const exact = byLower.get(lower);
  if (exact?.length) return exact[0];
  const folded = foldCity(q);
  const foldedHit = byFold.get(folded);
  if (foldedHit?.length) return foldedHit[0];
  return undefined;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length]!;
}

export function searchCities(query: string, limit = 12): City[] {
  const q = query.trim();
  if (!q) return POPULAR_CITIES.slice(0, limit);

  if (/^\d{1,5}$/.test(q)) {
    const hits: City[] = [];
    for (const [zip, city] of byZip) {
      if (zip.startsWith(q)) hits.push(city);
      if (hits.length >= limit) break;
    }
    hits.sort((a, b) => (a.postalCode ?? "").localeCompare(b.postalCode ?? ""));
    return hits.slice(0, limit);
  }

  const folded = foldCity(q);
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const foldedNames = namesOf(c).map(foldCity);
    if (foldedNames.some((n) => n.startsWith(folded))) starts.push(c);
    else if (foldedNames.some((n) => n.includes(folded))) contains.push(c);
    if (starts.length >= limit) break;
  }
  let out = [...starts, ...contains];
  if (out.length === 0 && folded.length >= 3) {
    out = CITIES.map((c) => ({
      c,
      d: Math.min(...namesOf(c).map((n) => levenshtein(folded, foldCity(n)))),
    }))
      .filter((x) => x.d <= Math.max(2, Math.floor(folded.length / 4)))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.c);
  }
  return out.slice(0, limit);
}
