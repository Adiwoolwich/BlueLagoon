import { useMemo, useState, type ReactNode } from "react";
import { isMobileDevice, navTargetsForPlace, type NavTarget } from "../lib/maps";
import { canNavigateTo } from "../lib/stations";
import { t, useLang } from "../lib/i18n";

function targetLabel(id: string, fallback: string) {
  if (id === "system") return t("navSystem");
  if (id === "apple") return t("navApple");
  if (id === "google") return t("navGoogle");
  if (id === "waze") return t("navWaze");
  if (id === "geo") return t("navOther");
  return fallback;
}

function isHttp(href: string) {
  return /^https?:/i.test(href);
}

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
  useLang();
  const [sheetOpen, setSheetOpen] = useState(false);
  const mobile = useMemo(() => isMobileDevice(), []);
  const place = { lat, lng, name: label, address, city, postalCode };
  const navigable = canNavigateTo(place);
  const targets = useMemo(
    () => navTargetsForPlace(place),
    [lat, lng, label, address, city, postalCode],
  );
  const googleHref = targets.find((x) => x.id === "google")?.href ?? targets[0]?.href ?? "#";

  if (!navigable || targets.length === 0) {
    return (
      <p className="rounded-xl bg-surface px-3 py-2.5 text-sm text-muted ring-1 ring-border">
        {t("navMissing")}
      </p>
    );
  }

  const cls =
    "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-btn transition-[transform,filter] active:scale-[0.98]";

  if (!mobile) {
    return (
      <a href={googleHref} target="_blank" rel="noopener noreferrer" className={cls}>
        {t("navStart")}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setSheetOpen(true)} className={cls}>
        {t("navStart")}
      </button>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/50 p-3"
          role="dialog"
          aria-modal="true"
          aria-label={t("navChoose")}
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-bg-elevated shadow-panel ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-fg">{t("navOpenWith")}</p>
              <p className="mt-0.5 text-xs text-muted">{t("navPick")}</p>
            </div>
            <ul className="divide-y divide-border/60">
              {targets.map((x) => (
                <li key={x.id}>
                  <NavLink target={x} onPick={() => setSheetOpen(false)}>
                    {targetLabel(x.id, x.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex h-12 w-full items-center justify-center border-t border-border text-sm text-muted hover:bg-surface-2 hover:text-fg"
            >
              {t("navCancel")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function NavLink({
  target,
  onPick,
  children,
}: {
  target: NavTarget;
  onPick: () => void;
  children: ReactNode;
}) {
  const http = isHttp(target.href);
  return (
    <a
      href={target.href}
      target={http ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={onPick}
      className="flex h-12 w-full items-center px-4 text-left text-sm font-medium text-fg hover:bg-surface-2"
    >
      {children}
    </a>
  );
}
