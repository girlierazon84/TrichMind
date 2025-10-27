// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Safe and simple config (no cross-type conflicts)
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // accessible via LAN
        port: 5173,
        strictPort: true,
        open: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost'
        }
    }
});
