// TASK-4748: the sm-core inside look (Platform, Studios). It is dormant until a portal turns
// it on, it never lets a portal's brand colour take over actions, and it can be turned on
// from index.html, the Layout prop, or portal config.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applySmLook, currentSmLook, isSmLook } from '../look.ts'
import { PortalConfigProvider } from '../usePortalConfig.tsx'

const css = readFileSync(resolve(process.cwd(), 'src/theme-core.css'), 'utf8')
const entry = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))

function selectors(text) {
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import url\([^)]*\);/g, '')
  const out = []
  const re = /([^{}]+)\{/g
  let m
  while ((m = re.exec(body))) {
    const sel = m[1].trim()
    if (sel.startsWith('@media')) continue
    sel.split(',').forEach((s) => out.push(s.trim()))
  }
  return out
}

describe('theme-core.css', function() {
  it('scopes every rule to html[data-sm-look="sm-core"], so other portals are untouched', function() {
    const sels = selectors(css)
    expect(sels.length).toBeGreaterThan(40)
    for (const s of sels) expect(s.startsWith('html[data-sm-look="sm-core"]')).toBe(true)
  })

  it('ships in the combined CSS entry and as ./css/core', function() {
    expect(entry).toContain("@import './theme-core.css';")
    expect(pkg.exports['./css/core']).toBe('./src/theme-core.css')
  })

  it('defines light and both dark forms of the surface tokens', function() {
    for (const block of [
      /html\[data-sm-look="sm-core"\] \{([^}]*)\}/,
      /html\[data-sm-look="sm-core"\]\[data-theme="dark"\] \{([^}]*)\}/,
      /html\[data-sm-look="sm-core"\]:not\(\[data-theme\]\) \{([^}]*)\}/,
    ]) {
      const body = css.match(block)?.[1] ?? ''
      for (const t of ['--bg:', '--bg-card:', '--foreground:', '--muted:', '--border:', '--rule:', '--accent:', 'color-scheme:']) {
        expect(body).toContain(t)
      }
    }
  })

  it('restates the orange accent on the shell, so brand_color cannot take over actions', function() {
    const body = css.match(/html\[data-sm-look="sm-core"\] \[data-sm-theme\],[^{]*\{([^}]*)\}/)?.[1] ?? ''
    expect(body).toMatch(/--accent:\s*#cc4a1f/)
    expect(body).toMatch(/--accent-foreground:\s*#ffffff/)
  })

  it('is ASCII only', function() {
    expect([...css].every((ch) => ch.charCodeAt(0) < 128)).toBe(true)
  })
})

describe('look switch', function() {
  beforeEach(function() { document.documentElement.removeAttribute('data-sm-look') })
  afterEach(function() {
    document.documentElement.removeAttribute('data-sm-look')
    vi.restoreAllMocks()
  })

  it('applySmLook sets sm-core and ignores anything else', function() {
    expect(isSmLook('sm-core')).toBe(true)
    applySmLook('neon')
    expect(currentSmLook()).toBe(null)
    applySmLook('sm-core')
    expect(document.documentElement.getAttribute('data-sm-look')).toBe('sm-core')
    applySmLook(null)
    expect(currentSmLook()).toBe('sm-core')
  })

  it('portal config look: "sm-core" turns it on and brand_color is kept as --brand', async function() {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: function() {
        return Promise.resolve({ ok: true, config: { subdomain: 'studios', brand_color: '#7947d1', look: 'sm-core' } })
      },
    })
    render(<PortalConfigProvider subdomain="studios"><div>x</div></PortalConfigProvider>)
    await waitFor(function() { expect(currentSmLook()).toBe('sm-core') })
    const injected = document.getElementById('sm-theme-inject')?.textContent ?? ''
    expect(injected).toContain('--brand:#7947d1;')
  })

  it('a config without look leaves the page alone', async function() {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: function() { return Promise.resolve({ ok: true, config: { subdomain: 'raise', brand_color: '#123456' } }) },
    })
    render(<PortalConfigProvider subdomain="raise"><div>x</div></PortalConfigProvider>)
    await waitFor(function() {
      expect(document.getElementById('sm-theme-inject')?.textContent ?? '').toContain('#123456')
    })
    expect(currentSmLook()).toBe(null)
  })
})
