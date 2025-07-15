import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // o '/' si no estás usando rutas relativas
  build: {
    outDir: 'dist',
  },
});
