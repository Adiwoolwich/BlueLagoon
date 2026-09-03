/** Instant tap feel: haptic only on real touch, throttled. */

export function tapHaptic(e: Pick<PointerEvent, "pointerType">): void {
  if (e.pointerType !== "touch") return;
  try {
    navigator.vibrate?.(10);
  } catch {
    /* optional */
  }
}

export function installTapHaptic(): () => void {
  let last = 0;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "touch") return;
    const el = e.target;
    if (!(el instanceof Element)) return;
    if (!el.closest(".bl-tap, .bl-tap-row")) return;
    const now = performance.now();
    if (now - last < 80) return;
    last = now;
    tapHaptic(e);
  };
  document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
  return () => document.removeEventListener("pointerdown", onDown, true);
}
