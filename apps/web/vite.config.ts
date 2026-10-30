import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy langsung ke RAG service selama development lokal
      '/internal/rag': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      // Proxy untuk public API nantinya
      '/api/v1': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});

