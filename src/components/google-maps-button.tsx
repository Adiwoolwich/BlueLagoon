import { useMemo, useState } from "react";
import {
  isMobileDevice,
  navTargetsForPlace,
  openNavigationAddress,
  openNavigationWeb,
  type NavTarget,
} from "../lib/maps";
import { canNavigateTo, fullAddress, hasPreciseCoords } from "../lib/stations";

export function GoogleMapsButton({
  lat,
  lng,
  label,
  address,
  city,
  postalCode,
}: {
  lat?: number;
  lng?: number;
  label?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const mobile = useMemo(() => isMobileDevice(), []);
  const place = { lat, lng, name: label, address, city, postalCode };
  const navigable = canNavigateTo(place);
  const precise = hasPreciseCoords(place);
  const targets = useMemo(() => navTargetsForPlace(place), [lat, lng, label, address, city, postalCode]);

  if (!navigable || targets.length === 0) {
    return (
      <p className="rounded-xl bg-surface px-3 py-2.5 text-sm text-muted ring-1 ring-border">
        Keine genaue Position – Navigation nicht möglich.
      </p>
    );
  }

  function openDesktop(e: React.MouseEvent) {
    e.preventDefault();
    if (precise && lat != null && lng != null) {
      openNavigationWeb(lat, lng, label);
      return;
    }
    openNavigationAddress(fullAddress(place));
  }

  function pick(target: NavTarget) {
    setSheetOpen(false);
    window.location.href = target.href;
  }

  const cls =
    "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-btn transition-[transform,filter] active:scale-[0.98]";

  if (!mobile) {
    return (
      <a
        href={targets.find((t) => t.id === "google")?.href ?? "#"}
        onClick={openDesktop}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        Navigation starten
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setSheetOpen(true)} className={cls}>
        Navigation starten
      </button>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/50 p-3"
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
              <p className="mt-0.5 text-xs text-muted">Wähle eine installierte App auf deinem Smartphone</p>
            </div>
            <ul className="divide-y divide-border/60">
              {targets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t)}
                    className="flex h-12 w-full items-center px-4 text-left text-sm font-medium text-fg hover:bg-surface-2"
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
