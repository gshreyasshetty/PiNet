// vite.config.js (in your Pi-Net web project)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all interfaces, making it accessible over the network
    port: 5173,      // Keep the port as 5173
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Proxy API requests to your backend
        changeOrigin: true,
      },
    },
  },
  root: path.resolve(__dirname),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});