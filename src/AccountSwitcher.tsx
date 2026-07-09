// AccountSwitcher.tsx — ACCOUNT-SWITCHER-1
// Renders linked accounts list + "Add Account" in the user menu dropdown.
// Pass as userMenuExtra to Layout.
//
// Usage in portal:
//   import { AccountSwitcher } from '@nomadahq/sm-ui'
//   <Layout userMenuExtra={<AccountSwitcher />} ... />

import React, { useState, useEffect, useCallback } from 'react'

export interface AccountSwitcherProps {
  /** API base URL (empty string for same-origin) */
  apiBase?: string
  /** SSO provider to use for "Add Account" (google or microsoft) */
  ssoProvider?: 'google' | 'microsoft'
}

interface LinkedAccount {
  user_id: string
  display_name: string
  email: string
  photo_url: string | null
  is_current: boolean
}

function PlusIcon() {
  return React.createElement('svg', {
    width: 14, height: 14, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0, color: 'var(--muted)' },
    'aria-hidden': 'true',
  },
    React.createElement('line', { x1: 12, y1: 5, x2: 12, y2: 19 }),
    React.createElement('line', { x1: 5, y1: 12, x2: 19, y2: 12 })
  )
}

export function AccountSwitcher(props: AccountSwitcherProps) {
  var apiBase = props.apiBase || ''
  var ssoProvider = props.ssoProvider || 'google'

  var _accounts = useState<LinkedAccount[]>([]); var accounts = _accounts[0]; var setAccounts = _accounts[1]
  var _loaded = useState(false); var loaded = _loaded[0]; var setLoaded = _loaded[1]
  var _switching = useState<string | null>(null); var switching = _switching[0]; var setSwitching = _switching[1]

  var fetchAccounts = useCallback(function() {
    fetch(apiBase + '/api/auth/linked-accounts', { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(data: { ok: boolean; data?: { accounts: LinkedAccount[] } }) {
        if (data.ok && data.data) {
          setAccounts(data.data.accounts)
        }
        setLoaded(true)
      })
      .catch(function() { setLoaded(true) })
  }, [apiBase])

  useEffect(function() {
    fetchAccounts()
  }, [fetchAccounts])

  var handleSwitch = useCallback(function(userId: string) {
    setSwitching(userId)
    fetch(apiBase + '/api/auth/switch-account', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then(function(r) { return r.json() })
      .then(function(data: { ok: boolean }) {
        if (data.ok) {
          window.location.reload()
        } else {
          setSwitching(null)
        }
      })
      .catch(function() { setSwitching(null) })
  }, [apiBase])

  // Build the "Add Account" SSO link
  var currentUrl = typeof window !== 'undefined' ? window.location.href : '/'
  var currentUser = accounts.find(function(a) { return a.is_current })
  var currentUserId = currentUser ? currentUser.user_id : ''
  var addAccountHref = apiBase + '/auth/sso/' + ssoProvider + '?link_to=' + encodeURIComponent(currentUserId) + '&redirect=' + encodeURIComponent(currentUrl)

  // Don't render anything until loaded
  if (!loaded) return null

  var otherAccounts = accounts.filter(function(a) { return !a.is_current })

  // If no linked accounts and no current user (shouldn't happen), skip
  if (accounts.length === 0) return null

  return React.createElement(React.Fragment, null,
    // Divider
    React.createElement('div', {
      style: { height: 1, background: 'var(--border)', margin: '4px 0' }
    }),

    // Section label
    otherAccounts.length > 0
      ? React.createElement('div', {
          style: { padding: '6px 10px 2px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }
        }, 'Switch Account')
      : null,

    // Other accounts
    otherAccounts.map(function(account) {
      var initials = (account.display_name || account.email || '?')
        .split(' ')
        .map(function(w) { return w[0] || '' })
        .join('')
        .slice(0, 2)
        .toUpperCase()

      var isLoading = switching === account.user_id

      return React.createElement('button', {
        key: account.user_id,
        onClick: function() { if (!switching) handleSwitch(account.user_id) },
        disabled: !!switching,
        style: {
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', borderRadius: 6,
          border: 'none', background: 'transparent',
          cursor: switching ? 'wait' : 'pointer',
          width: '100%', textAlign: 'left',
          fontSize: 13, color: 'var(--foreground)',
          opacity: isLoading ? 0.6 : 1,
          transition: 'background .15s',
        },
        onMouseEnter: function(e: React.MouseEvent<HTMLButtonElement>) { if (!switching) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)' },
        onMouseLeave: function(e: React.MouseEvent<HTMLButtonElement>) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' },
      },
        // Avatar
        account.photo_url
          ? React.createElement('img', {
              src: account.photo_url, alt: '',
              style: { width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }
            })
          : React.createElement('div', {
              style: {
                width: 22, height: 22, borderRadius: 5,
                background: 'var(--accent-10)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, flexShrink: 0,
              }
            }, initials),
        // Name + email
        React.createElement('div', { style: { flex: 1, minWidth: 0, overflow: 'hidden' } },
          React.createElement('div', {
            style: { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
          }, account.display_name || account.email),
          React.createElement('div', {
            style: { fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
          }, account.email)
        ),
        // Loading indicator
        isLoading
          ? React.createElement('div', {
              style: { width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'sm-spin .6s linear infinite', flexShrink: 0 }
            })
          : null
      )
    }),

    // Add Account link
    React.createElement('a', {
      href: addAccountHref,
      style: {
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 10px', borderRadius: 6,
        fontSize: 13, color: 'var(--foreground)',
        textDecoration: 'none',
        transition: 'background .15s',
      },
      onMouseEnter: function(e: React.MouseEvent<HTMLAnchorElement>) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-subtle)' },
      onMouseLeave: function(e: React.MouseEvent<HTMLAnchorElement>) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' },
    },
      React.createElement(PlusIcon, null),
      'Add Account'
    ),

    // Spinner keyframe (injected once)
    React.createElement('style', null, '@keyframes sm-spin { to { transform: rotate(360deg) } }')
  )
}
