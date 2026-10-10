import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ["maplibre-gl"] },
  base: process.env.GITHUB_PAGES === "1" ? "/Reachbloom/" : "/",
  worker: { format: "es" },
  test: { environment: "jsdom", include: ["tests/**/*.test.ts"] },
});
