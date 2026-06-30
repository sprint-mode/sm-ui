#!/usr/bin/env node
// scripts/fix-dts-paths.js
// Post-build fixups for dist/src/*.d.ts:
// 1. Rewrites .tsx/.ts import paths to .js so TypeScript's bundler
//    moduleResolution resolves to adjacent .d.ts files instead of source.
// 2. Copies dist/Icons.d.ts -> dist/src/Icons.d.ts so the
//    "export * from './Icons.jsx'" in index.d.ts resolves correctly.

import { readFileSync, writeFileSync, readdirSync, copyFileSync } from 'fs'
import { join } from 'path'

const distRoot = join(process.cwd(), 'dist')
const distSrc = join(distRoot, 'src')

// 1. Rewrite .tsx/.ts paths to .js in all dist/src/*.d.ts
for (const file of readdirSync(distSrc)) {
  if (!file.endsWith('.d.ts')) continue
  const p = join(distSrc, file)
  const original = readFileSync(p, 'utf8')
  const fixed = original
    .replace(/(from\s+['"])([^'"]+)\.tsx(['"])/g, '$1$2.js$3')
    .replace(/(from\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+)\.tsx(['"])/g, '$1$2.js$3')
    .replace(/(import\s+['"])([^'"]+)\.ts(['"])/g, '$1$2.js$3')
  if (fixed !== original) {
    writeFileSync(p, fixed)
    console.log('fixed paths:', file)
  }
}

// 2. Copy Icons.d.ts from dist/ root into dist/src/ so index.d.ts can resolve it
const iconsSrc = join(distRoot, 'Icons.d.ts')
const iconsDst = join(distSrc, 'Icons.d.ts')
copyFileSync(iconsSrc, iconsDst)
console.log('copied: Icons.d.ts -> dist/src/Icons.d.ts')

// 3. Copy DocumentDetail.d.ts from dist/ root into dist/src/
const docDetailSrc = join(distRoot, 'DocumentDetail.d.ts')
const docDetailDst = join(distSrc, 'DocumentDetail.d.ts')
try { copyFileSync(docDetailSrc, docDetailDst); console.log('copied: DocumentDetail.d.ts -> dist/src/DocumentDetail.d.ts') } catch (_e) { /* not present yet */ }

// 4. Copy FileViewer.d.ts from dist/ root into dist/src/
const fileViewerSrc = join(distRoot, 'FileViewer.d.ts')
const fileViewerDst = join(distSrc, 'FileViewer.d.ts')
try { copyFileSync(fileViewerSrc, fileViewerDst); console.log('copied: FileViewer.d.ts -> dist/src/FileViewer.d.ts') } catch (_e) { /* not present yet */ }

console.log('done')
