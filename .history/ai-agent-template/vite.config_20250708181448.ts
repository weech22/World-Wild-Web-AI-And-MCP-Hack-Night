import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { ngrok } from "vite-plugin-ngrok";
const { NGROK_AUTH_TOKEN } = loadEnv("", process.cwd(), "NGROK");

export default defineConfig({
  plugins: [cloudflare(), react(), tailwindcss(), ngrok(NGROK_AUTH_TOKEN)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
