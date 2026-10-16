import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Vitest: browser-like test environment and global test APIs.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },

  // Compile web workers as modern ES modules.
  worker: {
    format: 'es',
  },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'codemirror',
              test: /node_modules[\\/](?:@uiw[\\/]react-codemirror|@codemirror[\\/])/,
              priority: 30,
            },
            {
              name: 'reactflow',
              test: /node_modules[\\/]reactflow[\\/]/,
              priority: 25,
            },
            {
              name: 'sheetjs',
              test: /node_modules[\\/]xlsx[\\/]/,
              priority: 25,
            },
            {
              name: 'parser',
              test: /node_modules[\\/]papaparse[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});