export default defineConfig({
  base: '/', // 👈 обязательно для Vercel
  plugins: [react(), sourceIdentifierPlugin({ ... })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist' // 👈 Vercel ищет именно эту папку
  }
});
