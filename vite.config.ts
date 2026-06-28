import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Configure Hot Module Replacement based on environmental constraints
      hmr: process.env.DISABLE_HMR !== 'true',
      // Optimise file watching based on environment configurations
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
