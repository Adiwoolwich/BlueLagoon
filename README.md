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

## Tech-Stack

| Technologie          | Verwendung                          |
|----------------------|-------------------------------------|
| TanStack Start       | Full-Stack React-Framework          |
| React 19             | UI                                  |
| Vite 8               | Build / Dev-Server                  |
| Tailwind CSS v4      | Styling                             |
| Zustand (persist)    | Client-State                        |
| Leaflet + react-leaflet | Karte                            |
| Better Auth          | Authentifizierung                   |
| Neon / PGLite        | Datenbank                           |

## Status

Das Repository wurde initial angelegt. Der vollständige Quellcode der App wird schrittweise hochgeladen.

## Lizenz

Privat / All rights reserved (Adiwoolwich)

---

*Blue Lagoon – Damit die blaue Lagune immer in Reichweite bleibt.*
