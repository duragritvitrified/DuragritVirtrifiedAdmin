import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  envDir: path.resolve(__dirname, '..'),
  server: {
    port: 3001,
    host: true
  }
});
