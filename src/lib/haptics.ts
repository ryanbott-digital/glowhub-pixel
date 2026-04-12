/**
 * Haptic feedback utilities for mobile touch interactions.
 * Uses the Vibration API (supported on Android / most mobile browsers).
 * Silently no-ops on unsupported platforms (iOS Safari, desktop).
 */

/** Light tap — for confirming a selection or toggle (10ms) */
export function hapticLight() {
  navigator.vibrate?.(10);
}

/** Medium tap — for drag start, long-press activation (15ms) */
export function hapticMedium() {
  navigator.vibrate?.(15);
}

/** Success pattern — for drop confirmation (two quick pulses) */
export function hapticSuccess() {
  navigator.vibrate?.([12, 60, 12]);
}

/** Warning pattern — for destructive or alert actions */
export function hapticWarning() {
  navigator.vibrate?.([30, 50, 30]);
}
