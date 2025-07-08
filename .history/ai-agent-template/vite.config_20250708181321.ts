import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { ngrok } from "vite-plugin-ngrok";

export default defineConfig({
  plugins: [
    cloudflare(),
    react(),
    tailwindcss(),
    ngrok("NGROK_AUTH_TOKEN_IN_HERE"),
  ],
  server: {
    allowedHosts: ["https://9288c4df2d2b.ngrok-free.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
