import { useState, type FormEvent } from "react";
import { SiteFooter } from "@/components/site-footer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const n = name.trim();
    const m = email.trim();
    const t = message.trim();
    if (n.length < 2 || n.length > 80) {
      setError("Bitte einen Namen angeben (2–80 Zeichen).");
      return;
    }
    if (!EMAIL_RE.test(m) || m.length > 120) {
      setError("Bitte eine gültige E-Mail-Adresse angeben.");
      return;
    }
    if (t.length < 10 || t.length > 4000) {
      setError("Die Nachricht sollte zwischen 10 und 4000 Zeichen haben.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: m, message: t, company: hp }),
      });
      if (res.status === 429) {
        setError("Zu viele Nachrichten. Bitte später noch einmal.");
        return;
      }
      if (!res.ok) {
        setError("Senden hat nicht geklappt. Bitte später noch einmal.");
        return;
      }
      setOk(true);
    } catch {
      setError("Senden hat nicht geklappt. Bitte später noch einmal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex max-w-lg items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <a href="/" className="inline-flex h-11 items-center gap-2 rounded-lg bg-surface px-3 text-sm ring-1 ring-border">
          ← Zurück
        </a>
        <div className="ml-auto font-display text-lg text-primary">Blue Lagune</div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 pb-8">
        <p className="text-xs tracking-wide text-muted uppercase">Kontakt</p>
        <h1 className="mt-1 font-display text-4xl leading-tight">Feedback</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hinweis zur Karte, ein Fehler, ein Wunsch. Wir lesen mit.
        </p>
        {ok ? (
          <p className="mt-8 rounded-2xl bg-surface p-4 text-sm leading-relaxed ring-1 ring-border">
            Danke. Deine Nachricht ist raus.
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Name</span>
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl bg-surface px-3 ring-1 ring-border outline-none focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">E-Mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-surface px-3 ring-1 ring-border outline-none focus:ring-primary"
              />
            </label>
            <label className="bl-hp" aria-hidden="true">
              Firma
              <input
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Nachricht</span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl bg-surface px-3 py-3 ring-1 ring-border outline-none focus:ring-primary"
              />
            </label>
            {error ? <p className="text-sm text-bad">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="h-12 rounded-full bg-primary text-base font-semibold text-primary-fg shadow-btn disabled:opacity-60"
            >
              {busy ? "Senden…" : "Absenden"}
            </button>
          </form>
        )}
      </main>
      <SiteFooter className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
