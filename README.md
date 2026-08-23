# Blue Lagune

**Chemietoiletten-Entsorgungsstationen für Wohnmobile in Deutschland**

## Was ist schon im Repo?

- Karte (Leaflet) + StationMap
- Zustand-Store (Filter, Favoriten, Bottom-Sheet, Route)
- Städte- & Stations-Daten (Beispiel-Daten; voller Katalog in `blue-lagoon-source.zip`)
- Google-Maps Deep-Link (App öffnen)
- Hours-Table, Status-Badge, Auth-Slot
- Geo-Helfer, Styles, Router

Vollständiger Original-Code inkl. aller ~192 Stationen und ~727 Städte: siehe Release/Zip oder lokale `blue-lagoon-source.zip`.

## Lokal starten

```bash
npm install
npm run dev
```

## Domain mit dem Repo verknüpfen (empfohlen: Vercel)

Blue Lagune ist eine TanStack-Start / Vite-App → **Vercel** ist die einfachste Lösung.

### 1. Vercel-Projekt anlegen
1. Gehe zu [vercel.com](https://vercel.com) und melde dich mit **GitHub** an.
2. **Add New Project** → wähle das Repo `Adiwoolwich/BlueLagoon`.
3. Framework Preset: **Vite** (oder Other). Root Directory: `.`
4. Deploy klicken. Du bekommst eine URL wie `blue-lagoon-xxx.vercel.app`.

### 2. Eigene Domain verbinden
1. In Vercel: Project → **Settings** → **Domains**.
2. Domain eingeben (z. B. `bluelagoon.app` oder `entsorgung.deine-domain.de`).
3. Vercel zeigt dir die DNS-Einträge:
   - **Apex-Domain** (`example.com`): A-Record auf `76.76.21.21` **oder** CNAME auf `cname.vercel-dns.com`
   - **Subdomain** (`app.example.com`): CNAME → `cname.vercel-dns.com`
4. Bei deinem Domain-Anbieter (IONOS, Strato, Cloudflare, Namecheap …) die DNS-Einträge setzen.
5. Warten (oft 5–30 Min, max. 48 h). Vercel zeigt „Valid Configuration“ wenn es klappt.

### Alternative Hosts
- **Netlify**: gleiche Schritte (GitHub importieren → Domain in Site settings).
- **Cloudflare Pages**: Repo verbinden → Custom domain.
- **GitHub Pages**: nur für reine Static-Sites sinnvoll – für TanStack Start/SSR eher nicht ideal.

### Tipps
- SSL (HTTPS) kommt bei Vercel/Netlify/Cloudflare automatisch.
- Nach jedem `git push` auf `main` deployt Vercel neu.
- Environment Variables (z. B. Auth-Keys) unter Project → Settings → Environment Variables setzen.

---

*Blue Lagune – Damit die blaue Lagune immer in Reichweite bleibt.*
