import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development the API is proxied, so the SPA and API share an origin and the
// SameSite=Strict refresh cookie works exactly as it will behind a production reverse proxy.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" } },
  build: {
    sourcemap: false,
    // Older Android System WebViews (Chrome 87+) and iOS 14+ Safari: modern syntax is lowered so pages
    // don't fail to load on older phones.
    target: ["es2020", "chrome87", "safari14"],
    rollupOptions: {
      output: {
        // Big libraries in their own long-cached files, so app updates download less.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            /[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          )
            return "react";
          if (/[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id))
            return "charts";
          return undefined;
        },
      },
    },
  },
});
