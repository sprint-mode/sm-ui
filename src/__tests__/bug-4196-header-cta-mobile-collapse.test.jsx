// bug-4196-header-cta-mobile-collapse.test.jsx -- BUG-4196
//
// At 390 wide the shell header row (hamburger, mark, title, headerCta,
// search trigger, theme control, avatar) overflowed the viewport and
// clipped the right-hand controls. FEAT-3588 already collapses the search
// trigger to icon-only and moves the theme toggle out of the header row
// below the 900px breakpoint, with both duplicated into the sidebar's
// mobile-controls slot (reachable via the hamburger). headerCta had no
// class to hang that same collapse off and stayed full-size in the row,
// which is what ran off the right edge.
//
// This asserts (a) the header row's headerCta carries a targetable class
// and the sidebar drawer still carries its own copy of the same control,
// so the control is reachable once the row copy collapses, and (b) the
// stylesheet actually hides that class inside the existing mobile
// breakpoint -- and only there, so the desktop row is untouched.

import React from 'react'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../Layout.tsx'

var __dirname = path.dirname(fileURLToPath(import.meta.url))
var shellCss = readFileSync(path.resolve(__dirname, '../shell.css'), 'utf8')

function makeSession() {
  return {
    ok: true,
    user_id: 'usr_raise',
    email: 'aaron@sprintmode.ai',
    name: 'Aaron Hall',
    role: 'admin',
    portal_role: 'admin',
    portals: { raise: { access: true } },
    permissions: {},
  }
}

function renderLayout() {
  return render(
    React.createElement(MemoryRouter, { initialEntries: ['/'] },
      React.createElement(Layout, {
        session: makeSession(),
        portalSubdomain: 'raise',
        title: 'Raise',
        navSections: [{ key: 'main', label: 'Main', items: [{ to: '/', label: 'Dashboard', exact: true }] }],
        headerCta: { label: 'Site', onClick: function() {} },
      })
    )
  )
}

function installLocalStorage() {
  var store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: function(k) { return store.has(k) ? store.get(k) : null },
    setItem: function(k, v) { store.set(k, String(v)) },
    removeItem: function(k) { store.delete(k) },
    clear: function() { store.clear() },
  })
}

beforeEach(function() {
  installLocalStorage()
  vi.stubGlobal('fetch', vi.fn(function() {
    return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ ok: false }) } })
  }))
})

afterEach(function() {
  document.documentElement.removeAttribute('data-theme')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BUG-4196 header row collapses headerCta below the mobile breakpoint', function() {
  it('renders the headerCta in the header row with a class the stylesheet can target', function() {
    renderLayout()
    var rowCta = document.querySelector('.shell-header-inner .shell-header-cta')
    expect(rowCta).not.toBeNull()
    expect(rowCta.textContent).toBe('Site')
  })

  it('still renders headerCta inside the sidebar drawer (the overflow slot) so it stays reachable', function() {
    renderLayout()
    var drawerCta = document.querySelector('.portal-sidebar-mobile-site-cta')
    expect(drawerCta).not.toBeNull()
    expect(drawerCta.textContent).toBe('Site')
  })

  it('hides .shell-header-cta only inside the existing @900px mobile breakpoint', function() {
    var mobileBlockMatch = shellCss.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n\}/)
    expect(mobileBlockMatch).not.toBeNull()
    var mobileBlock = mobileBlockMatch[1]

    // Same collapse slot as the search label/kbd hint.
    expect(mobileBlock).toMatch(/\.shell-header-cta\s*\{\s*display:\s*none;?\s*\}/)

    // The desktop rule (outside any @media block) must not itself hide it --
    // strip every @media block and confirm no unconditional rule remains.
    var withoutMediaBlocks = shellCss.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '')
    expect(withoutMediaBlocks).not.toMatch(/\.shell-header-cta\s*\{[^}]*display:\s*none/)
  })

  it('hides the header row theme toggle with !important, scoped so the sidebar-drawer copy is untouched', function() {
    // The theme-toggle button carries an inline style={{ display: 'flex', ... }}
    // (Layout.tsx) that only a !important stylesheet rule can beat. The same
    // class is reused, inline style and all, on the sidebar drawer's own copy
    // (portal-sidebar-mobile-controls .shell-header-theme-toggle), which must
    // stay visible -- so the hiding rule has to be scoped to the header-row
    // instance, not the bare class, or it silently swallows the drawer copy too.
    expect(shellCss).toMatch(/\.shell-header-right \.shell-header-theme-toggle\s*\{\s*display:\s*none\s*!important;?\s*\}/)
    expect(shellCss).toMatch(/\.portal-sidebar-mobile-controls \.shell-header-theme-toggle\s*\{[^}]*display:\s*flex/)
    expect(shellCss).not.toMatch(/(?<!\.shell-header-right )\.shell-header-theme-toggle\s*\{\s*display:\s*none\s*!important/)
  })

  it('hides the avatar name/role block with !important (it also carries an inline display:flex)', function() {
    expect(shellCss).toMatch(/\.shell-header-user-name-block\s*\{\s*display:\s*none\s*!important;?\s*\}/)
  })
})
