// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Cross-platform stable config (Windows + Docker + LAN)
export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",       // allows external access (LAN or Docker)
        port: 5173,
        strictPort: true,
        open: true,            // auto-open browser on start
        watch: {
            usePolling: true,    // helps file reloads inside Docker/WSL
        },
    },
    preview: {
        port: 5173,
        open: true,
    },
    resolve: {
        alias: {
            "@": "/src",         // allows imports like '@/components/Button'
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
});
