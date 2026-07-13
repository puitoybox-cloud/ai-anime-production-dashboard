import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use relative asset URLs so the GitHub Pages deployment works whether it is
  // served from /ai-anime-production-dashboard/ or a custom Pages domain/path.
  base: './',
  plugins: [react()],
});
