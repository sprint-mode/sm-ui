// bug-3928-navitem-query-active.test.jsx -- BUG-3928
//
// Sidebar nav items whose `to` carries a query string (for example
// `/table?lens=stacks`) must be active only when both the pathname and the
// search match. Plain-pathname items keep their existing NavLink semantics.

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import Layout from '../Layout.tsx'

function makeSession() {
  return {
    ok: true,
    user_id: 'usr_aaron',
    email: 'aaron@sprintmode.ai',
    name: 'Aaron Hall',
    role: 'super_admin',
    portal_role: 'super_admin',
    portals: { admin: { access: true } },
    permissions: { dashboard: { view: true } },
  }
}

var NAV_SECTIONS = [
  {
    key: 'lenses',
    label: 'Lenses',
    items: [
      { to: '/table?lens=boxes', label: 'Boxes' },
      { to: '/table?lens=stacks', label: 'Stacks' },
      { to: '/table?lens=waffles', label: 'Waffles' },
    ],
  },
  {
    key: 'plain',
    label: 'Plain',
    items: [
      { to: '/client', label: 'Dashboard', exact: true },
      { to: '/reports', label: 'Reports' },
    ],
  },
]

var navigateRef = { current: null }

function NavigateProbe() {
  navigateRef.current = useNavigate()
  return React.createElement('div', null, 'PAGE')
}

function renderAt(path) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(Layout, {
        session: makeSession(), portalSubdomain: 'admin-bug3928', title: 'Admin',
        navSections: NAV_SECTIONS,
      },
        React.createElement(NavigateProbe)
      )
    )
  )
}

function activeLabels(root) {
  return Array.prototype.map.call(
    root.querySelectorAll('.ps-item.active'),
    function(el) { return el.textContent.trim() }
  )
}

function section(label) {
  return document.querySelector('.ps-section[data-label="' + label + '"]')
}

// Some Node runtimes leave jsdom's localStorage undefined (see
// siteheader.test.jsx); install a minimal in-memory stub for every test.
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
  navigateRef.current = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BUG-3928 query-aware active state (AC1)', function() {
  ['light', 'dark'].forEach(function(theme) {
    it('marks only the /table?lens=stacks item active in the ' + theme + ' theme', function() {
      localStorage.setItem('sm-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
      renderAt('/table?lens=stacks')
      expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
      expect(activeLabels(section('Lenses'))).toEqual(['Stacks'])
      expect(activeLabels(section('Plain'))).toEqual([])
    })
  })

  it('marks no lens item active at an unlisted lens value', function() {
    renderAt('/table?lens=other')
    expect(activeLabels(section('Lenses'))).toEqual([])
  })

  it('marks only the stacks item active inside the rail flyout', function() {
    localStorage.setItem('sm-sidebar-rail', '1')
    renderAt('/table?lens=stacks')
    fireEvent.mouseEnter(section('Lenses').querySelector('.ps-section-header'))
    var flyout = document.querySelector('.rail-flyout')
    expect(flyout).not.toBeNull()
    expect(flyout.querySelectorAll('.ps-item').length).toBe(3)
    expect(activeLabels(flyout)).toEqual(['Stacks'])
  })
})

describe('BUG-3928 hasActive opens the section on the matching item (AC2)', function() {
  it('expands a collapsed lens section after navigating to /table?lens=stacks', function() {
    localStorage.setItem('sm-nav-collapsed', JSON.stringify({ lenses: true }))
    renderAt('/client')
    expect(section('Lenses').classList.contains('collapsed')).toBe(true)
    act(function() { navigateRef.current('/table?lens=stacks') })
    expect(section('Lenses').classList.contains('collapsed')).toBe(false)
    expect(activeLabels(section('Lenses'))).toEqual(['Stacks'])
  })

  it('keeps a collapsed lens section collapsed after navigating to an unlisted lens', function() {
    localStorage.setItem('sm-nav-collapsed', JSON.stringify({ lenses: true }))
    renderAt('/client')
    act(function() { navigateRef.current('/table?lens=other') })
    expect(section('Lenses').classList.contains('collapsed')).toBe(true)
  })
})

describe('BUG-3928 plain-pathname items are unchanged (AC3)', function() {
  it('keeps the exact /client item active at /client', function() {
    renderAt('/client')
    expect(activeLabels(section('Plain'))).toEqual(['Dashboard'])
  })

  it('ignores the query string for the exact /client item at /client?foo=1', function() {
    renderAt('/client?foo=1')
    expect(activeLabels(section('Plain'))).toEqual(['Dashboard'])
  })

  it('keeps the exact /client item inactive at /client/x', function() {
    renderAt('/client/x')
    expect(activeLabels(section('Plain'))).toEqual([])
  })

  it('keeps the non-exact /reports item active on its sub-path /reports/2026', function() {
    renderAt('/reports/2026')
    expect(activeLabels(section('Plain'))).toEqual(['Reports'])
  })
})
