// src/user-menu-standalone.ts
// Standalone entry point for the SMUserMenu widget.
// Truly self-contained: bundles React, ReactDOM, and the UserMenu component.
//
// Usage:
//   <script src="user-menu.js"></script>
//   <script>SMUserMenu.mount(element, session, logoutHref)</script>
//
// Mount signature matches the original committed blob exactly.

import { createElement, useState, useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'

// ── Token CSS ──────────────────────────────────────────────────────────────
// Injected once so the bundle works on pages without portal CSS.
const TOKEN_CSS = `
:root {
  --bg: hsl(0, 0%, 100%);
  --bg-subtle: hsl(220, 14%, 97%);
  --bg-card: hsl(0, 0%, 100%);
  --foreground: hsl(0, 0%, 9%);
  --muted: hsl(220, 9%, 40%);
  --border: hsl(214, 32%, 91%);
  --accent: hsl(221, 83%, 53%);
  --accent-10: hsla(221, 83%, 53%, 0.1);
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --font: 'Geist', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}
`

var injected = false
function injectDeps() {
  if (injected) return
  injected = true
  var style = document.createElement('style')
  style.setAttribute('data-sm-user-menu-tokens', '')
  style.textContent = TOKEN_CSS
  document.head.appendChild(style)
  if (!document.querySelector('link[href*="Geist"]')) {
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap'
    document.head.appendChild(link)
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────
var SettingsIcon = createElement('svg', {
  width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
  style: { flexShrink: 0, color: 'var(--muted)' }
},
  createElement('circle', { cx: 12, cy: 12, r: 3 }),
  createElement('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })
)

// ── UserMenu component ─────────────────────────────────────────────────────
interface Session {
  name?: string
  email?: string
  role?: string
  portal_role?: string
  company_name?: string
  photo?: string
  photo_url?: string
  [key: string]: unknown
}

function UserMenu(props: { session: Session; logoutHref: string }) {
  var session = props.session
  var logoutHref = props.logoutHref
  var _open = useState(false); var isOpen = _open[0]; var setOpen = _open[1]
  var ref = useRef<HTMLDivElement>(null)

  useEffect(function() {
    var handler = function(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])

  var initials = (session.name || session.email || '?')
    .split(' ').map(function(w) { return w[0] || '' }).join('').slice(0, 2).toUpperCase()
  var firstName = session.name ? session.name.split(' ')[0]
    : session.email ? session.email.split('@')[0] : ''
  var roleLine = session.role ? session.role.replace(/_/g, ' ')
    : session.portal_role ? session.portal_role.replace(/_/g, ' ') : ''
  var photoUrl = session.photo || session.photo_url

  var avatar = photoUrl
    ? createElement('img', {
        src: photoUrl, alt: '',
        style: { width: 26, height: 26, borderRadius: 6, objectFit: 'cover' as const, display: 'block', flexShrink: 0 }
      })
    : createElement('div', {
        style: { width: 26, height: 26, borderRadius: 6, background: 'var(--accent-10)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }
      }, initials)

  return createElement('div', { ref: ref, style: { position: 'relative' as const } },
    createElement('button', {
      onClick: function() { setOpen(function(v) { return !v }) },
      className: 'shell-header-avatar',
      style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px',
        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)',
        cursor: 'pointer', transition: 'border-color .2s', flexShrink: 0 }
    },
      avatar,
      createElement('span', {
        style: { fontSize: 13, color: 'var(--foreground)', fontWeight: 500, maxWidth: 100,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }
      }, firstName)
    ),
    isOpen ? createElement('div', {
      style: { position: 'absolute' as const, right: 0, top: 42, width: 220,
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, zIndex: 9200 }
    },
      createElement('div', {
        style: { padding: '8px 10px', fontSize: 12, color: 'var(--muted)',
          borderBottom: '1px solid var(--border)', marginBottom: 4 }
      },
        createElement('div', { style: { fontWeight: 600, color: 'var(--foreground)', fontSize: 13 } }, session.name),
        session.email ? createElement('div', null, session.email) : null,
        roleLine ? createElement('div', { style: { marginTop: 2 } }, roleLine)
          : session.company_name ? createElement('div', { style: { marginTop: 2 } }, session.company_name) : null
      ),
      createElement('a', {
        href: '/user/notifications',
        style: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
          borderRadius: 6, fontSize: 13, color: 'var(--foreground)', textDecoration: 'none' }
      }, SettingsIcon, 'Notification Settings'),
      createElement('a', {
        href: logoutHref,
        style: { display: 'block', padding: '8px 10px', borderRadius: 6, fontSize: 13,
          color: 'var(--foreground)', textDecoration: 'none' }
      }, 'Sign out')
    ) : null
  )
}

// ── Mount function ─────────────────────────────────────────────────────────
// Signature: mount(element, session, logoutHref)
// Matches the original committed blob exactly.
function mount(element: HTMLElement, session: Session, logoutHref: string) {
  injectDeps()
  ;(window as unknown as Record<string, unknown>).__SM_SESSION = session
  var root: Root = createRoot(element)
  root.render(createElement(UserMenu, { session: session, logoutHref: logoutHref }))
  return { unmount: function() { root.unmount() } }
}

// Expose on window for script-tag usage
declare global {
  interface Window {
    SMUserMenu: { mount: typeof mount }
  }
}

window.SMUserMenu = { mount }
