import { useState } from "react";
import type { ChemicalRule, FeeKind, HoursKind, Station, StationType } from "../lib/stations";
import { useAppStore } from "../lib/store";
import { cn } from "../lib/utils";

const STATES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

const TYPE_OPTS: { value: StationType; label: string }[] = [
  { value: "combo", label: "Kombi V+E" },
  { value: "cassette", label: "Kassette" },
  { value: "camperclean", label: "CamperClean" },
  { value: "municipal", label: "Kommunal" },
  { value: "greywater", label: "Nur Grauwasser" },
];

const FEE_OPTS: { value: FeeKind; label: string }[] = [
  { value: "free", label: "Kostenlos" },
  { value: "paid", label: "Gebühr" },
  { value: "guest", label: "Nur Gäste / im Preis" },
];

const HOURS_OPTS: { value: HoursKind; label: string }[] = [
  { value: "24h", label: "Rund um die Uhr" },
  { value: "daytime", label: "Tagsüber" },
  { value: "seasonal", label: "Saisonal" },
  { value: "limited", label: "Eingeschränkt" },
];

const CHEM_OPTS: { value: ChemicalRule; label: string }[] = [
  { value: "none", label: "Keine Einschränkung" },
  { value: "green-only", label: "Nur grüne Zusätze" },
  { value: "banned", label: "Chemie verboten" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-border outline-none focus:ring-2 focus:ring-primary/50";
const selectCls = inputCls + " appearance-none";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export function AddStationForm() {
  const addStation = useAppStore((s) => s.addStation);
  const setPanel = useAppStore((s) => s.setPanel);
  const userPos = useAppStore((s) => s.userPos);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [state, setState] = useState("Bayern");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(userPos?.lat?.toFixed(5) ?? "");
  const [lng, setLng] = useState(userPos?.lng?.toFixed(5) ?? "");
  const [type, setType] = useState<StationType>("combo");
  const [fee, setFee] = useState<FeeKind>("paid");
  const [feeNote, setFeeNote] = useState("");
  const [hours, setHours] = useState<HoursKind>("daytime");
  const [hoursNote, setHoursNote] = useState("");
  const [chemical, setChemical] = useState<ChemicalRule>("none");
  const [description, setDescription] = useState("");
  const [cassette, setCassette] = useState(true);
  const [greywater, setGreywater] = useState(true);
  const [freshwater, setFreshwater] = useState(true);
  const [hose, setHose] = useState(true);
  const [lighting, setLighting] = useState(true);
  const [covered, setCovered] = useState(false);
  const [wheels, setWheels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Standort nicht verfügbar.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setError(null);
      },
      () => setError("Standort konnte nicht ermittelt werden."),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const latN = Number(lat.replace(",", "."));
    const lngN = Number(lng.replace(",", "."));
    if (!name.trim() || !city.trim() || !address.trim()) {
      setError("Name, Stadt und Adresse sind Pflicht.");
      return;
    }
    if (!Number.isFinite(latN) || !Number.isFinite(lngN) || latN < 47 || latN > 56 || lngN < 5 || lngN > 16) {
      setError("Bitte gültige Koordinaten in Deutschland angeben (z. B. 48.13, 11.58).");
      return;
    }
    const id = `user-${slugify(name) || "station"}-${Date.now().toString(36)}`;
    const today = new Date().toISOString().slice(0, 10);
    const station: Station = {
      id,
      name: name.trim(),
      city: city.trim(),
      postalCode: postalCode.trim() || "00000",
      state,
      lat: latN,
      lng: lngN,
      address: address.trim(),
      type,
      fee,
      feeNote: feeNote.trim() || undefined,
      hours,
      hoursNote: hoursNote.trim() || undefined,
      hoursCertainty: "approx",
      cassette: type === "greywater" ? false : cassette,
      greywater,
      freshwater,
      hose,
      lighting,
      covered,
      wheels,
      chemical,
      lastVerified: today,
      source: "community",
      description: description.trim() || "Von Nutzer hinzugefügt.",
      rating: 0,
      reviewCount: 0,
      authorName: "Du",
    };
    addStation(station);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPanel("list")}
          className="inline-flex h-11 items-center gap-1 text-sm text-muted transition-[transform,color] duration-150 hover:text-fg active:scale-95"
        >
          ← Zurück
        </button>
        <h2 className="font-display text-lg text-fg">Örtlichkeit hinzufügen</h2>
        <span className="w-16" />
      </div>

      <form onSubmit={submit} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 pb-4">
        <Field label="Name *">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Stellplatz am See" required />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Stadt *">
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="München" required />
          </Field>
          <Field label="PLZ">
            <input className={inputCls} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="80331" inputMode="numeric" />
          </Field>
        </div>
        <Field label="Bundesland">
          <select className={selectCls} value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adresse *">
          <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße und Hausnummer" required />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Breite (lat) *">
            <input className={inputCls} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="48.137" inputMode="decimal" required />
          </Field>
          <Field label="Länge (lng) *">
            <input className={inputCls} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="11.575" inputMode="decimal" required />
          </Field>
        </div>
        <button type="button" onClick={useMyLocation} className="h-11 w-full rounded-xl bg-surface text-sm text-fg shadow-border transition-[transform,background-color] active:scale-[0.98]">
          ⌖ Aktuellen Standort übernehmen
        </button>

        <Field label="Typ">
          <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as StationType)}>
            {TYPE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gebühr">
          <select className={selectCls} value={fee} onChange={(e) => setFee(e.target.value as FeeKind)}>
            {FEE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gebühren-Hinweis">
          <input className={inputCls} value={feeNote} onChange={(e) => setFeeNote(e.target.value)} placeholder="z. B. 2 € Münzen" />
        </Field>
        <Field label="Öffnungszeiten">
          <select className={selectCls} value={hours} onChange={(e) => setHours(e.target.value as HoursKind)}>
            {HOURS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Zeiten-Hinweis">
          <input className={inputCls} value={hoursNote} onChange={(e) => setHoursNote(e.target.value)} placeholder="z. B. 8–20 Uhr, Winter zu" />
        </Field>
        <Field label="Chemie-Regel">
          <select className={selectCls} value={chemical} onChange={(e) => setChemical(e.target.value as ChemicalRule)}>
            {CHEM_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm text-muted">Ausstattung</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["Kassette", cassette, setCassette],
                ["Grauwasser", greywater, setGreywater],
                ["Frischwasser", freshwater, setFreshwater],
                ["Schlauch", hose, setHose],
                ["Beleuchtung", lighting, setLighting],
                ["Überdacht", covered, setCovered],
                ["Rollen/Räder", wheels, setWheels],
              ] as const
            ).map(([label, val, setVal]) => (
              <button
                key={label}
                type="button"
                onClick={() => setVal(!val)}
                className={cn(
                  "h-11 rounded-xl text-sm font-medium shadow-border transition-[transform,background-color,color] active:scale-95",
                  val ? "bg-primary text-primary-fg" : "bg-surface text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Beschreibung">
          <textarea
            className="w-full resize-none rounded-xl bg-surface p-3 text-sm shadow-border outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Zufahrt, Hinweise, Öffnungszeiten …"
          />
        </Field>

        {error ? <p className="text-sm text-bad">{error}</p> : null}

        <button
          type="submit"
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-fg transition-[transform,filter] active:scale-[0.98]"
        >
          Station speichern
        </button>
        <p className="text-center text-xs text-muted">
          Wird nur auf diesem Gerät gespeichert (Community-Eintrag).
        </p>
      </form>
    </div>
  );
}
