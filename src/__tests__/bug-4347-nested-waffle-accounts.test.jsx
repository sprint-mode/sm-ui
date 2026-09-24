// bug-4347-nested-waffle-accounts.test.jsx — BUG-4347
// The approved user menu (sm-jockey/_briefs/mocks/sm-control-5/waffle-panel-module,
// screen 2): each linked identity's Waffle accounts are nested under that
// identity in its drill-in ("Waffle / N accounts" row, then one sub-row per
// account with its role); clicking a sub-row opens Waffle as that identity on
// that account through the switch-account redirect door. The unapproved
// TASK-3823 top-level "Waffle (N)" section fed by /api/auth/waffle-accounts is
// gone: the menu never fetches that route.

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

var GMAIL_WAFFLE = [
  { workspace_id: 'co_homey', name: 'Homey', role: 'owner', is_current: false },
  { workspace_id: 'co_switchpoint', name: 'Switchpoint', role: 'member', is_current: false },
  { workspace_id: 'co_weekwell', name: 'Weekwell', role: 'owner', is_current: false },
]

function portal(subdomain, name, role) {
  return { subdomain: subdomain, name: name, brand_color: null, brand_tint: null, logo_mark_url: null, custom_domain: null, portal_url: null, role: role, is_default: true }
}

async function renderSwitcher({ ownWaffle, linkedWaffle, ownPortals } = {}) {
  var { AccountSwitcher } = await import('../AccountSwitcher.tsx')
  vi.spyOn(window, 'fetch').mockImplementation(function(url) {
    var u = url.toString()
    if (u.includes('/auth/me')) {
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({
        ok: true, user_id: 'usr_ai', email: 'aaron@sprintmode.ai', name: 'Aaron',
        role: 'super_admin', portal_role: 'super_admin', permissions: {},
        my_roles: [{ role: 'super_admin', display_name: 'Super Admin', role_type: null, is_default: true, is_active: true }],
      }) } })
    }
    if (u.includes('/api/auth/linked-accounts')) {
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({
        ok: true,
        data: {
          accounts: [
            { user_id: 'usr_ai', display_name: 'Aaron', email: 'aaron@sprintmode.ai', photo_url: null, is_current: true,
              portals: ownPortals !== undefined ? ownPortals : [portal('waffle', 'Waffle', 'super_admin'), portal('admin', 'Admin', 'super_admin')],
              waffle_accounts: ownWaffle !== undefined ? ownWaffle : [{ workspace_id: 'co_sm', name: 'Sprint Mode LLC', role: 'owner', is_current: true }] },
            { user_id: 'usr_gmail', display_name: 'Aaron Hall', email: 'aaronmhall@gmail.com', photo_url: null, is_current: false,
              portals: [portal('switchpoint', 'Switchpoint', 'owner')],
              waffle_accounts: linkedWaffle !== undefined ? linkedWaffle : GMAIL_WAFFLE },
          ],
        },
      }) } })
    }
    return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ ok: false }) } })
  })
  var session = { ok: true, user_id: 'usr_ai', email: 'aaron@sprintmode.ai', name: 'Aaron', role: 'super_admin', portal_role: 'super_admin', permissions: {} }
  return render(React.createElement(AccountSwitcher, { product: 'waffle', session: session }))
}

async function openGmailDrillIn() {
  await waitFor(function() { expect(screen.getByText(/Linked accounts/i)).toBeInTheDocument() })
  fireEvent.click(screen.getByText(/Linked accounts/i).closest('button'))
  await waitFor(function() { expect(screen.getByText('aaronmhall@gmail.com')).toBeInTheDocument() })
  fireEvent.click(screen.getByText('aaronmhall@gmail.com').closest('button'))
  await waitFor(function() { expect(screen.getByText('Homey')).toBeInTheDocument() })
}

beforeEach(function() {
  // AccountSwitcher keeps a module-level linked-accounts cache keyed by
  // apiBase|product; isolate every case from the previous one.
  vi.resetModules()
  delete window.location
  window.location = { href: 'https://waffle.sprintmode.ai/', hostname: 'waffle.sprintmode.ai' }
})

describe('BUG-4347 — Waffle accounts nested under each identity', function() {
  it('(1) never fetches /api/auth/waffle-accounts and shows no top-level "Waffle (N)" section', async function() {
    await renderSwitcher()
    await waitFor(function() { expect(screen.getByText(/Linked accounts/i)).toBeInTheDocument() })
    var waffleAccountsCall = window.fetch.mock.calls.find(function(c) { return c[0].toString().includes('/api/auth/waffle-accounts') })
    expect(waffleAccountsCall).toBeFalsy()
    expect(screen.queryByText(/^Waffle\s*\(/)).toBeNull()
    expect(screen.queryByText('Sprint Mode LLC')).toBeNull()
  })

  it('(2) the linked identity drill-in lists its Waffle accounts nested below its portals, with roles', async function() {
    await renderSwitcher()
    await openGmailDrillIn()
    var row = screen.getByTestId('waffle-accounts-row-usr_gmail')
    expect(row).toHaveTextContent('Waffle')
    expect(row).toHaveTextContent('3 accounts')
    expect(screen.getByText('Homey')).toBeInTheDocument()
    expect(screen.getByText('Weekwell')).toBeInTheDocument()
    // Switchpoint appears as a portal row and as a Waffle account row
    expect(screen.getAllByText('Switchpoint').length).toBe(2)
    expect(screen.getAllByText('Owner').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('(3) clicking a nested account navigates to the switch-account redirect door for that identity and workspace', async function() {
    await renderSwitcher()
    await openGmailDrillIn()
    fireEvent.click(screen.getByText('Weekwell').closest('button'))
    expect(window.location.href).toBe(
      'https://api.sprintmode.ai/api/auth/switch-account-redirect?user_id=usr_gmail&workspace=co_weekwell&return_to=' +
      encodeURIComponent('https://waffle.sprintmode.ai/')
    )
    var switchPost = window.fetch.mock.calls.find(function(c) { return c[0].toString().includes('switch-account') })
    expect(switchPost).toBeFalsy()
  })

  it('(4) a linked identity with no Waffle accounts shows no Waffle rows in its drill-in', async function() {
    await renderSwitcher({ linkedWaffle: [] })
    await waitFor(function() { expect(screen.getByText(/Linked accounts/i)).toBeInTheDocument() })
    fireEvent.click(screen.getByText(/Linked accounts/i).closest('button'))
    await waitFor(function() { expect(screen.getByText('aaronmhall@gmail.com')).toBeInTheDocument() })
    fireEvent.click(screen.getByText('aaronmhall@gmail.com').closest('button'))
    await waitFor(function() { expect(screen.getByText('Switchpoint')).toBeInTheDocument() })
    expect(screen.queryByTestId('waffle-accounts-row-usr_gmail')).toBeNull()
  })

  // Aaron's ruling (BUG-4347, 2026-09-24): the signed-in identity's own
  // accounts nest beneath the product INSIDE Portal access, never as a
  // separate block between Portal access and Linked accounts.
  it('(5) the signed-in identity with several Waffle accounts gets the nested rows inside Portal access, its current account marked', async function() {
    await renderSwitcher({ ownWaffle: [
      { workspace_id: 'co_homey', name: 'Homey', role: 'owner', is_current: true },
      { workspace_id: 'co_weekwell', name: 'Weekwell', role: 'owner', is_current: false },
      { workspace_id: 'co_switchpoint', name: 'Switchpoint', role: 'member', is_current: false },
    ] })
    await waitFor(function() { expect(screen.getByText(/Portal access/i)).toBeInTheDocument() })
    // Collapsed: nothing nested is visible yet, and no separate Waffle block exists.
    expect(screen.queryByTestId('waffle-accounts-row-usr_ai')).toBeNull()
    // The header counts Admin plus the nested Waffle row.
    expect(screen.getByText(/Portal access/i).closest('button')).toHaveTextContent('(2)')
    fireEvent.click(screen.getByText(/Portal access/i).closest('button'))
    await waitFor(function() { expect(screen.getByTestId('waffle-accounts-row-usr_ai')).toBeInTheDocument() })
    expect(screen.getByTestId('waffle-accounts-row-usr_ai')).toHaveTextContent('3 accounts')
    expect(screen.getByText('Admin')).toBeInTheDocument()
    var homey = screen.getByText('Homey').closest('button')
    expect(homey.getAttribute('aria-current')).toBe('true')
    expect(screen.getByText('Weekwell').closest('button').getAttribute('aria-current')).toBeNull()
    fireEvent.click(screen.getByText('Weekwell').closest('button'))
    expect(window.location.href).toContain('user_id=usr_ai&workspace=co_weekwell')
  })

  it('(6) the signed-in identity with a single Waffle account shows no Waffle rows of its own', async function() {
    await renderSwitcher()
    await waitFor(function() { expect(screen.getByText(/Portal access/i)).toBeInTheDocument() })
    expect(screen.getByText(/Portal access/i).closest('button')).toHaveTextContent('(1)')
    fireEvent.click(screen.getByText(/Portal access/i).closest('button'))
    await waitFor(function() { expect(screen.getByText('Admin')).toBeInTheDocument() })
    expect(screen.queryByTestId('waffle-accounts-row-usr_ai')).toBeNull()
  })

  it('(7) Portal access renders for the nested Waffle accounts alone when the identity reaches no other portal', async function() {
    await renderSwitcher({
      ownPortals: [portal('waffle', 'Waffle', 'owner')],
      ownWaffle: [
        { workspace_id: 'co_homey', name: 'Homey', role: 'owner', is_current: true },
        { workspace_id: 'co_weekwell', name: 'Weekwell', role: 'owner', is_current: false },
      ],
    })
    await waitFor(function() { expect(screen.getByText(/Portal access/i)).toBeInTheDocument() })
    expect(screen.getByText(/Portal access/i).closest('button')).toHaveTextContent('(1)')
    fireEvent.click(screen.getByText(/Portal access/i).closest('button'))
    await waitFor(function() { expect(screen.getByTestId('waffle-accounts-row-usr_ai')).toBeInTheDocument() })
    expect(screen.getByTestId('waffle-accounts-row-usr_ai')).toHaveTextContent('2 accounts')
    expect(screen.getByText('Homey')).toBeInTheDocument()
    expect(screen.getByText('Weekwell')).toBeInTheDocument()
  })
})
