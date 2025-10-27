import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,          // bind 0.0.0.0 so LAN devices can reach it
        port: 5173,
        strictPort: true,
        hmr: {
            host: "192.168.1.208", // <- your PC’s LAN IP
            port: 5173
        }
    }
});
