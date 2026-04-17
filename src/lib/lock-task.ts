/**
 * Lock Task Mode (Android screen pinning) bridge.
 * Safe no-op outside native Android.
 */

const STORAGE_KEY = "glowhub_lock_task_enabled_v1";

async function getPlugin(): Promise<any | null> {
  try {
    const corePath = "@capacitor/core";
    const { Capacitor, registerPlugin } = await import(/* @vite-ignore */ corePath);
    if (!Capacitor?.isNativePlatform?.()) return null;
    if (Capacitor.getPlatform?.() !== "android") return null;
    return registerPlugin("LockTask");
  } catch {
    return null;
  }
}

export async function startLockTask(): Promise<boolean> {
  const p = await getPlugin();
  if (!p) return false;
  try {
    await p.start();
    localStorage.setItem(STORAGE_KEY, "1");
    return true;
  } catch (e) {
    console.warn("[lock-task] start failed", e);
    return false;
  }
}

export async function stopLockTask(): Promise<boolean> {
  const p = await getPlugin();
  if (!p) return false;
  try {
    await p.stop();
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.warn("[lock-task] stop failed", e);
    return false;
  }
}

export async function isLockTaskActive(): Promise<boolean> {
  const p = await getPlugin();
  if (!p) return false;
  try {
    const r = await p.isActive();
    return !!r?.active;
  } catch {
    return false;
  }
}

export function isLockTaskPreferred(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setLockTaskPreferred(enabled: boolean) {
  if (enabled) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);
}
