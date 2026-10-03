// @vitest-environment node
// TASK-4748 follow-up (BUG-4934): sm-ui 1.3.22 shipped src/index.css importing './theme-core.css'
// without the file itself (package.json "files" did not list it), so every consumer build failed
// with "[postcss] ENOENT ./theme-core.css". Every relative @import in a shipped CSS file must ship too.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const entries = pkg.files.map((f) => normalize(f))
const shipped = (rel) => entries.some((n) => rel === n || rel.startsWith(n + '/'))

// every CSS file the package ships: listed .css files, plus *.css under listed directories
function cssUnder(rel) {
  const abs = join(root, rel)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return rel.endsWith('.css') ? [rel] : []
  return readdirSync(abs).flatMap((name) => cssUnder(join(rel, name)))
}
const cssFiles = [...new Set(entries.flatMap(cssUnder))]

describe('package.json files ships every CSS file a shipped CSS file imports', () => {
  it('ships src/index.css', () => {
    expect(cssFiles).toContain('src/index.css')
  })
  for (const f of cssFiles) {
    it(`${f}: every relative @import is shipped`, () => {
      const text = readFileSync(join(root, f), 'utf8')
      const imports = [...text.matchAll(/@import\s+(?:url\()?['"](\.{1,2}\/[^'"]+)['"]/g)].map((m) => normalize(join(dirname(f), m[1])))
      for (const rel of imports) {
        expect(existsSync(join(root, rel)), `${rel} exists`).toBe(true)
        expect(shipped(rel), `${rel} is in package.json files`).toBe(true)
      }
    })
  }
})
