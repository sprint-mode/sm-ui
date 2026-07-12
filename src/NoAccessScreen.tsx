// NoAccessScreen.tsx — ACCOUNT-SWITCHER-3
// Full-page replacement for the emoji lock access-denied screens.
// Two variants:
//   A) No linked account has access → show portal list + switch accounts
//   B) A linked account HAS access → primary CTA to switch
//
// Data sources:
//   - portalSubdomain + portalName from Layout props
//   - current user email from session or /auth/me
//   - linked accounts + per-account portals from /api/auth/linked-accounts

import React, { useState, useEffect } from 'react'

interface PortalInfo {
  subdomain: string
  role: string
  name: string
  brand_color: string | null
  brand_tint: string | null
  icon_key: string | null
  logo_mark_url: string | null
  custom_domain: string | null
  portal_type: string
}

interface LinkedAccount {
  user_id: string
  display_name: string
  email: string
  photo_url: string | null
  is_current: boolean
  portals: PortalInfo[]
}

export interface NoAccessScreenProps {
  portalSubdomain: string
  portalName?: string
  portalBrandColor?: string
  portalIconKey?: string
  /** Current user email — passed from session when available */
  email?: string
}

// Icon SVG paths keyed by icon_key (same set as user-menu.js)
var ICON_PATHS: Record<string, string> = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  code: '<path d="M7 8l-4 4l4 4"/><path d="M17 8l4 4l-4 4"/><path d="M14 4l-4 16"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  shield: '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',
  lock: '<path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  terminal: '<path d="M5 7l5 5l-5 5"/><path d="M12 19l7 0"/>',
  'file-text': '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/>',
  'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
}

function PortalIcon(props: { iconKey?: string | null; brandColor?: string | null; logoMarkUrl?: string | null; name: string; size?: number }) {
  var size = props.size || 22
  var innerSize = Math.round(size * 0.6)
  var radius = Math.round(size * 0.23)
  var color = props.brandColor || '#2362ea'
  var tint = color + '1a' // ~10% opacity hex

  if (props.logoMarkUrl) {
    return React.createElement('img', {
      src: props.logoMarkUrl,
      alt: props.name,
      width: size,
      height: size,
      style: { borderRadius: radius, objectFit: 'contain', display: 'block', flexShrink: 0 }
    })
  }

  var pathHtml = ICON_PATHS[props.iconKey || ''] || ICON_PATHS.grid
  return React.createElement('div', {
    style: { width: size, height: size, borderRadius: radius, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  },
    React.createElement('svg', {
      width: innerSize, height: innerSize, viewBox: '0 0 24 24',
      fill: 'none', stroke: color, strokeWidth: 2,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      dangerouslySetInnerHTML: { __html: pathHtml },
      'aria-hidden': 'true',
    })
  )
}

function portalUrl(p: PortalInfo): string {
  if (p.custom_domain) return 'https://' + p.custom_domain
  return 'https://' + p.subdomain + '.sprintmode.ai'
}

export function NoAccessScreen(props: NoAccessScreenProps) {
  var _accounts = useState<LinkedAccount[]>([]); var accounts = _accounts[0]; var setAccounts = _accounts[1]
  var _loaded = useState(false); var loaded = _loaded[0]; var setLoaded = _loaded[1]
  var _switching = useState(false); var switching = _switching[0]; var setSwitching = _switching[1]
  var _email = useState(props.email || ''); var email = _email[0]; var setEmail = _email[1]

  useEffect(function() {
    fetch('/api/auth/linked-accounts', { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(data: { ok: boolean; data?: { accounts: LinkedAccount[] } }) {
        if (data.ok && data.data) {
          setAccounts(data.data.accounts)
          if (!email) {
            var cur = data.data.accounts.find(function(a) { return a.is_current })
            if (cur) setEmail(cur.email)
          }
        }
      })
      .catch(function() {})
      .finally(function() { setLoaded(true) })
  }, [])

  var sub = props.portalSubdomain
  var portalName = props.portalName || sub

  // Find the current account
  var currentAccount = accounts.find(function(a) { return a.is_current })
  var currentPortals = currentAccount ? currentAccount.portals : []

  // Find a linked account that has access to this portal
  var switchTarget: LinkedAccount | null = null
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].is_current) continue
    for (var j = 0; j < accounts[i].portals.length; j++) {
      if (accounts[i].portals[j].subdomain === sub) {
        switchTarget = accounts[i]
        break
      }
    }
    if (switchTarget) break
  }

  // Other accounts (for Variant A switch section)
  var otherAccounts = accounts.filter(function(a) { return !a.is_current })

  function handleSwitch(userId: string) {
    setSwitching(true)
    fetch('/api/auth/switch-account', {
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
          setSwitching(false)
        }
      })
      .catch(function() { setSwitching(false) })
  }

  // Brand color from props or default
  var brandColor = props.portalBrandColor || '#2362ea'

  // Header logo — use R2 endpoint
  var logoUrl = 'https://api.sprintmode.ai/portals/' + sub + '/logo_mark.png'

  // ── Render ──

  // Frame container
  return React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font, system-ui, sans-serif)', padding: '24px' }
  },
    React.createElement('div', {
      style: { background: 'var(--bg-card, var(--bg-subtle, #f7f7f8))', borderRadius: 12, padding: 24, maxWidth: 540, width: '100%' }
    },
      // Header — portal logo + name
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '0.5px solid var(--border, #e5e7eb)' }
      },
        React.createElement('div', {
          style: { width: 28, height: 28, borderRadius: 6, background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }
        },
          React.createElement('img', {
            src: logoUrl, alt: portalName, width: 28, height: 28,
            style: { borderRadius: 6, objectFit: 'cover' },
            onError: function(e: React.SyntheticEvent<HTMLImageElement>) {
              // Fallback: hide broken image
              (e.target as HTMLImageElement).style.display = 'none'
            }
          })
        ),
        React.createElement('span', {
          style: { fontSize: 14, fontWeight: 500, color: 'var(--foreground, #171717)' }
        }, portalName)
      ),

      // Message — lock icon + text
      React.createElement('div', {
        style: { textAlign: 'center', padding: '20px 0 ' + (switchTarget ? '24px' : '28px') }
      },
        React.createElement('div', {
          style: { fontSize: 20, color: 'var(--muted, #6b7280)', marginBottom: 8 }
        },
          React.createElement('i', { className: 'ti ti-lock', 'aria-hidden': 'true' })
        ),
        React.createElement('h3', {
          style: { fontSize: 16, fontWeight: 500, margin: '0 0 6px', color: 'var(--foreground, #171717)' }
        }, "You don't have access to " + portalName),
        React.createElement('p', {
          style: { fontSize: 13, color: 'var(--muted, #6b7280)', margin: 0, lineHeight: 1.5 }
        }, email ? 'Signed in as ' + email : '')
      ),

      // ── Variant B: Switch CTA ──
      switchTarget ? React.createElement('div', {
        onClick: function() { if (!switching) handleSwitch(switchTarget!.user_id) },
        style: {
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 8,
          border: '1.5px solid var(--accent, #2362ea)',
          background: 'var(--accent-10, rgba(35,98,234,0.1))',
          cursor: switching ? 'wait' : 'pointer',
          marginBottom: 20,
          opacity: switching ? 0.7 : 1,
          transition: 'opacity .15s',
        }
      },
        // Avatar
        React.createElement('div', {
          style: {
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(35,98,234,0.15)', color: '#2362ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, flexShrink: 0,
          }
        }, (switchTarget.display_name || switchTarget.email || '?')[0].toUpperCase()),
        // Info
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', {
            style: { fontSize: 13, fontWeight: 500, color: 'var(--accent, #2362ea)' }
          }, 'Switch to ' + switchTarget.email),
          React.createElement('div', {
            style: { fontSize: 11, color: 'var(--muted, #6b7280)' }
          }, 'This account has access to ' + portalName)
        ),
        // Arrow
        React.createElement('i', {
          className: 'ti ti-arrow-right',
          style: { fontSize: 14, color: 'var(--accent, #2362ea)', flexShrink: 0 },
          'aria-hidden': 'true',
        })
      ) : null,

      // ── Divider before portals (Variant B) or after switch accounts section (Variant A) ──
      switchTarget ? React.createElement('div', {
        style: { height: 0.5, background: 'var(--border, #e5e7eb)', margin: '16px 0' }
      }) : null,

      // ── Your Portals ──
      currentPortals.length > 0 ? React.createElement(React.Fragment, null,
        React.createElement('div', {
          style: { fontSize: 11, fontWeight: 500, color: 'var(--muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px' }
        }, 'Your portals'),
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }
        },
          currentPortals.map(function(p) {
            return React.createElement('a', {
              key: p.subdomain,
              href: portalUrl(p),
              style: {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6,
                cursor: 'pointer', textDecoration: 'none',
                color: 'var(--foreground, #171717)',
                fontSize: 13, fontWeight: 500,
                transition: 'background .15s',
              },
              onMouseEnter: function(e: React.MouseEvent<HTMLAnchorElement>) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-subtle, #f3f4f6)' },
              onMouseLeave: function(e: React.MouseEvent<HTMLAnchorElement>) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' },
            },
              React.createElement(PortalIcon, {
                iconKey: p.icon_key, brandColor: p.brand_color,
                logoMarkUrl: p.logo_mark_url, name: p.name
              }),
              p.name,
              React.createElement('i', {
                className: 'ti ti-arrow-right',
                style: { marginLeft: 'auto', fontSize: 14, color: 'var(--muted, #6b7280)' },
                'aria-hidden': 'true',
              })
            )
          })
        )
      ) : null,

      // ── Switch Account section (Variant A — no switch target) ──
      !switchTarget && otherAccounts.length > 0 ? React.createElement(React.Fragment, null,
        React.createElement('div', {
          style: { height: 0.5, background: 'var(--border, #e5e7eb)', margin: '16px 0' }
        }),
        React.createElement('div', {
          style: { fontSize: 11, fontWeight: 500, color: 'var(--muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px' }
        }, 'Switch account'),
        otherAccounts.map(function(acct) {
          var initials = (acct.display_name || acct.email || '?')
            .split(' ')
            .map(function(w) { return w[0] || '' })
            .join('')
            .slice(0, 2)
            .toUpperCase()

          // Use a brand color from their first portal if available
          var acctColor = acct.portals.length > 0 && acct.portals[0].brand_color
            ? acct.portals[0].brand_color : '#6b7280'
          var acctTint = acctColor + '26' // ~15% opacity

          return React.createElement('div', {
            key: acct.user_id,
            onClick: function() { if (!switching) handleSwitch(acct.user_id) },
            style: {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6,
              cursor: switching ? 'wait' : 'pointer',
              transition: 'background .15s',
            },
            onMouseEnter: function(e: React.MouseEvent<HTMLDivElement>) { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle, #f3f4f6)' },
            onMouseLeave: function(e: React.MouseEvent<HTMLDivElement>) { (e.currentTarget as HTMLDivElement).style.background = 'transparent' },
          },
            React.createElement('div', {
              style: {
                width: 24, height: 24, borderRadius: 6,
                background: acctTint, color: acctColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 500, flexShrink: 0,
              }
            }, initials),
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('div', {
                style: { fontSize: 13, fontWeight: 500, color: 'var(--foreground, #171717)' }
              }, acct.display_name || acct.email),
              React.createElement('div', {
                style: { fontSize: 11, color: 'var(--muted, #6b7280)' }
              }, acct.email)
            )
          )
        })
      ) : null,

      // ── Sign out ──
      React.createElement('div', {
        style: { height: 0.5, background: 'var(--border, #e5e7eb)', margin: '16px 0' }
      }),
      React.createElement('a', {
        href: '/api/auth/logout',
        style: {
          display: 'block', padding: '8px 10px', borderRadius: 6,
          fontSize: 13, color: 'var(--muted, #6b7280)',
          textDecoration: 'none', transition: 'background .15s',
        },
        onMouseEnter: function(e: React.MouseEvent<HTMLAnchorElement>) {
          var el = e.currentTarget as HTMLAnchorElement
          el.style.background = 'var(--bg-subtle, #f3f4f6)'
          el.style.color = 'var(--foreground, #171717)'
        },
        onMouseLeave: function(e: React.MouseEvent<HTMLAnchorElement>) {
          var el = e.currentTarget as HTMLAnchorElement
          el.style.background = 'transparent'
          el.style.color = 'var(--muted, #6b7280)'
        },
      },
        React.createElement('i', {
          className: 'ti ti-logout',
          style: { fontSize: 14, verticalAlign: -1, marginRight: 6 },
          'aria-hidden': 'true',
        }),
        'Sign out'
      ),

      // Loading state — show a minimal screen while fetching
      !loaded ? React.createElement('div', {
        style: { textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--muted, #6b7280)' }
      }) : null
    )
  )
}
