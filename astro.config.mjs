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
    plugins: [tailwind()],
    define: { "import.meta.env.PUBLIC_SITE_URL": JSON.stringify(siteUrl) },
    server: {
      strictPort: true,
      watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === "true" },
    },
  },
});
