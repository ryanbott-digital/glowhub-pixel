import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: Do NOT add a `server.url` here for release builds.
// A remote `server.url` turns the APK into a website wrapper that loads
// inside the system WebView (e.g. Amazon Silk on Fire TV) instead of the
// self-contained native shell. The CI build (.github/workflows/build-firetv.yml)
// will fail if `server.url` is present.
//
// For local live-reload during development only, you can temporarily add:
//   server: { url: 'https://<your-preview>.lovable.app', cleartext: true }
// but never commit it.

const config: CapacitorConfig = {
  appId: 'app.lovable.ac739cba0262443bbcae51cf10fbf03b',
  appName: 'GlowHub',
  webDir: 'dist',
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#000000',
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
