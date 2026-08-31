import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Route-level code-splitting (React.lazy in App.tsx) keeps the initial
    // bundle to the public/customer path; staff dashboards load on demand.
    chunkSizeWarningLimit: 700,
  },
});
