import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import proxyOptions from './proxyOptions'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: proxyOptions
  },
  build: {
    outDir: '../iswitch/public/portal',
    emptyOutDir: true,
    target: 'es2015',
  },
});
