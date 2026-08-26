# Blue Lagune

**Chemietoiletten-Entsorgungsstationen für Wohnmobile in Deutschland**

Live: [https://blue-lagune.com](https://blue-lagune.com)

Karte mit 1236+ Entsorgungsstationen. Headline: „Kassettentoilette entsorgen – ohne Sucherei.“

## Stack

Vite + React + TypeScript, Leaflet, Supercluster, Tailwind, Zustand. Hosting über Cloudflare Workers (wrangler.toml).

Repo: [Adiwoolwich/BlueLagune](https://github.com/Adiwoolwich/BlueLagune)

## Was die App kann

- Karte (Leaflet) mit Suche, Filter-Chips, Favoriten und Bottom-Sheet
- Marker-Clustering (Supercluster), Liste der Stationen im aktuellen Kartenausschnitt
- **Live-Stationsdaten** (OSM, Bordatlas, Community), nicht nur Beispieldaten
- Navigation über den **System-App-Chooser** (Android geo, Apple Karten, Google Maps, Waze)
- Navigation nur bei echten Koordinaten oder auflösbarer Straßenadresse, keine Ortsmittelpunkte
- Route Start→Ziel über den öffentlichen OSRM-Router, Stationen im Korridor; Fallback Luftlinie
- Deep-Link / Teilen: URL mit Zentrum, Zoom, Station-ID und abweichenden Filtern
- Community-Meldungen, Merkliste, Zuletzt geöffnet, Notizen, GPX-Export
- Umkreis um Ort oder Standort. Saisonale Stationen im Detail gekennzeichnet

## Deep-Link

Beispiel: https://blue-lagune.com/?lat=53.5500&lng=10.0000&z=11&id=hh-hafen

Filter-Flags (nur abweichend vom Standard): cas, camp, cc, gw, fw, free, paid, guest, open, h24, hose, ok, r (Umkreis), q (Ort).

## Lokal starten

Vite-Devserver laut package.json.

## Deploy (Cloudflare)

Build, dann Wrangler auf den Worker. Domain: https://blue-lagune.com

---

*Blue Lagune – Damit die blaue Lagune immer in Reichweite bleibt.*
