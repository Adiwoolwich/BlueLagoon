/** Navigation helpers. Destinations are GPS coords only — never a place-name search. */

import { fullAddress, hasPreciseCoords, hasStreetAddress } from "./stations";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;
  return false;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

function coords(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function safeLabel(label?: string): string {
  return (label ?? "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Android / iOS geo: handler. Query is lat,lng so apps cannot geocode a wrong namesake. */
export function geoNavUrl(lat: number, lng: number, label?: string) {
  const ll = coords(lat, lng);
  const name = safeLabel(label);
  const q = name ? `${ll}(${name})` : ll;
  return `geo:${ll}?q=${encodeURIComponent(q)}`;
}

/** Apple Maps turn-by-turn to the pin, not a name search. */
export function appleMapsUrl(lat: number, lng: number, _label?: string) {
  const ll = coords(lat, lng);
  return `https://maps.apple.com/?daddr=${ll}&ll=${ll}&dirflg=d`;
}

/**
 * Google Maps directions to the exact pin.
 * Do not pass "Name@lat,lng" — Google treats that as a place search and often
 * opens a different dump station or fails entirely.
 */
export function googleMapsWebUrl(lat: number, lng: number, _label?: string) {
  const dest = encodeURIComponent(coords(lat, lng));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

export function wazeUrl(lat: number, lng: number) {
  const dest = encodeURIComponent(coords(lat, lng));
  return `https://waze.com/ul?ll=${dest}&navigate=yes`;
}

export type NavTarget = {
  id: string;
  label: string;
  href: string;
};

export function navTargets(lat: number, lng: number, label?: string): NavTarget[] {
  const targets: NavTarget[] = [];

  if (isAndroid()) {
    targets.push({
      id: "system",
      label: "Installierte Navi-App wählen",
      href: geoNavUrl(lat, lng, label),
    });
  }

  if (isIOS()) {
    targets.push({
      id: "apple",
      label: "Apple Karten",
      href: appleMapsUrl(lat, lng, label),
    });
  }

  targets.push({
    id: "google",
    label: "Google Maps",
    href: googleMapsWebUrl(lat, lng, label),
  });

  targets.push({
    id: "waze",
    label: "Waze",
    href: wazeUrl(lat, lng),
  });

  if (isIOS()) {
    targets.push({
      id: "geo",
      label: "Andere installierte App",
      href: geoNavUrl(lat, lng, label),
    });
  }

  return targets;
}

export function openNavigationWeb(lat: number, lng: number, label?: string) {
  launchNav(googleMapsWebUrl(lat, lng, label));
}

/** @deprecated use openNavigationWeb or mobile sheet */
export function openGoogleMapsApp(lat: number, lng: number, label?: string) {
  openNavigationWeb(lat, lng, label);
}

export function geoAddressUrl(address: string) {
  return `geo:0,0?q=${encodeURIComponent(address)}`;
}

export function appleMapsAddressUrl(address: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;
}

export function googleMapsAddressUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

export function navTargetsAddress(address: string): NavTarget[] {
  const targets: NavTarget[] = [];
  if (isAndroid()) {
    targets.push({ id: "system", label: "Installierte Navi-App wählen", href: geoAddressUrl(address) });
  }
  if (isIOS()) {
    targets.push({ id: "apple", label: "Apple Karten", href: appleMapsAddressUrl(address) });
  }
  targets.push({ id: "google", label: "Google Maps", href: googleMapsAddressUrl(address) });
  if (isIOS()) {
    targets.push({ id: "geo", label: "Andere installierte App", href: geoAddressUrl(address) });
  }
  return targets;
}

export function openNavigationAddress(address: string) {
  launchNav(googleMapsAddressUrl(address));
}

/** Open https in a new tab; app-schemes (geo:) in the same window so iOS/Android can hand off. */
export function launchNav(href: string) {
  if (!href || href === "#") return;
  if (/^https?:/i.test(href)) {
    const w = window.open(href, "_blank", "noopener,noreferrer");
    if (!w) window.location.assign(href);
    return;
  }
  window.location.assign(href);
}

/** Precise coords preferred. Address-only if the street can be resolved. Never invents city-centroid coords. */
export function navTargetsForPlace(place: {
  lat?: number;
  lng?: number;
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}): NavTarget[] {
  if (hasPreciseCoords(place)) {
    return navTargets(place.lat as number, place.lng as number, place.name);
  }
  if (hasStreetAddress(place)) {
    return navTargetsAddress(fullAddress(place));
  }
  return [];
}
