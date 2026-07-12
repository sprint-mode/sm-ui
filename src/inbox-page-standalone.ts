// src/inbox-page-standalone.ts
// Standalone entry point for the Inbox page on sprintmode.ai.
// Self-contained: bundles React, ReactDOM, PortalUpdatesV2 and its dependencies.
//
// Usage:
//   <div id="sm-inbox-root"></div>
//   <script src="inbox-page.js"></script>
//
// Auto-mounts into #sm-inbox-root on load. Requires user to be logged in
// (session cookie sent to api.sprintmode.ai).

import { createElement, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { PortalUpdatesV2 } from './PortalUpdatesV2.tsx'

var SM_API = 'https://api.sprintmode.ai'

// ── Token CSS ──────────────────────────────────────────────────────────────
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
  --blue: hsl(221, 83%, 53%);
  --green: hsl(142, 71%, 45%);
  --green-light: hsl(142, 71%, 95%);
  --red: hsl(0, 84%, 60%);
  --red-light: hsl(0, 84%, 96%);
  --amber: hsl(38, 92%, 50%);
  --amber-light: hsl(38, 92%, 95%);
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
  if (!document.querySelector('style[data-sm-inbox-tokens]')) {
    var style = document.createElement('style')
    style.setAttribute('data-sm-inbox-tokens', '')
    style.textContent = TOKEN_CSS
    document.head.appendChild(style)
  }
  if (!document.querySelector('link[href*="Geist"]')) {
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap'
    document.head.appendChild(link)
  }
}

// ── API function ───────────────────────────────────────────────────────────
// Points at api.sprintmode.ai with credentials: 'include' for session cookie.
function api(path: string, opts?: Record<string, unknown>): Promise<Record<string, unknown>> {
  var fetchOpts: RequestInit = { credentials: 'include' }
  if (opts) {
    if (opts.method) fetchOpts.method = opts.method as string
    if (opts.headers) fetchOpts.headers = opts.headers as HeadersInit
    if (opts.body) fetchOpts.body = opts.body as BodyInit
  }
  return fetch(SM_API + path, fetchOpts).then(function(r) { return r.json() })
}

// ── Login prompt ───────────────────────────────────────────────────────────
function LoginPrompt() {
  return createElement('div', {
    style: { padding: '60px 20px', textAlign: 'center' as const, maxWidth: 400, margin: '0 auto' }
  },
    createElement('h2', {
      style: { fontSize: 18, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }
    }, 'Sign in to view your inbox'),
    createElement('p', {
      style: { fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }
    }, 'Your inbox shows updates, notifications, and messages across all Sprint Mode products.'),
    createElement('a', {
      href: SM_API + '/auth/sso/google',
      style: { display: 'inline-block', padding: '10px 20px', background: 'var(--accent)',
        color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }
    }, 'Sign in')
  )
}

// ── Wrapper component ──────────────────────────────────────────────────────
function InboxPage() {
  var _state = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  var state = _state[0]; var setState = _state[1]

  useEffect(function() {
    fetch(SM_API + '/auth/me', { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d) {
        if (d.ok && d.user) {
          setState('authenticated')
        } else {
          setState('unauthenticated')
        }
      })
      .catch(function() { setState('unauthenticated') })
  }, [])

  if (state === 'loading') {
    return createElement('div', { style: { display: 'flex', justifyContent: 'center', padding: '60px 0' } },
      createElement('div', {
        style: { width: 24, height: 24, border: '2px solid var(--border, #e5e7eb)',
          borderTopColor: 'var(--accent, #2362ea)', borderRadius: '50%',
          animation: 'sm-inbox-spin 0.7s linear infinite' }
      }),
      createElement('style', null, '@keyframes sm-inbox-spin { to { transform: rotate(360deg) } }')
    )
  }

  if (state === 'unauthenticated') {
    return createElement(LoginPrompt, null)
  }

  return createElement('div', { style: { maxWidth: 800, margin: '0 auto', padding: '32px 20px' } },
    createElement(PortalUpdatesV2, {
      api: api,
      subdomain: 'website',
      title: 'Inbox',
      shortcutKey: 'i',
      onNavigate: function(path: string) {
        // Navigate within sprintmode.ai or open external links
        if (path.startsWith('http')) {
          window.open(path, '_blank')
        } else {
          window.location.href = path
        }
      }
    })
  )
}

// ── Auto-mount ─────────────────────────────────────────────────────────────
function init() {
  injectDeps()
  setTimeout(function() {
    var root = document.getElementById('sm-inbox-root')
    if (!root) return
    try {
      createRoot(root).render(createElement(InboxPage, null))
    } catch (_e) {
      // Fallback: if createRoot still fails, the element may have been
      // used by another React instance — clear it and retry once
      root.innerHTML = ''
      try { createRoot(root).render(createElement(InboxPage, null)) } catch (_) {}
    }
  }, 0)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Also expose for manual mount
declare global {
  interface Window {
    SMInboxPage: { init: typeof init }
  }
}

window.SMInboxPage = { init }
