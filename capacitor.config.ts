import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ac739cba0262443bbcae51cf10fbf03b',
  appName: 'GlowHub',
  webDir: 'dist',
  server: {
    url: 'https://glowhub-pixel.lovable.app/player?forceHideBadge=true',
    cleartext: true,
  },
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
