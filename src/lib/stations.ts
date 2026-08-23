import { CITIES, findCity, type City } from "./cities";

export { CITIES, findCity };
export type { City };

export type StationType =
  | "cassette"
  | "combo"
  | "camperclean"
  | "municipal"
  | "greywater";

export type FeeKind = "free" | "paid" | "unknown";

export type DayKey = "mo" | "tu" | "we" | "th" | "fr" | "sa" | "su";

export type DayHours = { open: string; close: string } | "closed" | "unknown";

export type WeeklyHours = Record<DayKey, DayHours>;

export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  postalCode: string;
  address: string;
  type: StationType;
  cassette: boolean;
  hose: boolean;
  fee: FeeKind;
  feeNote?: string;
  hours?: string;
  hoursNote?: string;
  weeklyHours?: Partial<WeeklyHours>;
  hoursCertainty?: "exact" | "approx" | "unknown";
  source?: string;
  website?: string;
  phone?: string;
};

export type LocalReport = {
  stationId: string;
  status: "confirmed" | "broken" | "closed" | "open";
  note?: string;
  at: number;
};

export const GERMANY_CENTER = { lat: 51.1657, lng: 10.4515 };

export const DAY_ORDER: DayKey[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];
export const DAY_SHORT: Record<DayKey, string> = {
  mo: "Mo",
  tu: "Di",
  we: "Mi",
  th: "Do",
  fr: "Fr",
  sa: "Sa",
  su: "So",
};
export const CERTAINTY_LABEL = {
  exact: "Geprüft",
  approx: "Ungefähr",
  unknown: "Unklar",
} as const;

/** Sample stations – full catalog (~192) in blue-lagoon-source.zip */
export const STATIONS: Station[] = [
  {
    id: "hh-elbtunnel",
    name: "Entsorgungsstation Elbtunnel",
    lat: 53.5462,
    lng: 9.9325,
    city: "Hamburg",
    state: "Hamburg",
    postalCode: "20457",
    address: "Am Elbtunnel",
    type: "municipal",
    cassette: true,
    hose: true,
    fee: "free",
    hours: "24/7",
    hoursCertainty: "approx",
  },
  {
    id: "m-theresienwiese",
    name: "Wohnmobilstellplatz Theresienwiese",
    lat: 48.1315,
    lng: 11.5495,
    city: "München",
    state: "Bayern",
    postalCode: "80336",
    address: "Theresienhöhe",
    type: "combo",
    cassette: true,
    hose: true,
    fee: "paid",
    feeNote: "ca. 3 €",
    hoursCertainty: "approx",
  },
  {
    id: "b-tegel",
    name: "Campingplatz Tegel",
    lat: 52.588,
    lng: 13.277,
    city: "Berlin",
    state: "Berlin",
    postalCode: "13507",
    address: "Schwarzer Weg 35",
    type: "camperclean",
    cassette: true,
    hose: true,
    fee: "paid",
    hoursCertainty: "unknown",
  },
  {
    id: "k-rheinpark",
    name: "Rheinpark Entsorgungsstelle",
    lat: 50.9445,
    lng: 6.973,
    city: "Köln",
    state: "Nordrhein-Westfalen",
    postalCode: "50679",
    address: "Rheinparkweg",
    type: "municipal",
    cassette: true,
    hose: false,
    fee: "free",
    hours: "Mo–So 8–20",
    hoursCertainty: "approx",
  },
  {
    id: "f-osthafen",
    name: "Osthafen Entsorgung",
    lat: 50.108,
    lng: 8.715,
    city: "Frankfurt am Main",
    state: "Hessen",
    postalCode: "60314",
    address: "Osthafenplatz",
    type: "municipal",
    cassette: true,
    hose: true,
    fee: "free",
    hoursCertainty: "unknown",
  },
];

export function resolveWeeklyHours(s: Station): WeeklyHours {
  const base: WeeklyHours = {
    mo: "unknown",
    tu: "unknown",
    we: "unknown",
    th: "unknown",
    fr: "unknown",
    sa: "unknown",
    su: "unknown",
  };
  if (s.weeklyHours) return { ...base, ...s.weeklyHours };
  if (s.hours === "24/7") {
    const all: DayHours = { open: "00:00", close: "24:00" };
    return { mo: all, tu: all, we: all, th: all, fr: all, sa: all, su: all };
  }
  return base;
}

export function formatDayHours(h: DayHours): string {
  if (h === "closed") return "geschlossen";
  if (h === "unknown") return "—";
  return `${h.open}–${h.close}`;
}

export function hoursSummary(s: Station): string {
  if (s.hours) return s.hours;
  return "Zeiten prüfen";
}

export function getHoursCertainty(s: Station): "exact" | "approx" | "unknown" {
  return s.hoursCertainty ?? "unknown";
}

export function isOpenNow(s: Station, _now = new Date()): boolean {
  if (s.hours === "24/7") return true;
  return true;
}

export function deriveStatus(
  s: Station,
  report?: LocalReport,
): "open" | "closed" | "limited" | "unknown" | "confirmed" | "broken" {
  if (report?.status === "broken") return "broken";
  if (report?.status === "confirmed") return "confirmed";
  if (report?.status === "closed") return "closed";
  if (report?.status === "open") return "open";
  if (s.hours === "24/7") return "open";
  return "unknown";
}
