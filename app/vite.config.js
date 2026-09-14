import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5501,
    strictPort: true,
    watch: {
      ignored: [
        '**/reports/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/tests/e2e/__screenshots__/**',
      ],
    },
    proxy: process.env.VITE_AGENT_PROXY_TARGET ? {
      '/api': {
        target: process.env.VITE_AGENT_PROXY_TARGET,
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_AGENT_PROXY_TARGET,
        changeOrigin: true,
      },
    } : undefined,
  },
  preview: {
    port: 4501,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
