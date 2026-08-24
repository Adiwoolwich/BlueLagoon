import { useMemo, useState } from "react";
import {
  isMobileDevice,
  navTargets,
  openNavigationWeb,
  type NavTarget,
} from "../lib/maps";

export function GoogleMapsButton({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const mobile = useMemo(() => isMobileDevice(), []);
  const targets = useMemo(() => navTargets(lat, lng, label), [lat, lng, label]);

  function openDesktop(e: React.MouseEvent) {
    e.preventDefault();
    openNavigationWeb(lat, lng, label);
  }

  function pick(target: NavTarget) {
    setSheetOpen(false);
    // geo: and app schemes must use location.href (not window.open)
    window.location.href = target.href;
  }

  if (!mobile) {
    return (
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`}
        onClick={openDesktop}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-border transition-[transform,filter] active:scale-95"
      >
        Navigation starten
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-border transition-[transform,filter] active:scale-95"
      >
        Navigation starten
      </button>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/55 p-3 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Navigations-App wählen"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-bg-elevated shadow-panel ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-fg">Navigation öffnen mit</p>
              <p className="mt-0.5 text-xs text-muted">
                Wähle eine installierte App auf deinem Smartphone
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {targets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t)}
                    className="flex h-12 w-full items-center px-4 text-left text-sm font-medium text-fg transition-[background-color] hover:bg-surface-2 active:bg-surface"
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex h-12 w-full items-center justify-center border-t border-border text-sm text-muted hover:bg-surface-2 hover:text-fg"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
