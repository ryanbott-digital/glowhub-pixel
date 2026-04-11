import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const STATIC_ASSET_PATTERN = /\.(?:avif|bmp|css|gif|ico|jpe?g|js|json|map|mjs|mp3|mp4|ogg|otf|png|svg|ttf|wav|webmanifest|webm|webp|woff2?|xml)$/i;

const shouldApplyCorpHeader = (url = "") => STATIC_ASSET_PATTERN.test(url.split("?")[0]);

const staticAssetCorpHeader = () => ({
  name: "static-asset-corp-header",
  configureServer(server: Parameters<NonNullable<Exclude<ReturnType<typeof defineConfig>, Promise<unknown>>["plugins"]>>[0]) {
    server.middlewares.use((req, res, next) => {
      if (shouldApplyCorpHeader(req.url)) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      }

      next();
    });
  },
  configurePreviewServer(server: Parameters<NonNullable<Exclude<ReturnType<typeof defineConfig>, Promise<unknown>>["plugins"]>>[0]) {
    server.middlewares.use((req, res, next) => {
      if (shouldApplyCorpHeader(req.url)) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      }

      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    staticAssetCorpHeader(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      external: ["@capacitor-community/autostart"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
