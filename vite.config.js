import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  root: "frontend",
  plugins: [
    react({ jsxRuntime: "automatic" }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "OneHealth Lens",
        short_name: "OneHealth Lens",
        description: "Explainable citizen water observations for One Health action.",
        theme_color: "#071210",
        background_color: "#071210",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "en",
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,woff2,webp,png,jpg}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/") ||
              url.pathname.startsWith("/insights/") ||
              url.pathname.startsWith("/fhir/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "onehealth-api",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === "POST" && url.pathname === "/ingest/observations",
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "onehealth-observation-submissions",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api":      "http://localhost:8000",
      "/insights": "http://localhost:8000",
      "/fhir":     "http://localhost:8000",
      "/ingest":   "http://localhost:8000",
      "/health":   "http://localhost:8000",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    include: ["test/**/*.test.{js,jsx}"],
    css: false,
  },
});