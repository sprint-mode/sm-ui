#!/usr/bin/env node
// scripts/fix-dts-paths.js
// Post-build: rewrites .tsx and .ts import paths in dist/src/*.d.ts to .js
// so TypeScript's bundler moduleResolution resolves to the adjacent .d.ts files
// instead of chasing back to source .tsx files.

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const distSrc = join(process.cwd(), 'dist', 'src')

for (const file of readdirSync(distSrc)) {
  if (!file.endsWith('.d.ts')) continue
  const p = join(distSrc, file)
  const original = readFileSync(p, 'utf8')
  // Replace './foo.tsx' and './foo.ts' with './foo.js' in from/import paths
  const fixed = original
    .replace(/(from\s+['"])([^'"]+)\.tsx(['"])/g, '$1$2.js$3')
    .replace(/(from\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+)\.tsx(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3')
  if (fixed !== original) {
    writeFileSync(p, fixed)
    console.log('fixed:', file)
  }
}
console.log('done')
