// task-3823-waffle-account-subrows.test.jsx — TASK-3823
// Covers: AccountSwitcher renders one sub-row per Waffle account (from
// GET /api/auth/waffle-accounts) below the existing identity block, matching
// approved mock screen 2 (sm-jockey/_briefs/mocks/sm-control-5/waffle-panel-module/).
//
// T1 note: the mock asset itself is unreachable from this execution checkout
// (sandboxed to the sm-ui repository only), so these assertions use the
// stored item Context's verbatim fallback description: a "Waffle" section
// header (sectionHeader()'s existing LABEL(count) shape, not literal
// "Waffle — N accounts" text — no section in this file renders that literal
// form) with rows like "Homey / Owner" and "Sprint Mode > Switchpoint /
// Member". This is a recorded limitation per the plan's Stop conditions /
// Risks, not an invented visual detail.

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

function renderSwitcherWith({ product, waffleAccounts } = {}) {
  var defaultWaffleAccounts = waffleAccounts !== undefined ? waffleAccounts : [
    { workspace_id: 'ws_homey', name: 'Homey', role: 'owner', is_current: true },
    { workspace_id: 'ws_switchpoint', name: 'Sprint Mode > Switchpoint', role: 'member', is_current: false },
    { workspace_id: 'ws_thirdco', name: 'Thirdco', role: 'manager', is_current: false },
  ]
  return (async function() {
    var { AccountSwitcher } = await import('../AccountSwitcher.tsx')
    vi.spyOn(window, 'fetch').mockImplementation(function(url) {
      var u = url.toString()
      if (u.includes('/auth/me')) {
        return Promise.resolve({ ok: true, json: function() { return Promise.resolve({
          ok: true, user_id: 'usr_t3823', email: 't3823@sprintmode.ai', name: 'T3823 User',
          role: 'owner', portal_role: 'owner', permissions: {},
          my_roles: [
            { role: 'owner', display_name: 'Owner', role_type: 'customer', is_default: true, is_active: true },
          ],
        }) } })
      }
      if (u.includes('/api/auth/waffle-accounts')) {
        return Promise.resolve({ ok: true, json: function() { return Promise.resolve({
          ok: true, data: { accounts: defaultWaffleAccounts },
        }) } })
      }
      if (u.includes('/api/auth/linked-accounts')) {
        return Promise.resolve({ ok: true, json: function() { return Promise.resolve({
          ok: true,
          data: {
            accounts: [
              {
                user_id: 'usr_t3823', display_name: 'T3823 User', email: 't3823@sprintmode.ai',
                photo_url: null, is_current: true,
                portals: [
                  { subdomain: product || 'waffle', name: 'Waffle', brand_color: null, brand_tint: null, logo_mark_url: null, custom_domain: null, portal_url: null, role: 'owner', is_default: true },
                ],
              },
            ],
          },
        }) } })
      }
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ ok: false }) } })
    })
    var session = { ok: true, user_id: 'usr_t3823', email: 't3823@sprintmode.ai', name: 'T3823 User', role: 'owner', portal_role: 'owner', permissions: {} }
    return render(React.createElement(AccountSwitcher, { product: product || 'waffle', session: session }))
  })()
}

describe('TASK-3823 — Waffle account sub-rows (AccountSwitcher)', function() {
  it('(1) renders one row per Waffle account with name and humanized role, once expanded', async function() {
    await renderSwitcherWith()
    await waitFor(function() {
      expect(screen.getByText(/^Waffle/)).toBeInTheDocument()
    })
    // Collapsed by default — expand the Waffle section
    fireEvent.click(screen.getByText(/^Waffle/).closest('button'))
    await waitFor(function() {
      expect(screen.getByText('Homey')).toBeInTheDocument()
    })
    expect(screen.getByText('Sprint Mode > Switchpoint')).toBeInTheDocument()
    expect(screen.getByText('Thirdco')).toBeInTheDocument()
    // Humanized roles: owner -> Owner, member -> Member, manager -> Manager
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByText('Manager')).toBeInTheDocument()
  })

  it('(2) each row is a plain <a> linking to https://waffle.sprintmode.ai?account=<workspace_id>, not a switch-account button', async function() {
    await renderSwitcherWith()
    await waitFor(function() {
      expect(screen.getByText(/^Waffle/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/^Waffle/).closest('button'))
    await waitFor(function() {
      expect(screen.getByText('Homey')).toBeInTheDocument()
    })
    var homeyLink = screen.getByText('Homey').closest('a')
    expect(homeyLink).toBeTruthy()
    expect(homeyLink.tagName).toBe('A')
    expect(homeyLink.getAttribute('href')).toBe('https://waffle.sprintmode.ai?account=ws_homey')

    var switchpointLink = screen.getByText('Sprint Mode > Switchpoint').closest('a')
    expect(switchpointLink.getAttribute('href')).toBe('https://waffle.sprintmode.ai?account=ws_switchpoint')

    // Clicking must not POST /api/auth/switch-account (unlike accessSection/linked-account rows)
    fireEvent.click(homeyLink)
    await new Promise(function(res) { setTimeout(res, 20) })
    var switchAccountCall = window.fetch.mock.calls.find(function(c) { return c[0].toString().includes('switch-account') })
    expect(switchAccountCall).toBeFalsy()
  })

  it('(3) Waffle section does not render when /api/auth/waffle-accounts returns an empty list', async function() {
    await renderSwitcherWith({ waffleAccounts: [] })
    await waitFor(function() {
      expect(screen.getByText(/Portal access|Linked accounts/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/^Waffle/)).toBeNull()
  })

  it('(4) Waffle section collapses by default and expands on header click', async function() {
    await renderSwitcherWith()
    await waitFor(function() {
      expect(screen.getByText(/^Waffle/)).toBeInTheDocument()
    })
    // Collapsed: rows not visible yet
    expect(screen.queryByText('Homey')).toBeNull()
    fireEvent.click(screen.getByText(/^Waffle/).closest('button'))
    await waitFor(function() {
      expect(screen.getByText('Homey')).toBeInTheDocument()
    })
  })

  it('(5) every returned account renders regardless of is_current (Interpretation 3)', async function() {
    await renderSwitcherWith()
    await waitFor(function() {
      expect(screen.getByText(/^Waffle/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/^Waffle/).closest('button'))
    // ws_homey has is_current: true and must still render, same as the others
    await waitFor(function() {
      expect(screen.getByText('Homey')).toBeInTheDocument()
      expect(screen.getByText('Sprint Mode > Switchpoint')).toBeInTheDocument()
      expect(screen.getByText('Thirdco')).toBeInTheDocument()
    })
  })
})
