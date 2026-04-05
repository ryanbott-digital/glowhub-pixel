/**
 * Capacitor Autostart helper.
 *
 * This module wraps @capacitor-community/autostart so the web build
 * never crashes when the plugin is unavailable (e.g. in a browser).
 * The plugin only works inside a native Android Capacitor shell.
 */

let AutoStart: any = null;

async function getPlugin() {
  if (AutoStart) return AutoStart;
  try {
    const mod = await import("@capacitor-community/autostart");
    AutoStart = mod.AutoStart ?? mod.default;
    return AutoStart;
  } catch {
    return null;
  }
}

/** Returns true when running inside a Capacitor native shell. */
export function isNativePlatform(): boolean {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

/** Enable launch-on-boot (Android only). */
export async function enableAutoStart(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    await plugin.enable();
    return true;
  } catch {
    return false;
  }
}

/** Disable launch-on-boot. */
export async function disableAutoStart(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    await plugin.disable();
    return true;
  } catch {
    return false;
  }
}

/** Check if autostart is currently enabled. */
export async function isAutoStartEnabled(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const { enabled } = await plugin.isEnabled();
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Detect if the app was cold-launched (boot or app-switch)
 * vs. navigated to by the user. We set a sessionStorage flag
 * on first load — if it's not there, this is a fresh launch.
 */
const BOOT_FLAG = "glowhub_session_started";

export function isBootLaunch(): boolean {
  if (sessionStorage.getItem(BOOT_FLAG)) return false;
  sessionStorage.setItem(BOOT_FLAG, "1");
  return true;
}
