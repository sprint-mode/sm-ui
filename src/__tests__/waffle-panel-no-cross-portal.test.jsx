// BUG-2220 + FEAT-3814/TASK-3952 (Reading A, Aaron 2026-09-20).
//
// BUG-2220 killed the ALWAYS-ON cross-portal panel: a hardcoded
// waffle.sprintmode.ai/panel drawer, a fixed Cmd+. binding, and
// WafflePanelButton/WaffleDrawer/openWafflePanel baked into the sm-ui shell.
// That is still forbidden and the four source guards below LOCK it.
//
// Reading A supersedes the lock IN PART: a panel may appear, but only through a
// generic, module-gated slot — the shell names no product, imports no module,
// hardcodes no key, and renders nothing unless the module is live-installed for
// the portal (portal config installed_modules). The behavioral tests assert
// exactly that: absent when the module is not installed, present when it is.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { PanelSlotMount } from '../Layout.tsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const layoutSrc = () => fs.readFileSync(path.resolve(__dirname, '../Layout.tsx'), 'utf8')

describe('cross-portal panel stays un-hardcoded (BUG-2220 guards)', () => {
  it('Layout source has NO waffle.sprintmode.ai/panel reference', () => {
    expect(layoutSrc()).not.toContain('waffle.sprintmode.ai/panel')
  })
  it('Layout source has NO literal e.key === "." binding', () => {
    expect(layoutSrc()).not.toMatch(/e\.key\s*===\s*['"]\.['"]/)
  })
  it('Layout source has NO WafflePanelButton or WaffleDrawer component', () => {
    const src = layoutSrc()
    expect(src).not.toContain('WafflePanelButton')
    expect(src).not.toContain('WaffleDrawer')
  })
  it('Layout source has NO openWafflePanel function', () => {
    expect(layoutSrc()).not.toContain('openWafflePanel')
  })
  it('Layout source names no product for the panel slot (generic by construction)', () => {
    // The slot must never hardcode a product id/name; it comes from the host.
    const src = layoutSrc()
    // PanelSlotMount block only — the file has unrelated "Waffle" mentions in
    // pre-existing comments (kitchen switcher), which are not the panel.
    const block = src.slice(src.indexOf('function PanelSlotMount'), src.indexOf('const Layout: React.FC'))
    expect(block.toLowerCase()).not.toContain('waffle')
  })
})

// Behavioral: the module-gated slot. usePortalConfig is mocked so the test
// controls the portal's installed_modules.
var mockInstalled = []
vi.mock('../usePortalConfig.jsx', () => ({
  usePortalConfig: () => ({ config: { subdomain: 'p', installed_modules: mockInstalled }, loading: false, error: null }),
}))

describe('module-gated panel slot (Reading A)', () => {
  beforeEach(() => { mockInstalled = [] })
  afterEach(() => { vi.clearAllMocks() })

  async function mountSlot() {
    var out
    await act(async () => {
      out = render(React.createElement(PanelSlotMount, {
        slot: { node: React.createElement('div', { 'data-testid': 'the-drawer' }, 'drawer'), requiresModule: 'demo-panel', hotkey: 'Mod+.' },
      }))
    })
    return out
  }

  it('renders NOTHING when the module is not installed', async () => {
    mockInstalled = ['some-other-module']
    const out = await mountSlot()
    expect(out.queryByTestId('the-drawer')).toBeNull()
  })

  it('renders the drawer when the module IS installed', async () => {
    mockInstalled = ['demo-panel']
    const out = await mountSlot()
    expect(out.queryByTestId('the-drawer')).not.toBeNull()
  })

  it('registers the Mod+. toggle ONLY when installed', async () => {
    mockInstalled = ['demo-panel']
    var fired = 0
    var onToggle = () => { fired += 1 }
    window.addEventListener('sm:panel-slot-toggle', onToggle)
    await mountSlot()
    await act(async () => { fireEvent.keyDown(window, { key: '.', metaKey: true }) })
    expect(fired).toBe(1)
    window.removeEventListener('sm:panel-slot-toggle', onToggle)
  })

  it('does NOT register the keybinding when not installed', async () => {
    mockInstalled = []
    var fired = 0
    var onToggle = () => { fired += 1 }
    window.addEventListener('sm:panel-slot-toggle', onToggle)
    await mountSlot()
    await act(async () => { fireEvent.keyDown(window, { key: '.', metaKey: true }) })
    expect(fired).toBe(0)
    window.removeEventListener('sm:panel-slot-toggle', onToggle)
  })
})
