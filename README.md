# Blue Lagune

Chemietoiletten-Entsorgungsstationen für Wohnmobile in Deutschland und den Niederlanden

**Live:** https://blue-lagune.com  
**Repo:** https://github.com/Adiwoolwich/BlueLagune

1281 Stationen (1241 DE + 40 NL)

## Funktionen

- Kartensuche Deutschland und Niederlande
- Filter
- Clustering
- Route / OSRM
- Deep-Link
- Navigation nur mit echten Koordinaten bzw. Straße
- Feedback-Formular unter `/feedback` (Cloudflare Email Routing)
- Unique Visitors (gehashed im Worker)
- Offline-Packs
- i18n DE/EN

## Stack

- Vite 6 + React 19 + TypeScript
- Leaflet, Supercluster, Tailwind, Zustand
- Hosting: Cloudflare Workers (`wrangler.toml`, `worker.ts`)

## Lizenz

Privat / All rights reserved (Adiwoolwich)
