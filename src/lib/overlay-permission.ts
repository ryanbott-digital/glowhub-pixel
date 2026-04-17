/**
 * Overlay-permission ("Display over other apps" / SYSTEM_ALERT_WINDOW) bridge.
 * Wraps the native OverlayPermissionPlugin we register in MainActivity.java.
 * Safe no-op in browser/PWA contexts.
 */

const PROMPTED_KEY = "glowhub_overlay_prompted_v1";

async function getPlugin() {
  try {
    const corePath = "@capacitor/core";
    const { Capacitor, registerPlugin } = await import(/* @vite-ignore */ corePath);
    if (!Capacitor?.isNativePlatform?.()) return null;
    if (Capacitor.getPlatform?.() !== "android") return null;
    return registerPlugin("OverlayPermission") as {
      check: () => Promise<{ granted: boolean }>;
      request: () => Promise<{ opened: boolean }>;
    };
  } catch {
    return null;
  }
}

export async function isOverlayGranted(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return true; // assume granted in non-native contexts
  try {
    const { granted } = await plugin.check();
    return !!granted;
  } catch {
    return true;
  }
}

export async function requestOverlayPermission(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    await plugin.request();
  } catch (e) {
    console.warn("[overlay-permission] request failed", e);
  }
}

export function markOverlayPrompted() {
  try {
    localStorage.setItem(PROMPTED_KEY, "1");
  } catch { /* noop */ }
}

export function hasOverlayBeenPrompted(): boolean {
  try {
    return localStorage.getItem(PROMPTED_KEY) === "1";
  } catch {
    return true;
  }
}
