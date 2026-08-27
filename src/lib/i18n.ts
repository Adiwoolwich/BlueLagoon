import { useSyncExternalStore } from "react";
import {
  DAY_ORDER,
  formatDayHours,
  HOURS_LABEL,
  resolveWeeklyHours,
  type ChemicalRule,
  type DayHours,
  type FeeKind,
  type HoursCertainty,
  type HoursKind,
  type Station,
  type StationType,
  type TrustStatus,
} from "./stations";

export type Lang = "de" | "en";

const KEY = "bl-lang";

function readSaved(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "de") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function detect(): Lang {
  const saved = readSaved();
  if (saved) return saved;
  try {
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("en")) return "en";
  } catch {
    /* ignore */
  }
  return "de";
}

let current: Lang = "de";
let booted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function bootLang() {
  if (booted) return getLang();
  booted = true;
  current = detect();
  if (typeof document !== "undefined") {
    document.documentElement.lang = current;
    document.title = current === "en"
      ? "Blue Lagune – cassette toilet dump stations | Germany & the Netherlands"
      : "Blue Lagune – Chemietoilette entsorgen | Stationen in DE + NL";
  }
  return current;
}

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang) {
  if (next !== "de" && next !== "en") return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.title = next === "en"
      ? "Blue Lagune – cassette toilet dump stations | Germany & the Netherlands"
      : "Blue Lagune – Chemietoilette entsorgen | Stationen in DE + NL";
  }
  emit();
}

export function toggleLang() {
  setLang(current === "de" ? "en" : "de");
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLang,
    () => "de",
  );
}
