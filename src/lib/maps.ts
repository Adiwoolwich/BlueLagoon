/** Navigation helpers: mobile app chooser, desktop web fallback */

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

/** Android system chooser for installed map/nav apps */
export function geoNavUrl(lat: number, lng: number, label?: string) {
  const name = label?.trim();
  const q = name ? `${lat},${lng}(${name})` : `${lat},${lng}`;
  return `geo:${lat},${lng}?q=${encodeURIComponent(q)}`;
}

/** Apple Maps directions (iOS / macOS) */
export function appleMapsUrl(lat: number, lng: number, label?: string) {
  const daddr = label?.trim()
    ? encodeURIComponent(`${label.trim()}@${lat},${lng}`)
    : `${lat},${lng}`;
  return `https://maps.apple.com/?daddr=${daddr}&dirflg=d`;
}

/** Google Maps web / app (universal link) */
export function googleMapsWebUrl(lat: number, lng: number, label?: string) {
  const dest = label?.trim()
    ? encodeURIComponent(`${label.trim()}@${lat},${lng}`)
    : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving&dir_action=navigate`;
}

/** Waze navigate link */
export function wazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
}

export type NavTarget = {
  id: string;
  label: string;
  href: string;
};

/** Options shown in the mobile app picker sheet */
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

/** Desktop / non-mobile: open Google Maps web directions */
export function openNavigationWeb(lat: number, lng: number, label?: string) {
  window.open(googleMapsWebUrl(lat, lng, label), "_blank", "noopener,noreferrer");
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
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving&dir_action=navigate`;
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
  window.open(googleMapsAddressUrl(address), "_blank", "noopener,noreferrer");
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
