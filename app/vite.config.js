import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query'],
          'web3-vendor': ['wagmi', 'viem'],
        },
      },
    },
  },
  server: {
    port: 5501,
    strictPort: true,
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
