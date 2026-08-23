export function AuthSlot() {
  return (
    <a
      href="/login"
      className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 md:px-4"
      aria-label="Anmelden"
    >
      <span className="hidden sm:inline">Anmelden</span>
      <span className="sm:hidden" aria-hidden>
        👤
      </span>
    </a>
  );
}
