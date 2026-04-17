import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ac739cba0262443bbcae51cf10fbf03b',
  appName: 'GlowHub',
  webDir: 'dist',
  server: {
    url: 'https://glowhub-pixel.lovable.app/player?forceHideBadge=true',
    cleartext: true,
  },
  backgroundColor: '#0B1120',
  android: {
    backgroundColor: '#0B1120',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#0B1120',
    },
  },
};

export default config;
