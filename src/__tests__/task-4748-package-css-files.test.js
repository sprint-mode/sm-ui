// TASK-4748 follow-up: sm-ui 1.3.22 shipped src/index.css importing './theme-core.css' without the
// file itself (package.json "files" did not list it), so every consumer build failed with
// "[postcss] ENOENT ./theme-core.css". Every relative @import in a shipped CSS file must ship too.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, normalize } from 'node:path'

const root = join(__dirname, '..', '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const shipped = (rel) => pkg.files.some((f) => { const n = normalize(f); return rel === n || rel.startsWith(n + '/') })

describe('package.json files ships every CSS file a shipped CSS file imports', () => {
  const cssFiles = pkg.files.filter((f) => f.endsWith('.css'))
  it('lists at least src/index.css', () => {
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
