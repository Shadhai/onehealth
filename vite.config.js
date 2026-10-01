import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "frontend",
  plugins: [react({ jsxRuntime: "automatic" })],
  server: {
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