# Blue Lagoon

**Die App für Chemietoiletten-Entsorgungsstationen in Deutschland**  
*(Inspiriert von Tesla Superchargern – finde, plane & navigiere zu Entsorgungspunkten für Wohnmobile)*

## Überblick

Blue Lagoon hilft Wohnmobil- und Camper-Fahrern, schnell und zuverlässig geeignete Entsorgungsstationen für Chemietoiletten (Kassettentoiletten / Thetford / Dometic) zu finden.

### Kernfunktionen
- **Interaktive Karte** (Leaflet) mit allen bekannten Stationen in Deutschland
- **Stationen entlang der Route** – Stadt-/Ortsauswahl mit Fuzzy-Suche (~727 Städte)
- **Umkreis-Suche** im Kleinanzeigen-Stil (Radius filterbar)
- **Genaue Öffnungszeiten** pro Station (Wochentage + Confidence-Badges)
- **Google Maps Deep-Link** – öffnet direkt die Google Maps App (iOS/Android), Fallback auf Web
- **Mobile-First Bottom-Sheet UI** (Peek / Mid / Full) optimiert für Smartphones
- **Favoriten, Bewertungen (1–3 Sterne) und Community-Beiträge** (nach Login)
- **Account** mit Google / X / E-Mail (Better Auth)

## Aktueller Stand im Repo

Der Code wird schrittweise aus dem Workspace-Export hochgeladen.

**Bereits vorhanden:**
- Grundstruktur (`package.json`, `tsconfig`, `vite`-Basis, `.gitignore`)
- Router & Root-Layout
- Google-Maps-Deep-Link (`src/lib/maps.ts` + Button)
- Map-Host, Status-Badge, Auth-Slot
- Geo-Helfer, Utils, Styles

**Als Nächstes:** station-map, station-panel, Städte-/Stations-Datenkataloge, Store, Auth, etc.

## Tech-Stack

| Technologie          | Verwendung                          |
|----------------------|-------------------------------------|
| TanStack Start       | Full-Stack React-Framework          |
| React 19             | UI                                  |
| Vite                 | Build / Dev-Server                  |
| Tailwind CSS v4      | Styling                             |
| Zustand (persist)    | Client-State                        |
| Leaflet + react-leaflet | Karte                            |
| Better Auth          | Authentifizierung                   |
| Neon / PGLite        | Datenbank                           |

## Lizenz

Privat / All rights reserved (Adiwoolwich)

---

*Blue Lagoon – Damit die blaue Lagune immer in Reichweite bleibt.*
