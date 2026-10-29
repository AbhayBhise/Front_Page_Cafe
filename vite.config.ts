import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Dynamically resolve base path: supports GitHub Pages (/Front_Page_Cafe/),
  // custom domain (/), and containerized deployments.
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_PAGES === 'true' ? '/Front_Page_Cafe/' : '/'),
  plugins: [react()],
  build: {
    // Route-level code-splitting (React.lazy in App.tsx) keeps the initial
    // bundle to the public/customer path; staff dashboards load on demand.
    chunkSizeWarningLimit: 700,
  },
});
