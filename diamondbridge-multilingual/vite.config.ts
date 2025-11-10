import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import sourceIdentifierPlugin from 'vite-plugin-source-identifier';

const isProd = process.env.BUILD_MODE === 'prod';

export default defineConfig({
  base: '/', // 👈 обязательно для Vercel
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // 👈 Vercel ищет именно эту папку
  },
});
