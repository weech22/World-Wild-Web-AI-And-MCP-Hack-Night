import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [cloudflare(), react(), tailwindcss()],
  server: {
    // 1. Make the server accessible externally
    host: true,
    
    // 2. Allow any ngrok free-tier domain to connect
    allowedHosts: [
      // Allow the specific ngrok URL you are currently using
      'https://9288c4df2d2b.ngrok-free.app',
      // Or, use a regular expression to allow any ngrok free-tier URL
      /\.ngrok-free\.app$/,
    ],

    // 3. Configure HMR to work with ngrok
    hmr: {
        // Use the ngrok URL for HMR websockets
        host: ngrokUrl.replace(/^https?:\/\//, ''), // remove protocol
        protocol: 'wss',
    }
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
