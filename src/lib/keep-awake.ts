/**
 * Keep-Awake helper for Android Capacitor kiosk builds.
 * Prevents screen timeout regardless of Samsung system sleep settings.
 * Safe no-op in browser/PWA contexts.
 */

let initialized = false;

async function applyKeepAwake() {
  try {
    const pkg = ["@capacitor-community", "keep-awake"].join("/");
    const { KeepAwake } = await import(/* @vite-ignore */ pkg);
    await KeepAwake.keepAwake();
  } catch (e) {
    console.warn("[keep-awake] failed", e);
  }
}

export async function enableKeepAwake() {
  try {
    const corePath = "@capacitor/core";
    const { Capacitor } = await import(/* @vite-ignore */ corePath);
    if (!Capacitor?.isNativePlatform?.()) return;

    await applyKeepAwake();

    if (initialized) return;
    initialized = true;

    // Re-apply on resume — some OEMs drop the wakelock when backgrounded
    try {
      const appPath = "@capacitor/app";
      const { App } = await import(/* @vite-ignore */ appPath);
      App.addListener("appStateChange", (state: { isActive: boolean }) => {
        if (state.isActive) applyKeepAwake();
      });
    } catch {
      /* @capacitor/app optional */
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") applyKeepAwake();
    });
  } catch (e) {
    console.warn("[keep-awake] init failed", e);
  }
}
