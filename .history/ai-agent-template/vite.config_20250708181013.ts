import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [cloudflare(), react(), tailwindcss()],
  server: {
    // 2. Alow any ngrok free-tier domain to connect
    allowedHosts: ["https://9288c4df2d2b.ngrok-free.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
