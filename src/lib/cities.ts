import raw from "../data/cities.json";

export type City = {
  name: string;
  lat: number;
  lng: number;
  state: string;
  aliases?: string[];
};

export const CITIES: City[] = raw as City[];

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
  "Freiburg",
  "Rostock",
  "Erfurt",
  "Mainz",
  "Augsburg",
];

export const POPULAR_CITIES: City[] = POPULAR_NAMES.map((n) =>
  CITIES.find((c) => c.name === n),
).filter((c): c is City => Boolean(c));

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

function namesOf(c: City): string[] {
  return [c.name, ...(c.aliases ?? [])];
}

export function findCity(name: string): City | undefined {
  const q = name.trim();
  if (!q) return undefined;
  const lower = q.toLowerCase();
  const folded = foldCity(q);
  return CITIES.find((c) =>
    namesOf(c).some((n) => n.toLowerCase() === lower || foldCity(n) === folded),
  );
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
  if (!q)
    return [...POPULAR_CITIES, ...CITIES.filter((c) => !POPULAR_CITIES.includes(c))].slice(
      0,
      limit,
    );
  const folded = foldCity(q);
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const foldedNames = namesOf(c).map(foldCity);
    if (foldedNames.some((n) => n.startsWith(folded))) starts.push(c);
    else if (foldedNames.some((n) => n.includes(folded)) || foldCity(c.state).includes(folded)) {
      contains.push(c);
    }
  }
  let out = [...starts, ...contains];
  if (out.length === 0 && folded.length >= 3) {
    out = [...CITIES]
      .map((c) => ({ c, d: Math.min(...namesOf(c).map((n) => levenshtein(folded, foldCity(n)))) }))
      .filter((x) => x.d <= Math.max(2, Math.floor(folded.length / 4)))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.c);
  }
  return out.slice(0, limit);
}
