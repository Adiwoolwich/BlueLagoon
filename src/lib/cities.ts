export type City = {
  name: string;
  state: string;
  lat: number;
  lng: number;
};

/** Sample cities – full list (~727) in blue-lagoon-source.zip */
export const CITIES: City[] = [
  { name: "Berlin", state: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Hamburg", state: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "München", state: "Bayern", lat: 48.1351, lng: 11.582 },
  { name: "Köln", state: "Nordrhein-Westfalen", lat: 50.9375, lng: 6.9603 },
  { name: "Frankfurt am Main", state: "Hessen", lat: 50.1109, lng: 8.6821 },
  { name: "Stuttgart", state: "Baden-Württemberg", lat: 48.7758, lng: 9.1829 },
  { name: "Düsseldorf", state: "Nordrhein-Westfalen", lat: 51.2277, lng: 6.7735 },
  { name: "Leipzig", state: "Sachsen", lat: 51.3397, lng: 12.3731 },
  { name: "Dortmund", state: "Nordrhein-Westfalen", lat: 51.5136, lng: 7.4653 },
  { name: "Essen", state: "Nordrhein-Westfalen", lat: 51.4556, lng: 7.0116 },
  { name: "Bremen", state: "Bremen", lat: 53.0793, lng: 8.8017 },
  { name: "Dresden", state: "Sachsen", lat: 51.0504, lng: 13.7373 },
  { name: "Hannover", state: "Niedersachsen", lat: 52.3759, lng: 9.732 },
  { name: "Nürnberg", state: "Bayern", lat: 49.4521, lng: 11.0767 },
  { name: "Duisburg", state: "Nordrhein-Westfalen", lat: 51.4344, lng: 6.7623 },
];

export function findCity(name: string): City | undefined {
  if (!name.trim()) return undefined;
  const n = name.trim().toLowerCase();
  return (
    CITIES.find((c) => c.name.toLowerCase() === n) ??
    CITIES.find((c) => c.name.toLowerCase().startsWith(n))
  );
}

export function searchCities(q: string, limit = 14): City[] {
  const t = q.trim().toLowerCase();
  if (!t) return CITIES.slice(0, limit);
  return CITIES.filter(
    (c) => c.name.toLowerCase().includes(t) || c.state.toLowerCase().includes(t),
  ).slice(0, limit);
}
