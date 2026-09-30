// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      manifest: false,
      includeAssets: ["favicon.png", "icons/xchat-192.png", "icons/xchat-512.png"],
      workbox: {
        navigateFallback: null,
        globPatterns: ["**/*.{js,css,png,ico,svg,woff2}"],
        globIgnores: ["OneSignalSDKWorker.js", "native-bridge.js", "vendor/**"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && (url.pathname === "/" || url.pathname === "/app.html") && !url.pathname.startsWith('/~oauth'),
            handler: "NetworkFirst",
            options: { cacheName: "xchat-public-shell", networkTimeoutSeconds: 4, expiration: { maxEntries: 2, maxAgeSeconds: 7 * 24 * 60 * 60 }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: ({ request, url }) => url.origin === self.location.origin && request.destination === "script" && (url.pathname === "/lottie.min.js" || url.pathname === "/native-bridge.js" || url.pathname.startsWith("/vendor/")),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "xchat-static-scripts", expiration: { maxEntries: 8, maxAgeSeconds: 7 * 24 * 60 * 60 }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: ({ request, url }) => url.origin === self.location.origin && request.destination === "script" && /\/assets\/[^/]+\.[a-f0-9]{8,}\.js$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "xchat-versioned-assets", expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    })],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
