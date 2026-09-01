import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vite";
import { apiDev } from "./vite-plugin-api.ts";

// API handlery čtou process.env — v devu je natáhneme z .env.local.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDev()],
  // 3000 i 3100 bývají na tomhle stroji obsazené.
  server: { port: 4321, strictPort: true },
});
