import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { getSession } from './api.js'
import { IconSearch, IconMoon, IconSun } from './Icons.jsx'
import { NotificationBell } from './NotificationBell.jsx'
import { BugPanel, BugPanelHeaderButton } from './BugPanel.jsx'
import { usePortalConfig } from './usePortalConfig.jsx'

// ═══ SESSION CONTEXT ═══

var SessionContext = createContext(null)
export function useSession() { return useContext(SessionContext) }

// ═══ VIEW-AS CONTEXT ═══

export var ViewAsContext = createContext(null)
export function useViewAs() { return useContext(ViewAsContext) }

// ═══ THEME HELPERS ═══

function getStoredTheme() {
  try { return localStorage.getItem('sm-theme') } catch (_e) { return null }
}
function setStoredTheme(t) {
  try { localStorage.setItem('sm-theme', t) } catch (_e) {}
}
export function useTheme() {
  var _d = useState(function() {
    var stored = getStoredTheme()
    if (stored) return stored === 'dark'
    // No stored preference — follow OS
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  var isDark = _d[0]; var setIsDark = _d[1]
  useEffect(function() {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    setStoredTheme(isDark ? 'dark' : 'light')
  }, [isDark])
  return { isDark: isDark, toggle: function() { setIsDark(function(d) { return !d }) } }
}

// ═══ CMD+K OVERLAY (standard shell — products provide items) ═══
// Usage: <CmdK open={bool} onClose={fn} items={[{label,to,icon?,section?,keywords?,subsection?,meta?}]}
//              onNavigate={fn} placeholder="..." onSearch={async fn} recentKey="string" />
// onSearch(query): async callback returning { items: [...] }. Debounced 200ms, min 2 chars.
//   Results merge below static item matches. Static matches appear instantly.
// recentKey: localStorage key for storing recent items. Shows "Recent" section on empty query.
// meta: { badge, badgeColor, detail } — rendered as right-aligned pill + detail text.

// Badge color CSS map (uses existing CSS var names where possible)
var BADGE_COLORS = {
  green: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  red: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  blue: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  amber: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  orange: { bg: 'rgba(249,115,22,0.12)', color: '#ea580c' },
  purple: { bg: 'rgba(168,85,247,0.12)', color: '#9333ea' },
  indigo: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
  gray: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
}

function getRecent(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]').slice(0, 8) } catch(_e) { return [] }
}
function pushRecent(key, item) {
  try {
    var list = getRecent(key).filter(function(r) { return r.to !== item.to })
    list.unshift({ label: item.label, to: item.to, section: item.section || '', subsection: item.subsection || '' })
    localStorage.setItem(key, JSON.stringify(list.slice(0, 8)))
  } catch(_e) {}
}

// Highlight matched substring in label — returns array of React elements
function highlightMatch(label, query) {
  if (!query) return [label]
  var lower = (label || '').toLowerCase()
  var idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return [label]
  return [
    label.slice(0, idx),
    React.createElement('strong', { key: 'hl', style: { fontWeight: 700 } }, label.slice(idx, idx + query.length)),
    label.slice(idx + query.length)
  ]
}

export function CmdK(props) {
  var open = props.open; var onClose = props.onClose; var items = props.items || []
  var onNavigate = props.onNavigate; var placeholder = props.placeholder || 'Jump to...'
  var onSearch = props.onSearch; var recentKey = props.recentKey
  var _q = useState(''); var q = _q[0]; var setQ = _q[1]
  var _hi = useState(0); var hi = _hi[0]; var setHi = _hi[1]
  var _asyncItems = useState([]); var asyncItems = _asyncItems[0]; var setAsyncItems = _asyncItems[1]
  var _asyncTotal = useState(0); var asyncTotal = _asyncTotal[0]; var setAsyncTotal = _asyncTotal[1]
  var _loading = useState(false); var loading = _loading[0]; var setLoading = _loading[1]
  var inputRef = useRef(null)
  var debounceRef = useRef(null)
  var searchIdRef = useRef(0)

  // Filter static items — includes keywords fix
  var filtered = open ? items.filter(function(s) {
    if (s.disabled) return false
    if (!q) return true
    var ql = q.toLowerCase()
    return (s.label || '').toLowerCase().indexOf(ql) !== -1 ||
           (s.section || '').toLowerCase().indexOf(ql) !== -1 ||
           (s.keywords || '').toLowerCase().indexOf(ql) !== -1
  }) : []

  // Debounced async search
  useEffect(function() {
    if (!open || !onSearch) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setAsyncItems([]); setAsyncTotal(0); setLoading(false); return }
    setLoading(true)
    var id = ++searchIdRef.current
    debounceRef.current = setTimeout(function() {
      onSearch(q).then(function(result) {
        if (id !== searchIdRef.current) return // stale
        setAsyncItems((result && result.items) || [])
        setAsyncTotal((result && result.total) || 0)
        setLoading(false)
      }).catch(function() {
        if (id !== searchIdRef.current) return
        setAsyncItems([]); setAsyncTotal(0); setLoading(false)
      })
    }, 200)
    return function() { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, open])

  // Recent items for empty query
  var recentItems = (open && !q && recentKey) ? getRecent(recentKey) : []

  useEffect(function() { if (open && inputRef.current) { inputRef.current.focus(); setQ(''); setHi(0); setAsyncItems([]); setAsyncTotal(0); setLoading(false) } }, [open])
  useEffect(function() { setHi(0) }, [q])

  // Combine all displayable items for keyboard nav
  var allItems = q ? filtered.concat(asyncItems) : (recentItems.length > 0 ? recentItems : filtered)

  useEffect(function() {
    if (!open) return
    var handler = function(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHi(function(h) { return h < allItems.length - 1 ? h + 1 : 0 }) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHi(function(h) { return h > 0 ? h - 1 : allItems.length - 1 }) }
      if (e.key === 'Enter') {
        e.preventDefault()
        var sel = allItems[hi]
        if (sel && sel.to) {
          if (recentKey) pushRecent(recentKey, sel)
          onClose()
          if (onNavigate) onNavigate(sel.to); else window.location.href = sel.to
        }
      }
    }
    window.addEventListener('keydown', handler)
    return function() { window.removeEventListener('keydown', handler) }
  }, [open, allItems.length, hi])

  if (!open) return null

  // Handle item selection (click)
  function selectItem(item) {
    if (recentKey) pushRecent(recentKey, item)
    onClose()
    if (onNavigate) onNavigate(item.to); else if (item.to) window.location.href = item.to
  }

  // Render a single result row — two-column layout with optional meta
  function renderRow(item, idx, isHi) {
    var meta = item.meta || {}
    var bc = BADGE_COLORS[meta.badgeColor] || BADGE_COLORS.gray
    var sectionLabel = item.subsection ? (item.section + ' > ' + item.subsection) : ''

    return React.createElement('a', {
      key: item.to || item.label || idx,
      href: item.to || '#',
      onClick: function(e) { e.preventDefault(); selectItem(item) },
      onMouseEnter: function() { setHi(idx) },
      style: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, textDecoration: 'none', color: 'var(--foreground)', fontSize: 13, background: isHi ? 'var(--bg-subtle)' : 'transparent', minHeight: 36 }
    },
      // Left side: icon + label
      React.createElement('div', { style: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } },
        item.step != null
          ? React.createElement('span', { style: { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-10)', flexShrink: 0 } }, item.step)
          : item.Icon
            ? React.createElement(item.Icon, null)
            : null,
        React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          sectionLabel
            ? React.createElement(React.Fragment, null,
                React.createElement('span', { style: { color: 'var(--muted)', fontSize: 11 } }, sectionLabel + ' > '),
                highlightMatch(item.label, q)
              )
            : highlightMatch(item.label, q)
        )
      ),
      // Right side: badge pill + detail text
      (meta.badge || meta.detail)
        ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11 } },
            meta.badge
              ? React.createElement('span', { style: { padding: '1px 7px', borderRadius: 9, fontSize: 10, fontWeight: 600, background: bc.bg, color: bc.color, whiteSpace: 'nowrap' } }, meta.badge)
              : null,
            meta.detail
              ? React.createElement('span', { style: { color: 'var(--muted)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' } }, meta.detail)
              : null
          )
        : null
    )
  }

  // Group items by section for rendering
  function renderGrouped(itemList, startIdx) {
    var sections = []; var sectionMap = {}
    itemList.forEach(function(item) {
      var sec = item.section || ''
      if (!sectionMap[sec]) { sectionMap[sec] = []; sections.push(sec) }
      sectionMap[sec].push(item)
    })
    var idx = startIdx
    return sections.map(function(sec) {
      return React.createElement(React.Fragment, { key: sec || '_' + idx },
        sec ? React.createElement('div', { style: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', padding: '8px 12px 4px' } }, sec) : null,
        sectionMap[sec].map(function(item) {
          var i = idx++
          return renderRow(item, i, i === hi)
        })
      )
    })
  }

  // Loading skeleton rows
  function renderSkeletons() {
    return [0, 1, 2].map(function(i) {
      return React.createElement('div', { key: 'skel-' + i, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' } },
        React.createElement('div', { style: { width: 180 + (i * 30), height: 12, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'cmdk-pulse 1.2s ease-in-out infinite' } }),
        React.createElement('div', { style: { flex: 1 } }),
        React.createElement('div', { style: { width: 50, height: 12, borderRadius: 4, background: 'var(--bg-subtle)', animation: 'cmdk-pulse 1.2s ease-in-out infinite', animationDelay: '0.2s' } })
      )
    })
  }

  // Determine what to show in results area
  var showRecent = !q && recentItems.length > 0
  var showEmpty = !q && recentItems.length === 0 && filtered.length === 0
  var showNoResults = q && filtered.length === 0 && asyncItems.length === 0 && !loading
  var overflowCount = asyncTotal > asyncItems.length ? asyncTotal - asyncItems.length : 0
  var totalCount = q ? filtered.length + asyncItems.length : (showRecent ? recentItems.length : filtered.length)

  return (
    React.createElement(React.Fragment, null,
      // Pulse animation style
      React.createElement('style', null, '@keyframes cmdk-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }'),
      React.createElement('div', { onClick: onClose, style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000 } }),
      React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100, pointerEvents: 'none' } },
        React.createElement('div', { style: { width: 520, maxWidth: '90vw', pointerEvents: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '60vh', overflow: 'hidden' } },
          // Search input
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 } },
            React.createElement(IconSearch, null),
            React.createElement('input', { ref: inputRef, value: q, onChange: function(e) { setQ(e.target.value) }, placeholder: placeholder, style: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--foreground)', fontFamily: 'var(--font)' } }),
            React.createElement('kbd', { style: { fontSize: 11, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--muted)' } }, 'esc')
          ),
          // Scrollable results
          React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: 6 } },
            // Recent items (empty query)
            showRecent
              ? React.createElement(React.Fragment, null,
                  React.createElement('div', { style: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', padding: '8px 12px 4px' } }, 'Recent'),
                  recentItems.map(function(item, i) { return renderRow(item, i, i === hi) })
                )
              : null,
            // Filtered static items (when query present)
            q && filtered.length > 0
              ? renderGrouped(filtered, 0)
              : null,
            // Async results (below static matches)
            q && asyncItems.length > 0
              ? renderGrouped(asyncItems, filtered.length)
              : null,
            // Loading skeletons
            q && loading ? renderSkeletons() : null,
            // Overflow indicator
            overflowCount > 0
              ? React.createElement('div', { style: { padding: '6px 12px', fontSize: 11, color: 'var(--muted)', textAlign: 'center' } }, overflowCount + ' more results')
              : null,
            // Empty/no-results states
            showEmpty
              ? React.createElement('div', { style: { padding: '16px 12px', fontSize: 13, color: 'var(--muted)', textAlign: 'center' } }, 'Start typing to search')
              : null,
            showNoResults
              ? React.createElement('div', { style: { padding: '16px 12px', fontSize: 13, color: 'var(--muted)', textAlign: 'center' } }, 'Try searching by name, domain, or email')
              : null,
            // All static items when no query and no recent
            !q && !showRecent && filtered.length > 0
              ? renderGrouped(filtered, 0)
              : null
          ),
          // Footer with keyboard hints
          React.createElement('div', { style: { borderTop: '1px solid var(--border)', padding: '6px 16px', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 } },
            React.createElement('span', { style: { fontSize: 9, color: 'var(--muted)' } }, totalCount + ' items'),
            React.createElement('div', { style: { flex: 1 } }),
            React.createElement('span', { style: { fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('kbd', { style: { padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: 3, border: '0.5px solid var(--border)' } }, '\u2191\u2193'),
              'navigate',
              React.createElement('kbd', { style: { padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: 3, border: '0.5px solid var(--border)' } }, '\u21B5'),
              'select',
              React.createElement('kbd', { style: { padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: 3, border: '0.5px solid var(--border)' } }, 'esc'),
              'close'
            )
          )
        )
      )
    )
  )
}

// ═══ HEADER USER MENU ═══

function HeaderUserMenu(props) {
  var session = props.session; var profilePath = props.profilePath; var logoutHref = props.logoutHref
  var userMenuExtra = props.userMenuExtra
  var _open = useState(false); var open = _open[0]; var setOpen = _open[1]
  var ref = useRef(null)

  useEffect(function() {
    var close = function(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return function() { document.removeEventListener('mousedown', close) }
  }, [])

  var initials = session ? (session.name || session.email || '?').split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase() : '?'
  var displayName = session ? (session.name ? session.name.split(' ')[0] : (session.email ? session.email.split('@')[0] : '')) : ''
  var roleLabel = session && session.role ? session.role.replace(/_/g, ' ') : (session && session.portal_role ? session.portal_role.replace(/_/g, ' ') : '')
  var photo = session && session.photo

  // Avatar: photo if available, initials fallback
  var avatarEl = photo
    ? React.createElement('img', { src: photo, alt: '', style: { width: 26, height: 26, borderRadius: 6, objectFit: 'cover', display: 'block', flexShrink: 0 } })
    : React.createElement('div', { style: { width: 26, height: 26, borderRadius: 6, background: 'var(--accent-10)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 } }, initials)

  return React.createElement('div', { ref: ref, style: { position: 'relative' } },
    React.createElement('button', {
      onClick: function() { setOpen(function(o) { return !o }) },
      className: 'shell-header-avatar',
      style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', transition: 'border-color .2s', flexShrink: 0 }
    },
      avatarEl,
      React.createElement('span', { style: { fontSize: 13, color: 'var(--foreground)', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, displayName)
    ),
    open ? React.createElement('div', { style: { position: 'absolute', right: 0, top: 42, width: 220, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, zIndex: 100 } },
      React.createElement('div', { style: { padding: '8px 10px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 } },
        React.createElement('div', { style: { fontWeight: 600, color: 'var(--foreground)', fontSize: 13 } }, session && session.name),
        session && session.email ? React.createElement('div', null, session.email) : null,
        roleLabel ? React.createElement('div', { style: { marginTop: 2 } }, roleLabel) : (session && session.company_name ? React.createElement('div', { style: { marginTop: 2 } }, session.company_name) : null)
      ),
      profilePath ? React.createElement('a', { href: profilePath, style: { display: 'block', padding: '8px 10px', borderRadius: 6, fontSize: 13, color: 'var(--foreground)', textDecoration: 'none' } }, 'Profile') : null,
      userMenuExtra || null,
      React.createElement('a', { href: logoutHref, style: { display: 'block', padding: '8px 10px', borderRadius: 6, fontSize: 13, color: 'var(--foreground)', textDecoration: 'none' } }, 'Sign out')
    ) : null
  )
}

// ═══ PORTAL SWITCHER ═══
// Fetches the current user's active SM portals (/api/my-portals) and renders
// a switcher list. Returns null if the user only has one portal (no point switching).
// Consume: import { PortalSwitcher } from '@nomadahq/sm-ui' then pass as userMenuExtra.

// Inline SVG path strings for each icon_key used in portal_configs.
// Extracted from sm-ui/src/Icons.jsx. All use viewBox="0 0 24 24",
// strokeWidth 2, stroke currentColor, fill none (set on the wrapping svg element).
// Unknown keys fall back to 'grid'.
var ICON_KEY_SVG_PATHS = {
  'grid':        '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'code':        '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 8l-4 4l4 4"/><path d="M17 8l4 4l-4 4"/><path d="M14 4l-4 16"/>',
  'bar-chart':   '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  'file-text':   '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/>',
  'terminal':    '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7l5 5l-5 5"/><path d="M12 19l7 0"/>',
  'book-open':   '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'layers':      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  'shield':      '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"/>',
  'lock':        '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/>',
  'book':        '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6l0 13"/><path d="M12 6l0 13"/><path d="M21 6l0 13"/>',
}

// Module-level cache — fetched once per page load, instant on subsequent menu opens
var _portalCache = null
var _portalFetch = null

export function PortalSwitcher() {
  var _p = useState(_portalCache); var portals = _p[0]; var setPortals = _p[1]

  useEffect(function() {
    // PORTAL-SESSION-1: try to read portals from parent session context first.
    // The session is available via window.__SM_SESSION (set by Layout when session loads).
    // Falls back to /api/my-portals API call for portals not yet returning session.portals.
    var sessionPortals = (typeof window !== 'undefined' && window.__SM_SESSION && window.__SM_SESSION.portals) || null
    if (sessionPortals) {
      var list = Object.entries(sessionPortals)
        .filter(function(entry) { return entry[1].access })
        .map(function(entry) {
          var sub = entry[0]
          var p = entry[1]
          return {
            portal: sub,
            role: 'member',
            name: p.name || sub,
            portal_type: p.portal_type || 'sm',
            brand_color: p.brand_color || null,
            brand_tint: p.brand_tint || null,
            icon_key: p.icon_key || null,
            logo_mark_url: p.logo_mark_url || null,
            custom_domain: p.custom_domain || null,
          }
        })
      _portalCache = list
      setPortals(list)
      return
    }

    // Legacy fallback: fetch from /api/my-portals
    if (_portalCache) { setPortals(_portalCache); return }
    if (!_portalFetch) {
      _portalFetch = fetch('/api/my-portals', { credentials: 'include' })
        .then(function(r) { return r.json() })
        .then(function(data) {
          if (data.ok && data.data && data.data.portals) {
            _portalCache = data.data.portals
            return _portalCache
          }
          return []
        })
        .catch(function() { return [] })
    }
    _portalFetch.then(function(list) { setPortals(list) })
  }, [])

  if (!portals || portals.length <= 1) return null

  var currentHost = typeof window !== 'undefined' ? window.location.hostname : ''

  // Admin always first, then alphabetical by name
  var sorted = portals.slice().sort(function(a, b) {
    if (a.portal === 'admin') return -1
    if (b.portal === 'admin') return 1
    var na = a.name || a.portal
    var nb = b.name || b.portal
    return na.localeCompare(nb)
  })

  return React.createElement('div', { style: { borderTop: '1px solid var(--border)', marginTop: 2, paddingTop: 4 } },
    React.createElement('div', {
      style: { padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.5px' }
    }, 'Portals'),
    sorted.map(function(p) {
      // Domain: use custom_domain from API, else fall back to subdomain.sprintmode.ai
      var domain = p.custom_domain || (p.portal + '.sprintmode.ai')
      var isCurrent = currentHost === domain
      var shortName = p.name || p.portal

      // Icon: uploaded logo_mark_url > icon_key SVG > grid fallback
      var iconEl
      if (p.logo_mark_url) {
        iconEl = React.createElement('img', {
          src: p.logo_mark_url, width: 14, height: 14,
          alt: shortName,
          style: { borderRadius: 2, objectFit: 'contain', display: 'block' }
        })
      } else {
        var paths = ICON_KEY_SVG_PATHS[p.icon_key] || ICON_KEY_SVG_PATHS['grid']
        iconEl = React.createElement('svg', {
          width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
          stroke: p.brand_color || '#2362ea', strokeWidth: '2',
          strokeLinecap: 'round', strokeLinejoin: 'round',
          dangerouslySetInnerHTML: { __html: paths }
        })
      }

      // Tinted badge wrapper
      var badge = React.createElement('div', {
        style: {
          width: 22, height: 22, borderRadius: 5,
          background: 'var(--accent-10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }
      }, iconEl)

      return React.createElement('a', {
        key: p.portal,
        href: 'https://' + domain,
        target: isCurrent ? undefined : '_blank',
        rel: isCurrent ? undefined : 'noopener noreferrer',
        style: {
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 10px', borderRadius: 6, fontSize: 13,
          color: isCurrent ? 'var(--accent)' : 'var(--foreground)',
          textDecoration: 'none',
          background: isCurrent ? 'var(--accent-10, hsla(215,80%,55%,.08))' : 'transparent',
          fontWeight: isCurrent ? 500 : 400,
        }
      },
        badge,
        React.createElement('span', null, shortName),
        !isCurrent ? React.createElement('span', { style: { marginLeft: 'auto', opacity: 0.25, fontSize: 10 } }, '\u2197') : null
      )
    })
  )
}

// ═══ PRODUCT COLOR MAP ═══

var PRODUCT_COLORS = {
  'sprint-mode':    { color: '#2362ea', tint: '#e9effc' },
  'studios':        { color: '#7947d1', tint: '#f1ecfa' },
  'mode':           { color: '#0D9488', tint: '#e6f5f3' },
  'hub':            { color: '#4f5d93', tint: '#eef0f8' },
  'sprint-capital': { color: '#1fac6a', tint: '#e8f6f0' },
  'privacyai':      { color: '#0fb67f', tint: '#e7f7f2' },
  'investor':       { color: '#2362ea', tint: '#e9effc' },
}

// ═══ PERMISSION HELPERS ═══

function parsePerms(session) {
  if (!session || !session.permissions) return null
  try {
    return typeof session.permissions === 'string'
      ? JSON.parse(session.permissions)
      : session.permissions
  } catch (_e) { return null }
}

function canViewSection(perms, role, key) {
  if (!key) return true
  if (role === 'super_admin' || role === 'admin') return true
  if (!perms || !perms.sections || !perms.sections[key]) return false
  return !!perms.sections[key].view
}

function canViewProduct(perms, role, product) {
  if (!product) return true
  if (role === 'super_admin' || role === 'admin') return true
  if (!perms) return false
  // Check products map (legacy) or sections map (unified)
  if (perms.products && perms.products[product]) return true
  if (perms.sections && perms.sections[product]) return !!perms.sections[product].view
  return false
}

// ═══ SIDEBAR SECTION ═══

function SidebarSection({ label, Logo, sectionIcon, sectionColor, items, color, tint, defaultOpen, product, collapsed, onToggle, flat }) {
  var isExternallyManaged = collapsed !== undefined && onToggle !== undefined
  var _useState = useState(defaultOpen !== false)
  var internalOpen = _useState[0]
  var setInternalOpen = _useState[1]
  var location = useLocation()

  var open = isExternallyManaged ? !collapsed : internalOpen

  var hasActive = items.some(function(item) {
    if (item.external) return false
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  })

  var _mounted = useRef(false)
  useEffect(function() {
    if (!_mounted.current) { _mounted.current = true; return }
    if (hasActive && !open) {
      if (isExternallyManaged) onToggle()
      else setInternalOpen(true)
    }
  }, [hasActive])

  function handleToggle() {
    if (isExternallyManaged) onToggle()
    else setInternalOpen(!open)
  }

  var sectionStyle = { '--section-color': color, '--section-tint': tint }

  return (
    <div className={'ps-section' + (flat || open ? '' : ' collapsed')} data-product={product} style={sectionStyle}>
      {!flat && (
        <button className="ps-section-header" onClick={handleToggle}>
          {sectionIcon && (
            <span className="ps-section-icon" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              background: sectionColor ? (sectionColor.includes('hsl') ? sectionColor.replace(')', ', 0.12)').replace('hsl(', 'hsla(') : sectionColor + '1f') : (color ? color + '1f' : 'transparent'),
              color: sectionColor || color,
            }}>{sectionIcon}</span>
          )}
          {!sectionIcon && Logo && <Logo />}
          {label}
          <svg className="ps-section-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      )}
      {(flat || open) && (
        <div className="ps-section-items">
          {items.map(function(item) {
            if (item.external) {
              return (
                <a key={item.to || item.href} href={item.to || item.href} target="_blank" rel="noopener noreferrer" className="ps-item">
                  {item.Icon && <item.Icon />}
                  {' '}{item.label}
                </a>
              )
            }
            if (item.disabled) {
              return (
                <span key={item.to || item.label} className="ps-item disabled">
                  {item.step != null ? <span className="ps-step">{item.step}</span> : item.Icon && <item.Icon />}
                  {' '}{item.label}
                </span>
              )
            }
            var stepEl = null
            if (item.step != null) {
              if (item.completed) {
                stepEl = React.createElement('span', { className: 'ps-step done' },
                  React.createElement('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' },
                    React.createElement('polyline', { points: '20 6 9 17 4 12' })
                  )
                )
              } else {
                stepEl = React.createElement('span', { className: 'ps-step' }, item.step)
              }
            } else if (item.Icon) {
              stepEl = React.createElement(item.Icon)
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={function(p) {
                  var cls = 'ps-item'
                  if (p.isActive) cls += ' active'
                  if (item.locked) cls += ' locked'
                  if (item.completed) cls += ' completed'
                  return cls
                }}
              >
                {stepEl}
                {' '}{item.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ DEFAULT NAV CONFIG ═══

var DEFAULT_NAV = {
  'sprint-mode': {
    label: 'Sprint Mode',
    items: [
      { to: '/client', label: 'Dashboard', icon: 'grid', exact: true },
      { to: '/client/team', label: 'Team', icon: 'users' },
    ]
  },
  'studios': {
    label: 'Studios',
    items: [
      { to: '/client/studios', label: 'Dashboard', icon: 'code', exact: true },
      { to: '/client/studios/billing', label: 'Billing', icon: 'bill' },
    ]
  },
  'mode': {
    label: 'Mode',
    items: [
      { to: '/client/mode/discovery', label: 'Discovery', step: 1 },
      { to: '/client/mode/scan', label: 'Scan', step: 2 },
      { to: '/client/mode/results', label: 'Results', step: 3 },
      { to: '/client/mode/build', label: 'Build', step: 4 },
      { to: '/client/mode/run', label: 'Run Dashboard', step: 5 },
      { to: '/client/mode/reports', label: 'Reports', step: 6 },
      { to: '/client/mode/expand', label: 'Expand', step: 7 },
      { to: '/client/mode/billing', label: 'Billing', icon: 'bill' },
    ]
  },
  'investor': {
    label: 'Investor',
    items: [
      { to: '/investor', label: 'Overview', icon: 'trend', exact: true },
      { to: '/investor/portfolio', label: 'Portfolio', icon: 'portfolio' },
      { to: '/investor/documents', label: 'Documents', icon: 'file' },
      { to: '/investor/updates', label: 'Updates', icon: 'msg' },
    ]
  },
}

// Icon resolver
function resolveIcon(name) {
  var sp = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', width: 16, height: 16 }
  var map = {
    grid: function() { return <svg {...sp}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    users: function() { return <svg {...sp}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    bill: function() { return <svg {...sp}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    code: function() { return <svg {...sp}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
    trend: function() { return <svg {...sp}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
    portfolio: function() { return <svg {...sp}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    file: function() { return <svg {...sp}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    msg: function() { return <svg {...sp}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    gear: function() { return <svg {...sp}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    dollar: function() { return <svg {...sp}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    search: function() { return <svg {...sp}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    play: function() { return <svg {...sp}><polygon points="5 3 19 12 5 21 5 3"/></svg> },
    wrench: function() { return <svg {...sp}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
    layers: function() { return <svg {...sp}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
    external: function() { return <svg {...sp}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> },
    terminal: function() { return <svg {...sp}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> },
    user: function() { return <svg {...sp}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    shield: function() { return <svg {...sp}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  }
  return map[name] || null
}

// Product logo components for sidebar
var _PRODUCT_LOGOS = {
  'sprint-mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/></g></svg> },
  'studios': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#f1ecfa"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#7947d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></g></svg> },
  'mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e6f5f3"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></g></svg> },
  'hub': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#eef0f8"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#4f5d93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg> },
  'investor': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g></svg> },
  'sprint-capital': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e8f6f0"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#1fac6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g></svg> },
  'privacyai': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e7f7f2"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#0fb67f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></g></svg> },
}

// ═══ MAIN LAYOUT ═══
//
// Supports two patterns:
//
// 1. PORTAL pattern (backward-compatible):
//    <Layout navConfig={...} logoSrc="..." />
//    Nav built from session.products + navConfig. Content via <Outlet />.
//
// 2. ADMIN pattern (new):
//    <Layout session={user} navSections={[...]} navBottom={[...]} title="Admin" headerRight={...} viewAsEnabled>
//      {children}
//    </Layout>
//    Nav from explicit sections array with role-based filtering. Content via children.
//    Optional header bar, view-as impersonation, collapsible sections.

export default function Layout(props) {
  var navConfig = props.navConfig
  var navSections = props.navSections
  var navBottom = props.navBottom
  var sessionProp = props.session
  var children = props.children
  var logoSrc = props.logoSrc
  var logoAlt = props.logoAlt
  var title = props.title
  var headerRight = props.headerRight
  var sidebarBottom = props.sidebarBottom
  var viewAsEnabled = props.viewAsEnabled
  var viewAsApi = props.viewAsApi || '/api/db/admin-users'
  var viewAsDetailApi = props.viewAsDetailApi
  var headerIcon = props.headerIcon
  var onLogout = props.onLogout
  var profilePath = props.profilePath
  var cmdKEnabled = props.cmdK !== false // enabled by default when title is set
  var cmdKPlaceholder = (props.cmdK && props.cmdK.placeholder) || 'Jump to...'
  var cmdKItems = props.cmdKItems // optional custom items; auto-built from nav if omitted
  var cmdKOnSearch = props.onSearch // async callback for server-side search
  var cmdKRecentKey = props.recentKey // localStorage key for recent items
  var showCompanyName = props.showCompanyName // when true, appends " // {session.company_name}" to title
  var byLine = props.byLine // e.g. "by Sprint Mode" -- shown after product name in muted secondary style
  var userMenuExtra = props.userMenuExtra // optional React element rendered in user menu between Profile and Sign out
  var notificationApiBase = props.notificationApiBase !== undefined ? props.notificationApiBase : '' // base URL for NotificationBell polls; defaults to '' (relative, proxy-routed)
  var headerCta = props.headerCta // { label, onClick, variant? } — CTA button rendered in header before user menu
  var viewAsAnyRole = props.viewAsAnyRole // when true, any logged-in user gets View As (non-admin portals only)
  // Bug panel: read from prop (if explicitly passed) or portal config context (automatic for all portals)
  var portalCfg = usePortalConfig()
  var bugPanelFlag = props.bugPanel !== undefined ? props.bugPanel : (portalCfg.config && portalCfg.config.bug_panel)
  var bugPanelEnabled = !!bugPanelFlag && bugPanelFlag !== 0
  var bugPanelProduct = props.portalSubdomain || 'sm' // product for bug reports
  var bugPanelLabel = props.bugPanelLabel // FAB label override

  // Session state — use prop or auto-fetch
  var _s = useState(sessionProp || null); var session = _s[0]; var setSession = _s[1]
  var _l = useState(!sessionProp); var loading = _l[0]; var setLoading = _l[1]

  // bugPanelAdmin must be computed AFTER session is initialized (var hoisting makes it undefined above)
  var bugPanelAdmin = props.bugPanelAdmin || (session && (session.portal_role === 'super_admin' || session.portal_role === 'admin' || session.role === 'super_admin' || session.role === 'admin' || session.is_sm_team))
  var _m = useState(false); var mobileOpen = _m[0]; var setMobileOpen = _m[1]
  var _d = useState(false); var dropdownOpen = _d[0]; var setDropdownOpen = _d[1]
  var _cmdkOpen = useState(false); var cmdkOpen = _cmdkOpen[0]; var setCmdkOpen = _cmdkOpen[1]
  var _bugPanelOpen = useState(false); var bugPanelOpen = _bugPanelOpen[0]; var setBugPanelOpen = _bugPanelOpen[1]
  var theme = useTheme()
  var navigate = useNavigate()
  var location = useLocation()

  // Cmd+K and Cmd+B global keyboard listeners
  useEffect(function() {
    var handler = function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdkOpen(true) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); if (bugPanelEnabled) setBugPanelOpen(function(v) { return !v }) }
    }
    window.addEventListener('keydown', handler)
    return function() { window.removeEventListener('keydown', handler) }
  }, [bugPanelEnabled])

  // Sync session prop changes
  useEffect(function() {
    if (sessionProp) { setSession(sessionProp); setLoading(false) }
  }, [sessionProp])

  // PORTAL-SESSION-1: expose session globally for PortalSwitcher to read portals
  useEffect(function() {
    if (session && typeof window !== 'undefined') {
      window.__SM_SESSION = session
    }
  }, [session])

  // Auto-fetch session only if no prop provided
  useEffect(function() {
    if (sessionProp) return
    getSession().then(function(s) {
      if (!s) {
        navigate('/auth/login?redirect=' + encodeURIComponent(location.pathname))
        return
      }
      setSession(s)
      setLoading(false)
    })
  }, [])

  // ── View-As / Impersonation ──
  // PORTAL-SESSION-1: prefer session.portals[portalSubdomain].view_as when available.
  // Falls back to legacy is_sm_team/viewAsAnyRole for portals not yet bumped.
  var portalSubdomain = props.portalSubdomain // portal_configs subdomain — e.g. 'studios', 'admin'
  var canViewAsFromSession = portalSubdomain && session && session.portals && session.portals[portalSubdomain]
    ? session.portals[portalSubdomain].view_as
    : null
  // Legacy path: is_sm_team + viewAsAnyRole
  var isSuperAdmin = session && (session.role === 'super_admin' || session.portal_role === 'super_admin' || session.role === 'admin' || session.portal_role === 'admin' || session.is_sm_team)
  var showViewAs = canViewAsFromSession !== null
    ? (viewAsEnabled !== false && canViewAsFromSession) // new path: portals object decides
    : (viewAsEnabled && (viewAsAnyRole ? !!session : isSuperAdmin)) // legacy path
  var _va = useState(null); var viewAs = _va[0]; var setViewAs = _va[1]
  var _au = useState([]); var allUsers = _au[0]; var setAllUsers = _au[1]

  // Auto-seed viewAs from session.viewing_as (set when admin opens portal via View Portal button)
  useEffect(function() {
    if (!session || !session.viewing_as || viewAs) return
    var va = session.viewing_as
    // viewing_as has: contact_id, email, name, company_id, company_name, portal_role, products
    setViewAs({
      email: va.email || '',
      name: va.name || va.company_name || '',
      company_id: va.company_id,
      company_name: va.company_name || '',
      portal_role: va.portal_role || 'member',
      role: va.portal_role || 'member',
      products: va.products || [],
    })
  }, [session])

  useEffect(function() {
    if (!showViewAs) return
    fetch(viewAsApi, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : [] })
      .then(function(data) {
        // Handle SM API envelope: { ok, data: { contacts: [...] } } or { ok, data: [...] }
        if (Array.isArray(data)) return setAllUsers(data)
        if (data && data.ok && data.data) {
          var d = data.data
          setAllUsers(d.contacts || (Array.isArray(d) ? d : []))
        } else {
          setAllUsers(Array.isArray(data) ? data : [])
        }
      })
      .catch(function() {})
  }, [showViewAs, viewAsApi])

  function handleViewAs(email) {
    if (!email) { setViewAs(null); return }
    var detailUrl = viewAsDetailApi
      ? viewAsDetailApi.replace('{email}', encodeURIComponent(email))
      : viewAsApi + '/' + encodeURIComponent(email)
    fetch(detailUrl, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(data) {
        // Handle SM API envelope
        var user = data
        if (data && data.ok && data.data) user = data.data
        if (user) setViewAs(user)
      })
      .catch(function() {
        var target = allUsers.find(function(u) { return u.email === email })
        if (target) setViewAs(target)
      })
  }

  // Effective permissions: use viewAs user if active, otherwise session
  var effectiveRole = viewAs ? viewAs.role : (session ? session.role : null)
  var effectivePerms = viewAs ? parsePerms(viewAs) : parsePerms(session)

  // Close mobile sidebar on nav
  useEffect(function() { setMobileOpen(false) }, [location.pathname])

  // Close dropdown on outside click
  useEffect(function() {
    function handler() { setDropdownOpen(false) }
    document.addEventListener('click', handler)
    return function() { document.removeEventListener('click', handler) }
  }, [])

  // ── Collapsible section state (admin pattern) ──
  // MUST be above the loading early-return — hooks cannot be called conditionally
  var _cs = useState(function() {
    if (!navSections) return {}
    var d = {}
    navSections.forEach(function(s) { d[s.key || s.label] = true })
    return d
  })
  var collapsedState = _cs[0]; var setCollapsedState = _cs[1]

  function toggleCollapse(key) {
    setCollapsedState(function(prev) {
      var next = Object.assign({}, prev)
      next[key] = !prev[key]
      try { localStorage.setItem('sm-nav-collapsed', JSON.stringify(next)) } catch (_e) {}
      return next
    })
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>

  // ── Build sections ──
  var sections = []

  if (navSections) {
    // Admin pattern: explicit sections array with role filtering.
    // Heading suppression is handled upstream by App.jsx (visibleGroups check).
    // Layout renders headings immediately — no deferral needed.
    navSections.forEach(function(section) {
      if (section.type === 'heading') {
        sections.push({ key: section.key || section.label, heading: section.label })
        return
      }
      // Pre-flushed headings from admin App.jsx (have .heading but not type:'heading')
      if (section.heading) {
        sections.push(section)
        return
      }
      if (section.product && !canViewProduct(effectivePerms, effectiveRole, section.product)) return
      var visibleItems = (section.items || []).filter(function(item) {
        return canViewSection(effectivePerms, effectiveRole, item.permKey)
      })
      if (visibleItems.length === 0) return
      sections.push({
        key: section.key || section.label,
        nav: {
          label: section.label,
          items: visibleItems,
          sectionIcon: section.sectionIcon,
          sectionColor: section.sectionColor,
        },
        product: section.product,
        flat: section.flat,
      })
    })
  } else {
    // Portal pattern: filtered by session.products
    var nav = Object.assign({}, DEFAULT_NAV, navConfig || {})
    var products = (session && session.products) || []
    var hasProducts = products.length > 0
    if (hasProducts && nav['sprint-mode']) {
      sections.push({ key: 'sprint-mode', nav: nav['sprint-mode'] })
    }
    products.forEach(function(prod) {
      if (prod === 'sprint-mode') return
      if (nav[prod]) sections.push({ key: prod, nav: nav[prod] })
    })
  }

  // Resolve icon strings to components
  sections.forEach(function(section) {
    if (!section.nav) return
    section.nav.items = section.nav.items.map(function(item) {
      if (item.icon && !item.Icon) {
        item = Object.assign({}, item, { Icon: resolveIcon(item.icon) })
      }
      return item
    })
  })

  var initials = session ? (session.name || session.email || '?').split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase() : '?'
  var sessionPhoto = session && session.photo
  var logo = logoSrc || '/logo-sprint-mode-horizontal.png'
  var alt = logoAlt || 'Sprint Mode'
  // Resolve logo for current theme — data-theme attribute (portal-controlled) over OS
  var themeLogo = logo
  if (typeof document !== 'undefined') {
    var dt = document.documentElement.getAttribute('data-theme')
    if (dt === 'dark' && logo.indexOf('.png') !== -1) {
      themeLogo = logo.replace('.png', '-dark.png')
    }
  }
  var hasHeader = !!(title || headerRight)

  // ── Build Cmd+K items from nav sections ──
  var autoCmdKItems = []
  if (!cmdKItems) {
    sections.forEach(function(section) {
      if (!section.nav) return
      section.nav.items.forEach(function(item) {
        if (item.to && !item.disabled && !item.external) {
          autoCmdKItems.push({ label: item.label, to: item.to, section: section.nav.label, step: item.step, Icon: item.Icon })
        }
      })
    })
    if (navBottom) {
      navBottom.forEach(function(item) {
        if (item.to) autoCmdKItems.push({ label: item.label, to: item.to, Icon: item.Icon })
      })
    }
  }
  var cmdkItems = cmdKItems || autoCmdKItems

  var logoutHref = onLogout || ('/api/auth/logout?redirect=' + encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + '/auth/login'))

  // ── Standard header-right items (rendered after custom headerRight) ──
  // View-as select: always render when showViewAs is true, even when allUsers is empty.
  // An empty list means no contacts yet — the dropdown should still appear so users can
  // see the feature exists and isn't a permissions problem. Hidden only when showViewAs=false.
  var viewAsSelect = showViewAs ? React.createElement(React.Fragment, null,
    React.createElement('select', {
      value: viewAs ? viewAs.email : '',
      onChange: function(e) { handleViewAs(e.target.value) },
      disabled: allUsers.length === 0,
      style: { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: allUsers.length === 0 ? 'var(--muted)' : 'var(--foreground)', fontSize: 13, cursor: allUsers.length === 0 ? 'default' : 'pointer', maxWidth: 200 }
    },
      allUsers.length === 0
        ? React.createElement('option', { value: '' }, 'No users')
        : React.createElement('option', { value: '' }, 'View as...'),
      allUsers.filter(function(u) {
        return u.email !== (session && session.email)
      }).map(function(u) {
        var label = u.name || u.company_name || (u.email ? u.email.split('@')[0] : u.id || '?')
        return React.createElement('option', { key: u.email || u.id, value: u.email }, label)
      })
    ),
    viewAs ? React.createElement('button', {
      onClick: function() { setViewAs(null) },
      style: { padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--accent-10)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
    }, '✕ Exit') : null
  ) : null

  var standardHeaderRight = hasHeader && session ? React.createElement(React.Fragment, null,
    cmdKEnabled ? React.createElement('button', {
      onClick: function() { setCmdkOpen(true) },
      style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', transition: 'border-color .2s' }
    },
      React.createElement(IconSearch, null),
      React.createElement('span', null, 'Search'),
      React.createElement('kbd', { style: { fontSize: 11, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--muted)', lineHeight: 1.4 } }, (typeof navigator !== 'undefined' && navigator.platform && navigator.platform.indexOf('Mac') !== -1) ? '\u2318K' : 'Ctrl+K')
    ) : null,
    React.createElement('button', {
      onClick: theme.toggle, 'aria-label': 'Toggle theme',
      style: { width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .2s', flexShrink: 0, padding: 0, color: 'var(--foreground)' }
    }, theme.isDark ? React.createElement(IconSun, null) : React.createElement(IconMoon, null)),
    React.createElement(NotificationBell, { apiBase: notificationApiBase }),
    bugPanelEnabled ? React.createElement(BugPanelHeaderButton, { onClick: function() { setBugPanelOpen(function(v) { return !v }) } }) : null,
    React.createElement(HeaderUserMenu, { session: session, profilePath: profilePath, logoutHref: logoutHref, userMenuExtra: userMenuExtra })
  ) : null

  return (
    <SessionContext.Provider value={session}>
    <ViewAsContext.Provider value={viewAs}>
      <div className={'shell' + (hasHeader ? ' shell-with-header' : '')}>

        {/* ── Optional header bar ── */}
        {hasHeader && (
          <header className="shell-header">
            <div className="shell-header-inner">
              <a href="/" className="shell-header-logo">
                {title ? (
                  <>
                    <div className="shell-header-logo-icon">
                      {headerIcon || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/>
                      </svg>}
                    </div>
                    <span className="shell-header-title">{title}{showCompanyName && session && session.company_name ? React.createElement('span', { className: 'shell-header-company' }, ' // ' + session.company_name) : null}</span>
                    {byLine ? React.createElement('span', { className: 'shell-header-byline' }, byLine) : null}
                  </>
                ) : (
                  <img src={themeLogo} alt={alt} style={{ height: 24, width: 'auto' }} />
                )}
              </a>
              {(viewAsSelect || headerCta || headerRight || standardHeaderRight) && (
                <div className="shell-header-right">
                  {viewAsSelect}
                  {headerCta && React.createElement('button', {
                    onClick: headerCta.onClick,
                    style: {
                      padding: '6px 14px', borderRadius: 8,
                      background: headerCta.variant === 'outline' ? 'transparent' : 'var(--accent)',
                      color: headerCta.variant === 'outline' ? 'var(--accent)' : '#fff',
                      border: headerCta.variant === 'outline' ? '1px solid var(--accent)' : 'none',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                      transition: 'opacity .15s', flexShrink: 0,
                    },
                    onMouseOver: function(e) { e.currentTarget.style.opacity = '0.85' },
                    onMouseOut: function(e) { e.currentTarget.style.opacity = '1' },
                  }, headerCta.label)}
                  {headerRight}
                  {standardHeaderRight}
                </div>
              )}
            </div>
          </header>
        )}

        {/* ── Body: sidebar + main (wrapped for header layout) ── */}
        <div className="shell-body">

        {/* ── Sidebar ── */}
        <aside className={'portal-sidebar' + (mobileOpen ? ' open' : '')} id="portalSidebar">
          {!hasHeader && (
            <div className="portal-sidebar-logo">
              <img src={themeLogo} alt={alt} style={{ height: 24, width: 'auto' }} />
            </div>
          )}
          <nav className="portal-sidebar-nav">
            {sections.map(function(section) {
              // Heading divider
              if (section.heading) {
                return (
                  <div key={section.key} className="ps-heading" style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
                    color: 'var(--muted)', padding: '16px 14px 6px', userSelect: 'none',
                  }}>{section.heading}</div>
                )
              }
              var pc = PRODUCT_COLORS[section.key] || PRODUCT_COLORS['sprint-mode']
              return (
                <SidebarSection
                  key={section.key}
                  label={section.nav.label}
                  sectionIcon={section.nav.sectionIcon}
                  sectionColor={section.nav.sectionColor}
                  items={section.nav.items}
                  color={pc.color}
                  tint={pc.tint}
                  product={section.key}
                  flat={sections.length === 1 || section.flat || section.nav.flat}
                  collapsed={navSections ? collapsedState[section.key] : undefined}
                  onToggle={navSections ? function() { toggleCollapse(section.key) } : undefined}
                />
              )
            })}
          </nav>

          {/* Bottom nav items (Settings, etc) */}
          {navBottom && navBottom.length > 0 && (
            <div className="portal-sidebar-bottom-nav">
              {navBottom.filter(function(item) {
                return canViewSection(effectivePerms, effectiveRole, item.permKey)
              }).map(function(item) {
                return (
                  <NavLink key={item.to} to={item.to} className={function(p) { return 'ps-item' + (p.isActive ? ' active' : '') }}>
                    {item.Icon && <item.Icon />}{' '}{item.label}
                  </NavLink>
                )
              })}
            </div>
          )}

          {sidebarBottom}

          {/* No Cmd+K footer button — Cmd+K is in the header bar already */}

          {/* Default user section (only if no header) */}
          {!hasHeader && (
            <div className="portal-sidebar-user">
              <button className="portal-avatar" onClick={function(e) { e.stopPropagation(); setDropdownOpen(!dropdownOpen) }}>
                {sessionPhoto
                  ? React.createElement('img', { src: sessionPhoto, alt: '', style: { width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover', display: 'block' } })
                  : initials}
              </button>
              <div>
                <div className="portal-sidebar-user-name">{session ? (session.name || session.email) : ''}</div>
                <div className="portal-sidebar-user-co">{session ? (session.company_name || '') : ''}</div>
              </div>
            </div>
          )}
          {!hasHeader && dropdownOpen && (
            <div className="portal-dropdown" style={{ position: 'fixed', bottom: 60, left: 14, zIndex: 100, minWidth: 200, display: 'block' }}>
              <div className="portal-dropdown-name">{session ? (session.name || session.email) : ''}</div>
              <div className="portal-dropdown-company">{session ? (session.company_name || '') : ''}</div>
              <hr />
              <a href={profilePath || '/client/profile'}>Profile</a>
              <a href={logoutHref}>Sign out</a>
            </div>
          )}
        </aside>

        {/* Mobile bar */}
        <div className="portal-mobile-bar">
          <button onClick={function() { setMobileOpen(!mobileOpen) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--foreground)', borderRadius: 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--foreground)', borderRadius: 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--foreground)', borderRadius: 1 }} />
          </button>
          {!hasHeader && <img src={themeLogo} alt={alt} style={{ height: 24, width: 'auto' }} />}
        </div>

        {/* Overlay */}
        {mobileOpen && <div className="portal-sidebar-overlay open" onClick={function() { setMobileOpen(false) }} />}

        {/* Main content */}
        <main className="portal-main">
          {viewAs && (
            <div className="shell-viewas-banner">
              <span>
                <strong>Viewing as:</strong>{' '}
                {viewAs.name || viewAs.email} ({viewAs.role})
                <span className="shell-viewas-hint"> — sidebar shows what they see</span>
              </span>
              <button className="shell-viewas-exit" onClick={function() { setViewAs(null) }}>Exit</button>
            </div>
          )}
          <div key={viewAs ? viewAs.id || viewAs.email : '__self__'}>{children || <Outlet />}</div>
        </main>

        </div>{/* .shell-body */}

        {/* Cmd+K overlay */}
        {cmdKEnabled && (
          <CmdK
            open={cmdkOpen}
            onClose={function() { setCmdkOpen(false) }}
            items={cmdkItems}
            onNavigate={function(to) { navigate(to) }}
            placeholder={cmdKPlaceholder}
            onSearch={cmdKOnSearch}
            recentKey={cmdKRecentKey}
          />
        )}

        {/* Bug Panel (BUG-TOOL-1) */}
        {bugPanelEnabled && (
          <BugPanel
            visible={bugPanelOpen}
            onClose={function() { setBugPanelOpen(false) }}
            isAdmin={!!bugPanelAdmin}
            apiBase={notificationApiBase}
            product={bugPanelProduct}
            label={bugPanelLabel}
            session={session}
          />
        )}
      </div>
    </ViewAsContext.Provider>
    </SessionContext.Provider>
  )
}
