/**
 * Immersive Kiosk Mode for Android Capacitor builds.
 * Hides the system status bar and navigation bar so the player
 * occupies the entire screen. Re-applies on resume because Samsung
 * (and others) can re-show bars after focus changes.
 *
 * Safe no-op in browser/PWA contexts.
 */

let initialized = false;

async function applyHide() {
  try {
    // Vite-safe dynamic imports per mem://tech/build-constraints
    const statusBarPath = "@capacitor/status-bar";
    const navBarPath = "@hugotomazi/capacitor-navigation-bar";

    const { StatusBar } = await import(/* @vite-ignore */ statusBarPath);
    try {
      await StatusBar.hide();
    } catch (e) {
      console.warn("[immersive] StatusBar.hide failed", e);
    }
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch {
      /* not supported on all versions */
    }

    try {
      const { NavigationBar } = await import(/* @vite-ignore */ navBarPath);
      await NavigationBar.hide();
    } catch (e) {
      console.warn("[immersive] NavigationBar.hide failed", e);
    }
  } catch (e) {
    console.warn("[immersive] plugin load failed", e);
  }
}

export async function enableImmersiveMode() {
  try {
    const corePath = "@capacitor/core";
    const { Capacitor } = await import(/* @vite-ignore */ corePath);
    if (!Capacitor?.isNativePlatform?.()) return;

    // Lock down html/body/#root scrolling — prevents Samsung URL-bar bounce
    document.documentElement.classList.add("kiosk-lockdown");

    await applyHide();

    if (initialized) return;
    initialized = true;

    // Re-apply on app resume (Samsung re-shows bars after Recents/focus loss)
    try {
      const appPath = "@capacitor/app";
      const { App } = await import(/* @vite-ignore */ appPath);
      App.addListener("appStateChange", (state: { isActive: boolean }) => {
        if (state.isActive) applyHide();
      });
    } catch {
      /* @capacitor/app optional */
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") applyHide();
    });
  } catch (e) {
    console.warn("[immersive] init failed", e);
  }
}
