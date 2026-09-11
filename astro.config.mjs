import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@tailwindcss/vite";

const siteUrl = (process.env.SITE_URL || "https://hjy.me").replace(/\/$/, "");

export default defineConfig({
  site: siteUrl,
  output: "static",
  outDir: "./out",
  trailingSlash: "always",
  integrations: [react()],
  devToolbar: { enabled: false },
  server: {
    host: process.env.SITE_BIND_HOST || "127.0.0.1",
    port: Number(process.env.SITE_PORT || 5680),
  },
  vite: {
    // Releases share node_modules through a symlink. Keep each project's runtime
    // cache outside it so a production build cannot overwrite the live dev cache.
    cacheDir: `.astro/vite/${process.env.NODE_ENV === "production" ? "production" : "development"}`,
    plugins: [tailwind()],
    define: { "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(siteUrl) },
    server: {
      strictPort: true,
      watch: {
        usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
        // Snapshot configs and generated pages must not restart the live site.
        ignored: ["**/.studio/**", "**/out/**"],
      },
    },
  },
});
