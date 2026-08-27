import { useSyncExternalStore } from "react";
import {
  DAY_ORDER,
  formatDayHours,
  HOURS_LABEL,
  resolveWeeklyHours,
  type ChemicalRule,
  type DayHours,
  type FeeKind,
  type HoursCertainty,
  type HoursKind,
  type Station,
  type StationType,
  type TrustStatus,
} from "./stations";

export type Lang = "de" | "en";

const KEY = "bl-lang";

function readSaved(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "de") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function detect(): Lang {
  const saved = readSaved();
  if (saved) return saved;
  try {
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("en")) return "en";
  } catch {
    /* ignore */
  }
  return "de";
}

let current: Lang = "de";
let booted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function bootLang() {
  if (booted) return getLang();
  booted = true;
  current = detect();
  if (typeof document !== "undefined") {
    document.documentElement.lang = current;
    document.title =
      current === "en"
        ? "Blue Lagune – cassette toilet dump stations | Germany & the Netherlands"
        : "Blue Lagune – Chemietoilette entsorgen | Stationen in DE + NL";
  }
  return current;
}

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang) {
  if (next !== "de" && next !== "en") return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.title =
      next === "en"
        ? "Blue Lagune – cassette toilet dump stations | Germany & the Netherlands"
        : "Blue Lagune – Chemietoilette entsorgen | Stationen in DE + NL";
  }
  emit();
}

export function toggleLang() {
  setLang(current === "de" ? "en" : "de");
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLang,
    () => "de",
  );
}

const de = {
  footerEmpty: "Entleeren",
  footerImprint: "Impressum",
  footerFeedback: "Feedback",
  footerPrivacy: "Datenschutz",
  langDe: "DE",
  langEn: "EN",
  langToggle: "Sprache wechseln",
  landingKicker: "Entsorgungsstationen fürs Wohnmobil",
  landingH1: "Kassettentoilette entsorgen – ohne Sucherei.",
  landingLead:
    "Finde verlässliche Stationen in Deutschland und den Niederlanden, navigiere dorthin und halte die Karte gemeinsam aktuell.",
  landingTileFind: "Finden & fahren",
  landingTileFindSub: "Karte, Suche, GPX",
  landingTileWater: "Wasser & Kassette",
  landingTileWaterSub: "V+E, Filter",
  landingTileSave: "Merken",
  landingTileSaveSub: "Liste & Notizen",
  landingCount: "Aktuell {n}+ Stationen",
  landingVisitors: "{n} Besucher",
  landingCta: "Zur Karte",
  landingNext: "Nächstes Mal direkt zur Karte.",
  landingOnce: "Nur diesmal zur Karte",
  srTitle: "Blue Lagune – Chemietoilette und Kassette entsorgen in Deutschland und den Niederlanden",
  srLead:
    "Interaktive Karte mit Entsorgungsstationen für Chemietoiletten und Kassettentoiletten in Deutschland und den Niederlanden.",
  sheetResize: "Liste größer oder kleiner",
  routeAir: "Straßenroute nicht verfügbar – Luftlinie mit Korridor.",
  guideTitle: "Kassette entleeren",
  close: "Schließen",
  closeDe: "Schließen",
  guide1t: "1. Station finden.",
  guide1: "Ort + Umkreis oder Standort.",
  guide2t: "2. Öffnungszeiten prüfen.",
  guide3t: "3. Nur gekennzeichnete Grube.",
  guide4t: "4. Nachspülen.",
  guide5t: "5. Status melden.",
  guide5: "Bei Defekt in der App markieren.",
  placePh: "Ort, Stadt oder PLZ …",
  cityPh: "Stadt, Ort oder PLZ (DE / NL) …",
  radius: "Umkreis",
  radiusPlace: "Ort",
  noCity: "Kein Ort gefunden. Stadt in DE/NL, Ortsteil oder PLZ eingeben.",
  noCityHits: "Keine Treffer in {n} Orten. Stadt in DE/NL, Ortsteil oder PLZ versuchen.",
  didYouMean: "Meintest du …",
  popular: "Häufige Ziele",
  placesFooter: "{n} Orte · DE + NL · PLZ-Suche",
  clearPlace: "Ort löschen",
  showCities: "Städte anzeigen",
  chipCassette: "Kassette",
  chipGrey: "Grauwasser",
  chipFresh: "Frischwasser",
  chipFree: "Kostenlos",
  chipPaid: "Bezahlt",
  chipGuest: "Nur Gäste",
  chipOpen: "Jetzt offen",
  chip24: "24h",
  chipCamp: "Campingplatz",
  chipCc: "CamperClean",
  chipHose: "Schlauch",
  chipOk: "Bestätigt",
  ariaCassette: "Kassette anzeigen",
  ariaGrey: "Nur mit Grauwasser",
  ariaFresh: "Nur mit Frischwasser",
  ariaFree: "Kostenlos",
  ariaPaid: "Mit Gebühr",
  ariaGuest: "Nur Gäste / im Preis",
  ariaOpen: "Jetzt geöffnet",
  aria24: "Rund um die Uhr",
  ariaCamp: "Campingplätze anzeigen",
  ariaCc: "CamperClean anzeigen",
  ariaHose: "Mit Schlauch",
  ariaOk: "Community bestätigt",
  reset: "Reset",
  inView: "{n} im Ausschnitt",
  route: "Route",
  saved: "Merkliste",
  addPlace: "Örtlichkeit hinzufügen",
  stationsN: "{n} Stationen",
  list: "Liste",
  backList: "← Liste",
  back: "← Zurück",
  emptyView: "Keine Stationen in diesem Kartenausschnitt.",
  emptyHint: "Zoome heraus oder Filter zurücksetzen.",
  savedEmpty: "Noch keine Stationen gemerkt.",
  recently: "Zuletzt angesehen",
  routeLead: "Stationen entlang der Strecke, nicht nur Luftlinie.",
  from: "Von",
  to: "Nach",
  startPlace: "Startort",
  endPlace: "Zielort",
  corridor: "Korridor",
  routeNeedCities: "Start und Ziel aus der Vorschlagsliste wählen.",
  routeBusy: "Route wird berechnet …",
  routeApply: "Route anwenden",
  routeClear: "Route löschen",
  routeKmMin: "{km} km · ca. {min} min",
  delete: "Löschen",
  savedYes: "Gemerkt",
  save: "Merken",
  share: "Teilen",
  linkCopied: "Link kopiert",
  seasonalWarn: "Saisonale Station – im Winter oft geschlossen. Zeiten vor der Anfahrt prüfen.",
  reportStatus: "Status melden",
  usedNow: "Gerade genutzt",
  broken: "Defekt",
  closed: "Geschlossen",
  dirty: "Unsauber",
  note: "Persönliche Notiz",
  notePh: "Zufahrt, Münzen, Geruch …",
  locate: "Standort",
  typeCassette: "Kassette",
  typeCombo: "Kombi V+E",
  typeCc: "CamperClean",
  typeMunicipal: "Kommunal",
  typeGrey: "Nur Grauwasser",
  feeFree: "Kostenlos",
  feePaid: "Gebühr",
  feeGuest: "Nur Gäste / im Preis",
  hours24: "Rund um die Uhr",
  hoursDay: "Tagsüber",
  hoursSeason: "Saisonal",
  hoursLimited: "Eingeschränkt",
  certExact: "Zeiten bestätigt",
  certApprox: "Ungefähre Zeiten",
  certUnknown: "Zeiten unsicher",
  statusConfirmed: "Bestätigt",
  statusStale: "Prüfung fällig",
  statusBroken: "Defekt",
  statusClosed: "Geschlossen",
  statusUnknown: "Ungeprüft",
  hoursDaily24: "Täglich rund um die Uhr",
  hoursDaily: "Täglich {slot}",
  hoursOpen: "Öffnungszeiten",
  today: "heute",
  hoursCheck: "Vor der Anfahrt Zeiten prüfen – Angaben können saisonal abweichen.",
  allDay: "durchgehend",
  shut: "geschlossen",
  dayMo: "Mo",
  dayTu: "Di",
  dayWe: "Mi",
  dayTh: "Do",
  dayFr: "Fr",
  daySa: "Sa",
  daySu: "So",
  clusterN: "{n} Stationen",
  navMissing: "Keine genaue Position – Navigation nicht möglich.",
  navStart: "Navigation starten",
  navChoose: "Navigations-App wählen",
  navOpenWith: "Navigation öffnen mit",
  navPick: "Wähle eine installierte App auf deinem Smartphone",
  navCancel: "Abbrechen",
  navSystem: "Installierte Navi-App wählen",
  navApple: "Apple Karten",
  navGoogle: "Google Maps",
  navWaze: "Waze",
  navOther: "Andere installierte App",
  addTitle: "Örtlichkeit hinzufügen",
  fieldName: "Name *",
  fieldCity: "Stadt *",
  fieldZip: "PLZ *",
  fieldState: "Bundesland / Provinz",
  fieldAddress: "Adresse *",
  fieldLat: "Latitude *",
  fieldLng: "Longitude *",
  useMyPos: "Meinen Standort verwenden",
  fieldType: "Typ",
  fieldFee: "Gebühr",
  fieldFeeNote: "Gebühren-Hinweis",
  fieldHours: "Öffnungszeiten",
  fieldHoursNote: "Öffnungszeiten-Hinweis",
  fieldChem: "Chemie-Regel",
  fieldGear: "Ausstattung",
  fieldDesc: "Beschreibung",
  light: "Beleuchtung",
  covered: "Überdacht",
  wheels: "Rollen/Räder",
  saveStation: "Station speichern",
  saveLocal: "Wird nur auf diesem Gerät gespeichert (Community-Eintrag).",
  namePh: "z. B. Wohnmobilstellplatz XY",
  addrPh: "Straße und Hausnummer",
  feePh: "z. B. 2 € Münze",
  hoursPh: "z. B. 8–20 Uhr, Winter zu",
  descPh: "Zufahrt, Hinweise, Öffnungszeiten …",
  errGeoOff: "Geolocation nicht verfügbar",
  errGeoFail: "Standort konnte nicht ermittelt werden",
  errRequired: "Name, Stadt, PLZ und Adresse sind Pflicht.",
  errCoords: "Gültige Koordinaten (Lat/Lng) erforderlich.",
  errBounds: "Koordinaten liegen außerhalb von DE/NL.",
  chemNone: "Keine Einschränkung",
  chemGreen: "Nur grüne Zusätze",
  chemBan: "Chemie verboten",
  communityEntry: "Community-Eintrag",
  fbKicker: "Kontakt",
  fbTitle: "Feedback",
  fbLead: "Hinweis zur Karte, ein Fehler, ein Wunsch. Wir lesen mit.",
  fbThanks: "Danke. Deine Nachricht ist raus.",
  fbName: "Name",
  fbEmail: "E-Mail",
  fbCompany: "Firma",
  fbMsg: "Nachricht",
  fbSend: "Absenden",
  fbSending: "Senden…",
  fbErrName: "Bitte einen Namen angeben (2–80 Zeichen).",
  fbErrMail: "Bitte eine gültige E-Mail-Adresse angeben.",
  fbErrMsg: "Die Nachricht sollte zwischen 10 und 4000 Zeichen haben.",
  fbErr429: "Zu viele Nachrichten. Bitte später noch einmal.",
  fbErrSend: "Senden hat nicht geklappt. Bitte später noch einmal.",
  backMap: "← Karte",
  legalKicker: "Rechtliches",
  imprintTitle: "Impressum",
  imprintP1: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).",
  imprintProvider: "Diensteanbieter",
  imprintFallback:
    "Blue Lagune, erreichbar über die unten genannte E-Mail. Name und ladungsfähige Anschrift des Betreibers werden hier ergänzt.",
  imprintContact: "Kontakt",
  imprintResponsible: "Verantwortlich für den Inhalt",
  imprintResponsibleP: "Verantwortlich nach § 18 Abs. 2 MStV: {name}.",
  imprintOperator: "der Betreiber, siehe Kontakt",
  imprintLiability: "Haftung für Inhalte und Links",
  imprintLiabilityP:
    "Die Stationseinträge dienen der Orientierung. Öffnungszeiten und Ausstattung können sich ändern. Für verlinkte Websites sind deren Betreiber verantwortlich.",
  imprintOdr: "EU-Streitschlichtung",
  imprintOdrP:
    "Plattform der EU-Kommission: {url}. Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil.",
  privacyTitle: "Datenschutz",
  privacyP1: "Verantwortlich im Sinne der DSGVO ist der im Impressum genannte Anbieter.",
  privacyWhich: "Welche Daten anfallen",
  privacyMap: "Karte:",
  privacyMapP: "Aufrufe von OpenStreetMap-Kacheln (IP-Adresse technisch nötig).",
  privacyLoc: "Standort:",
  privacyLocP: "nur im Browser nach Freigabe, nicht an uns gesendet.",
  privacyLs: "Local Storage:",
  privacyLsP: "Filter und Merkliste auf deinem Gerät.",
  privacyHost: "Hosting:",
  privacyHostP: "Cloudflare-Logs (IP, Zeitpunkt, Datei) zur Sicherheit.",
  privacyLaw: "Rechtsgrundlagen",
  privacyLawP: "Art. 6 Abs. 1 lit. f DSGVO (Betrieb), lit. a bei Standortfreigabe.",
  privacyRights: "Deine Rechte",
  privacyRightsP: "Auskunft, Löschung, Widerspruch. Kontakt:",
  privacyCookies: "Cookies",
  privacyCookiesP: "Keine Tracking- oder Werbe-Cookies.",
} as const;

const en: Record<keyof typeof de, string> = {
  footerEmpty: "How to empty",
  footerImprint: "Imprint",
  footerFeedback: "Feedback",
  footerPrivacy: "Privacy",
  langDe: "DE",
  langEn: "EN",
  langToggle: "Switch language",
  landingKicker: "Dump stations for motorhomes",
  landingH1: "Empty the cassette toilet — no hunting around.",
  landingLead:
    "Find reliable dump stations in Germany and the Netherlands, navigate there, and keep the map up to date together.",
  landingTileFind: "Find & drive",
  landingTileFindSub: "Map, search, GPX",
  landingTileWater: "Water & cassette",
  landingTileWaterSub: "Waste + fresh, filters",
  landingTileSave: "Save",
  landingTileSaveSub: "List & notes",
  landingCount: "Currently {n}+ stations",
  landingVisitors: "{n} visitors",
  landingCta: "Open map",
  landingNext: "Next time go straight to the map.",
  landingOnce: "Just this once to the map",
  srTitle: "Blue Lagune – cassette and chemical toilet dump stations in Germany and the Netherlands",
  srLead:
    "Interactive map of dump stations for chemical and cassette toilets in Germany and the Netherlands.",
  sheetResize: "Make the list larger or smaller",
  routeAir: "Road routing unavailable — straight line with corridor.",
  guideTitle: "Empty the cassette",
  close: "Close",
  closeDe: "Close",
  guide1t: "1. Find a station.",
  guide1: "Place + radius or your location.",
  guide2t: "2. Check opening hours.",
  guide3t: "3. Use only the marked drain.",
  guide4t: "4. Rinse afterwards.",
  guide5t: "5. Report status.",
  guide5: "Mark a fault in the app if it is broken.",
  placePh: "Town, city or postcode …",
  cityPh: "City, place or postcode (DE / NL) …",
  radius: "Radius",
  radiusPlace: "Place",
  noCity: "No place found. Enter a city in DE/NL, a district or a postcode.",
  noCityHits: "No matches in {n} places. Try a city in DE/NL, a district or a postcode.",
  didYouMean: "Did you mean …",
  popular: "Popular destinations",
  placesFooter: "{n} places · DE + NL · postcode search",
  clearPlace: "Clear place",
  showCities: "Show cities",
  chipCassette: "Cassette",
  chipGrey: "Grey water",
  chipFresh: "Fresh water",
  chipFree: "Free",
  chipPaid: "Paid",
  chipGuest: "Guests only",
  chipOpen: "Open now",
  chip24: "24h",
  chipCamp: "Campsite",
  chipCc: "CamperClean",
  chipHose: "Hose",
  chipOk: "Confirmed",
  ariaCassette: "Show cassette stations",
  ariaGrey: "Grey water only",
  ariaFresh: "Fresh water only",
  ariaFree: "Free of charge",
  ariaPaid: "With a fee",
  ariaGuest: "Guests only / included",
  ariaOpen: "Open now",
  aria24: "Open 24 hours",
  ariaCamp: "Show campsites",
  ariaCc: "Show CamperClean",
  ariaHose: "With hose",
  ariaOk: "Community confirmed",
  reset: "Reset",
  inView: "{n} in view",
  route: "Route",
  saved: "Saved",
  addPlace: "Add a station",
  stationsN: "{n} stations",
  list: "List",
  backList: "← List",
  back: "← Back",
  emptyView: "No stations in this map view.",
  emptyHint: "Zoom out or reset the filters.",
  savedEmpty: "No stations saved yet.",
  recently: "Recently viewed",
  routeLead: "Stations along the drive, not just as the crow flies.",
  from: "From",
  to: "To",
  startPlace: "Start",
  endPlace: "Destination",
  corridor: "Corridor",
  routeNeedCities: "Pick start and destination from the suggestions.",
  routeBusy: "Calculating route …",
  routeApply: "Apply route",
  routeClear: "Clear route",
  routeKmMin: "{km} km · about {min} min",
  delete: "Delete",
  savedYes: "Saved",
  save: "Save",
  share: "Share",
  linkCopied: "Link copied",
  seasonalWarn: "Seasonal station — often closed in winter. Check hours before you go.",
  reportStatus: "Report status",
  usedNow: "Just used",
  broken: "Broken",
  closed: "Closed",
  dirty: "Dirty",
  note: "Personal note",
  notePh: "Access, coins, smell …",
  locate: "Location",
  typeCassette: "Cassette",
  typeCombo: "Combo waste+fresh",
  typeCc: "CamperClean",
  typeMunicipal: "Municipal",
  typeGrey: "Grey water only",
  feeFree: "Free",
  feePaid: "Fee",
  feeGuest: "Guests only / included",
  hours24: "Around the clock",
  hoursDay: "Daytime",
  hoursSeason: "Seasonal",
  hoursLimited: "Limited",
  certExact: "Hours confirmed",
  certApprox: "Approximate hours",
  certUnknown: "Hours uncertain",
  statusConfirmed: "Confirmed",
  statusStale: "Due a check",
  statusBroken: "Broken",
  statusClosed: "Closed",
  statusUnknown: "Unchecked",
  hoursDaily24: "Open 24 hours every day",
  hoursDaily: "Daily {slot}",
  hoursOpen: "Opening hours",
  today: "today",
  hoursCheck: "Check hours before you arrive — they can change with the season.",
  allDay: "24 hours",
  shut: "closed",
  dayMo: "Mon",
  dayTu: "Tue",
  dayWe: "Wed",
  dayTh: "Thu",
  dayFr: "Fri",
  daySa: "Sat",
  daySu: "Sun",
  clusterN: "{n} stations",
  navMissing: "No precise position — navigation not available.",
  navStart: "Start navigation",
  navChoose: "Choose a navigation app",
  navOpenWith: "Open navigation with",
  navPick: "Pick an app installed on your phone",
  navCancel: "Cancel",
  navSystem: "Choose an installed nav app",
  navApple: "Apple Maps",
  navGoogle: "Google Maps",
  navWaze: "Waze",
  navOther: "Another installed app",
  addTitle: "Add a station",
  fieldName: "Name *",
  fieldCity: "City *",
  fieldZip: "Postcode *",
  fieldState: "State / province",
  fieldAddress: "Address *",
  fieldLat: "Latitude *",
  fieldLng: "Longitude *",
  useMyPos: "Use my location",
  fieldType: "Type",
  fieldFee: "Fee",
  fieldFeeNote: "Fee note",
  fieldHours: "Opening hours",
  fieldHoursNote: "Hours note",
  fieldChem: "Chemical rule",
  fieldGear: "Facilities",
  fieldDesc: "Description",
  light: "Lighting",
  covered: "Covered",
  wheels: "Wheels",
  saveStation: "Save station",
  saveLocal: "Stored only on this device (community entry).",
  namePh: "e.g. motorhome stop XY",
  addrPh: "Street and number",
  feePh: "e.g. €2 coin",
  hoursPh: "e.g. 8–20, closed in winter",
  descPh: "Access, notes, opening hours …",
  errGeoOff: "Geolocation not available",
  errGeoFail: "Could not determine location",
  errRequired: "Name, city, postcode and address are required.",
  errCoords: "Valid coordinates (lat/lng) are required.",
  errBounds: "Coordinates are outside DE/NL.",
  chemNone: "No restriction",
  chemGreen: "Green additives only",
  chemBan: "Chemicals banned",
  communityEntry: "Community entry",
  fbKicker: "Contact",
  fbTitle: "Feedback",
  fbLead: "A map note, a bug, a wish. We read it.",
  fbThanks: "Thanks. Your message is on its way.",
  fbName: "Name",
  fbEmail: "Email",
  fbCompany: "Company",
  fbMsg: "Message",
  fbSend: "Send",
  fbSending: "Sending…",
  fbErrName: "Please enter a name (2–80 characters).",
  fbErrMail: "Please enter a valid email address.",
  fbErrMsg: "The message should be between 10 and 4000 characters.",
  fbErr429: "Too many messages. Please try again later.",
  fbErrSend: "Sending failed. Please try again later.",
  backMap: "← Map",
  legalKicker: "Legal",
  imprintTitle: "Imprint",
  imprintP1: "Information according to § 5 German DDG.",
  imprintProvider: "Service provider",
  imprintFallback:
    "Blue Lagune, reachable via the email below. The operator’s name and service address will be added here.",
  imprintContact: "Contact",
  imprintResponsible: "Responsible for content",
  imprintResponsibleP: "Responsible under § 18 (2) MStV: {name}.",
  imprintOperator: "the operator, see contact",
  imprintLiability: "Liability for content and links",
  imprintLiabilityP:
    "Station listings are for orientation. Hours and facilities can change. Operators of linked sites are responsible for their content.",
  imprintOdr: "EU dispute resolution",
  imprintOdrP: "EU Commission platform: {url}. We do not take part in consumer arbitration.",
  privacyTitle: "Privacy",
  privacyP1: "The controller under the GDPR is the provider named in the imprint.",
  privacyWhich: "What data occurs",
  privacyMap: "Map:",
  privacyMapP: "OpenStreetMap tile requests (IP address required technically).",
  privacyLoc: "Location:",
  privacyLocP: "only in the browser after you allow it, not sent to us.",
  privacyLs: "Local storage:",
  privacyLsP: "filters and saved list on your device.",
  privacyHost: "Hosting:",
  privacyHostP: "Cloudflare logs (IP, time, file) for security.",
  privacyLaw: "Legal bases",
  privacyLawP: "Art. 6 (1)(f) GDPR (operation), (a) when you share location.",
  privacyRights: "Your rights",
  privacyRightsP: "Access, erasure, objection. Contact:",
  privacyCookies: "Cookies",
  privacyCookiesP: "No tracking or advertising cookies.",
};

type Key = keyof typeof de;

export function t(key: Key, vars?: Record<string, string | number>): string {
  const table = current === "en" ? en : de;
  let out: string = table[key] ?? de[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function typeLabel(type: StationType): string {
  const map: Record<StationType, Key> = {
    cassette: "typeCassette",
    combo: "typeCombo",
    camperclean: "typeCc",
    municipal: "typeMunicipal",
    greywater: "typeGrey",
  };
  return t(map[type]);
}

export function feeLabel(fee: FeeKind): string {
  const map: Record<FeeKind, Key> = { free: "feeFree", paid: "feePaid", guest: "feeGuest" };
  return t(map[fee]);
}

export function hoursKindLabel(hours: HoursKind): string {
  const map: Record<HoursKind, Key> = {
    "24h": "hours24",
    daytime: "hoursDay",
    seasonal: "hoursSeason",
    limited: "hoursLimited",
  };
  return t(map[hours]);
}

export function certaintyLabel(c: HoursCertainty): string {
  const map: Record<HoursCertainty, Key> = {
    exact: "certExact",
    approx: "certApprox",
    unknown: "certUnknown",
  };
  return t(map[c]);
}

export function statusLabel(s: TrustStatus): string {
  const map: Record<TrustStatus, Key> = {
    confirmed: "statusConfirmed",
    stale: "statusStale",
    broken: "statusBroken",
    closed: "statusClosed",
    unknown: "statusUnknown",
  };
  return t(map[s]);
}

export function chemLabel(c: ChemicalRule): string {
  const map: Record<ChemicalRule, Key> = {
    none: "chemNone",
    "green-only": "chemGreen",
    banned: "chemBan",
  };
  return t(map[c]);
}

export function dayShort(d: "mo" | "tu" | "we" | "th" | "fr" | "sa" | "su"): string {
  const map = {
    mo: "dayMo",
    tu: "dayTu",
    we: "dayWe",
    th: "dayTh",
    fr: "dayFr",
    sa: "daySa",
    su: "daySu",
  } as const;
  return t(map[d]);
}

export function fmtSlot(slot: DayHours): string {
  if (slot === "24h") return t("allDay");
  if (slot === "closed") return t("shut");
  return `${slot.open}–${slot.close}`;
}

export function hoursLine(station: Station): string {
  if (station.hours === "24h") return t("hoursDaily24");
  const week = resolveWeeklyHours(station);
  const first = week.mo;
  const uniform = DAY_ORDER.every((d) => formatDayHours(week[d]) === formatDayHours(first));
  if (uniform) {
    const core = t("hoursDaily", { slot: fmtSlot(first) });
    return station.hoursNote && !/\d/.test(station.hoursNote) ? `${core} · ${station.hoursNote}` : core;
  }
  return station.hoursNote ?? hoursKindLabel(station.hours);
}

void HOURS_LABEL;
