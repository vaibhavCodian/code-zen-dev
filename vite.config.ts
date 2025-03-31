import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/code-zen-dev/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
