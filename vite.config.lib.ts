// vite.config.lib.ts
// Library-mode build: outputs dist/bug-panel.iife.js
// Bundles React + ReactDOM + BugPanel into a single IIFE.

import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: 'src/bug-panel-standalone.ts',
      name: 'SMBugPanel',
      fileName: 'bug-panel',
      formats: ['iife']
    },
    outDir: 'dist',
    minify: true,
    sourcemap: false,
    // Bundle everything — do not externalize React
    rollupOptions: {
      output: {
        // Ensure single file output
        inlineDynamicImports: true
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})
