# Blue Lagune

**Chemietoiletten-Entsorgungsstationen für Wohnmobile in Deutschland**

Live: [https://blue-lagune.com](https://blue-lagune.com)

Karte mit 404+ Entsorgungsstationen. Headline: „Kassettentoilette entsorgen – ohne Sucherei.“

## Stack

Vite + React + TypeScript, Leaflet, Tailwind, Zustand. Hosting über Cloudflare Workers (wrangler.toml).

Repo: [Adiwoolwich/BlueLagune](https://github.com/Adiwoolwich/BlueLagune)

## Was die App kann

- Karte (Leaflet) mit Suche, Filter, Favoriten und Bottom-Sheet
- **Live-Stationsdaten** (OSM, Bordatlas, Community), nicht nur Beispieldaten
- Navigation über den **System-App-Chooser** (Android geo, Apple Karten, Google Maps, Waze)
- Community-Meldungen, Merkliste, Notizen

## Lokal starten

Vite-Devserver laut package.json.

## Deploy (Cloudflare)

Build, dann Wrangler auf den Worker. Domain: https://blue-lagune.com

---

*Blue Lagune – Damit die blaue Lagune immer in Reichweite bleibt.*
