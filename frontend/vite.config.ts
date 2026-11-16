
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Destino del backend en desarrollo. Se puede apuntar a otra instancia con la
// variable VITE_BACKEND_URL, util para probar contra un servidor levantado en
// paralelo sin tocar esta configuracion.
const destino = process.env.VITE_BACKEND_URL || 'http://localhost:8081';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer', 'crypto-browserify', 'stream-browserify', 'util'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: destino,
        changeOrigin: true,
      },
      '/restaurants': {
        target: destino,
        changeOrigin: true,
      },
      '/menu-items': {
        target: destino,
        changeOrigin: true,
      },
      '/orders': {
        target: destino,
        changeOrigin: true,
      },
      '/beverages': {
        target: destino,
        changeOrigin: true,
      },
      '/restaurant-beverages': {
        target: destino,
        changeOrigin: true,
      },
      '/categories': {
        target: destino,
        changeOrigin: true,
      },
      '/zones': {
        target: destino,
        changeOrigin: true,
      },
      '/qr-codes': {
        target: destino,
        changeOrigin: true,
      },
      '/ws-orders': {
        target: destino,
        ws: true,
      },
      '/ws': {
        target: destino,
        ws: true,
      },
    },
  },
});