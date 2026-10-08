import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Horizon",
        short_name: "Horizon",
        description: "Today's list, tomorrow's plan — a time-horizon todo app.",
        start_url: "/",
        display: "standalone",
        background_color: "#eceef0",
        theme_color: "#eceef0",
        icons: [
          { src: "pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      // Precache only the built app shell (JS/CSS/HTML/icons). Deliberately no
      // runtimeCaching entries for AppSync/Cognito — those are cross-origin
      // API calls that must always hit the network, not be served from a
      // stale cache. See design/design-principles.md's PWA scope entry.
      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
});
