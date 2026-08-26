import type { ReactNode } from "react";
import { LEGAL, hasCompleteImprint } from "@/lib/legal";
import { SiteFooter } from "@/components/site-footer";

function Shell({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <a href="/" className="inline-flex h-11 items-center gap-2 rounded-lg bg-surface px-3 text-sm ring-1 ring-border">
          ← Karte
        </a>
        <div className="ml-auto font-display text-lg text-primary">Blue Lagune</div>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-8">
        <p className="text-xs tracking-wide text-muted uppercase">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl leading-tight">{title}</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-fg [&_a]:text-primary">
          {children}
        </div>
      </article>
      <SiteFooter className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}

export function ImpressumPage() {
  return (
    <Shell kicker="Rechtliches" title="Impressum">
      <p>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).</p>
      <h2>Diensteanbieter</h2>
      {hasCompleteImprint() ? (
        <p>
          {LEGAL.operatorName}
          <br />
          {LEGAL.street}
          <br />
          {LEGAL.zip} {LEGAL.city}
          <br />
          {LEGAL.country}
        </p>
      ) : (
        <p>
          Blue Lagune, erreichbar über die unten genannte E-Mail. Name und
          ladungsfähige Anschrift des Betreibers werden hier ergänzt.
        </p>
      )}
      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>Verantwortlich nach § 18 Abs. 2 MStV: {LEGAL.operatorName || "der Betreiber, siehe Kontakt"}.</p>
      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Stationseinträge dienen der Orientierung. Öffnungszeiten und Ausstattung können
        sich ändern. Für verlinkte Websites sind deren Betreiber verantwortlich.
      </p>
      <h2>EU-Streitschlichtung</h2>
      <p>
        Plattform der EU-Kommission:{" "}
        <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer" target="_blank">
          https://ec.europa.eu/consumers/odr
        </a>
        . Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil.
      </p>
    </Shell>
  );
}

export function DatenschutzPage() {
  return (
    <Shell kicker="Rechtliches" title="Datenschutz">
      <p>
        Verantwortlich im Sinne der DSGVO ist der im <a href="/impressum">Impressum</a> genannte Anbieter.
      </p>
      <h2>Welche Daten anfallen</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong className="text-fg">Karte:</strong> Aufrufe von OpenStreetMap-Kacheln (IP-Adresse technisch nötig).
        </li>
        <li>
          <strong className="text-fg">Standort:</strong> nur im Browser nach Freigabe, nicht an uns gesendet.
        </li>
        <li>
          <strong className="text-fg">Local Storage:</strong> Filter und Merkliste auf deinem Gerät.
        </li>
        <li>
          <strong className="text-fg">Hosting:</strong> Cloudflare-Logs (IP, Zeitpunkt, Datei) zur Sicherheit.
        </li>
      </ul>
      <h2>Rechtsgrundlagen</h2>
      <p>Art. 6 Abs. 1 lit. f DSGVO (Betrieb), lit. a bei Standortfreigabe.</p>
      <h2>Deine Rechte</h2>
      <p>
        Auskunft, Löschung, Widerspruch. Kontakt:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
      <h2>Cookies</h2>
      <p>Keine Tracking- oder Werbe-Cookies.</p>
    </Shell>
  );
}
