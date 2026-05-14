import React, { useState, useEffect, createContext, useContext } from 'react'
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { getSession, clearSession } from './api.js'
import { IconChevron } from './Icons.jsx'

// ═══ SESSION CONTEXT ═══

var SessionContext = createContext(null)
export function useSession() { return useContext(SessionContext) }

// ═══ PRODUCT COLOR MAP ═══

var PRODUCT_COLORS = {
  'sprint-mode':    { color: '#2362ea', tint: '#e9effc' },
  'studios':        { color: '#7947d1', tint: '#f1ecfa' },
  'mode':           { color: '#f4930a', tint: '#fdf4e6' },
  'hub':            { color: '#2362ea', tint: '#e9effc' },
  'sprint-capital': { color: '#1fac6a', tint: '#e8f6f0' },
  'privacyai':      { color: '#0fb67f', tint: '#e7f7f2' },
  'investor':       { color: '#2362ea', tint: '#e9effc' },
}

// ═══ SIDEBAR SECTION ═══

function SidebarSection({ label, Logo, items, color, tint, defaultOpen, product }) {
  var _useState = useState(defaultOpen !== false)
  var open = _useState[0]
  var setOpen = _useState[1]
  var location = useLocation()
  var hasActive = items.some(function(item) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  })

  useEffect(function() {
    if (hasActive && !open) setOpen(true)
  }, [hasActive])

  var sectionStyle = { '--section-color': color, '--section-tint': tint }

  return (
    <div className={'ps-section' + (open ? '' : ' collapsed')} data-product={product} style={sectionStyle}>
      <button className="ps-section-header" onClick={function() { setOpen(!open) }}>
        {Logo && <Logo />}
        {label}
        <svg className="ps-section-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="ps-section-items">
          {items.map(function(item) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={function(p) {
                  var cls = 'ps-item'
                  if (p.isActive) cls += ' active'
                  return cls
                }}
              >
                {item.step != null ? <span className="ps-step">{item.step}</span> : item.Icon && <item.Icon />}
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
// Products register their nav items here. Products importing @sprintmode/ui
// can extend this by passing navConfig to Layout.

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

// Icon resolver — maps icon name strings to icon components
// Imported lazily so products can extend without importing all icons
function resolveIcon(name) {
  // Inline requires to avoid circular deps — icons are simple SVGs
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
  }
  return map[name] || null
}

// Product logo components for sidebar
var PRODUCT_LOGOS = {
  'sprint-mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/></g></svg> },
  'studios': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#f1ecfa"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#7947d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></g></svg> },
  'mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#fdf4e6"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#f4930a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></g></svg> },
  'hub': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g></svg> },
  'investor': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g></svg> },
  'sprint-capital': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e8f6f0"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#1fac6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g></svg> },
  'privacyai': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e7f7f2"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#0fb67f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></g></svg> },
}

// ═══ MAIN LAYOUT ═══

export default function Layout({ navConfig, logoSrc, logoAlt, onLogout, profilePath }) {
  var _s = useState(null); var session = _s[0]; var setSession = _s[1]
  var _l = useState(true); var loading = _l[0]; var setLoading = _l[1]
  var _m = useState(false); var mobileOpen = _m[0]; var setMobileOpen = _m[1]
  var _d = useState(false); var dropdownOpen = _d[0]; var setDropdownOpen = _d[1]
  var navigate = useNavigate()
  var location = useLocation()

  useEffect(function() {
    getSession().then(function(s) {
      if (!s) {
        navigate('/auth/login?redirect=' + encodeURIComponent(location.pathname))
        return
      }
      setSession(s)
      setLoading(false)
    })
  }, [])

  // Close mobile sidebar on nav
  useEffect(function() { setMobileOpen(false) }, [location.pathname])

  // Close dropdown on outside click
  useEffect(function() {
    function handler() { setDropdownOpen(false) }
    document.addEventListener('click', handler)
    return function() { document.removeEventListener('click', handler) }
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>

  // Merge default nav with any product-provided nav config
  var nav = Object.assign({}, DEFAULT_NAV, navConfig || {})
  var products = session.products || []
  var initials = (session.name || session.email || '?').split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase()

  // Build section list from session.products
  // Show "Sprint Mode" section if any product is present
  var sections = []
  var hasProducts = products.length > 0

  // Shared "Sprint Mode" section always shows if user has any product
  if (hasProducts && nav['sprint-mode']) {
    var smNav = nav['sprint-mode']
    sections.push({ key: 'sprint-mode', nav: smNav })
  }

  // Then each product the user has access to
  products.forEach(function(prod) {
    if (prod === 'sprint-mode') return // already shown above
    if (nav[prod]) {
      sections.push({ key: prod, nav: nav[prod] })
    }
  })

  // Resolve icon strings to components for each nav item
  sections.forEach(function(section) {
    section.nav.items = section.nav.items.map(function(item) {
      if (item.icon && !item.Icon) {
        item = Object.assign({}, item, { Icon: resolveIcon(item.icon) })
      }
      return item
    })
  })

  var logo = logoSrc || '/logo-sprint-mode-horizontal.png'
  var alt = logoAlt || 'Sprint Mode'

  return (
    <SessionContext.Provider value={session}>
      <div className="shell">
        {/* Sidebar */}
        <aside className={'portal-sidebar' + (mobileOpen ? ' open' : '')} id="portalSidebar">
          <div className="portal-sidebar-logo">
            <picture><source srcSet={logo.replace(".png", "-dark.png")} media="(prefers-color-scheme: dark)" /><img src={logo} alt={alt} style={{ height: 24, width: "auto" }} /></picture>
          </div>
          <nav className="portal-sidebar-nav">
            {sections.map(function(section) {
              var pc = PRODUCT_COLORS[section.key] || PRODUCT_COLORS['sprint-mode']
              return (
                <SidebarSection
                  key={section.key}
                  label={section.nav.label}
                  Logo={PRODUCT_LOGOS[section.key]}
                  items={section.nav.items}
                  color={pc.color}
                  tint={pc.tint}
                  product={section.key}
                />
              )
            })}
          </nav>
          <div className="portal-sidebar-user">
            <button className="portal-avatar" onClick={function(e) { e.stopPropagation(); setDropdownOpen(!dropdownOpen) }}>{initials}</button>
            <div>
              <div className="portal-sidebar-user-name">{session.name || session.email}</div>
              <div className="portal-sidebar-user-co">{session.company_name || ''}</div>
            </div>
          </div>
          {dropdownOpen && (
            <div className="portal-dropdown" style={{ position: 'fixed', bottom: 60, left: 14, zIndex: 100, minWidth: 200, display: 'block' }}>
              <div className="portal-dropdown-name">{session.name || session.email}</div>
              <div className="portal-dropdown-company">{session.company_name || ''}</div>
              <hr />
              <a href={profilePath || '/client/profile'}>Profile</a>
              <a href={onLogout || ('/api/auth/logout?redirect=' + encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + '/auth/login'))}>Sign out</a>
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
          <picture><source srcSet={logo.replace(".png", "-dark.png")} media="(prefers-color-scheme: dark)" /><img src={logo} alt={alt} style={{ height: 24, width: "auto" }} /></picture>
        </div>

        {/* Overlay */}
        {mobileOpen && <div className="portal-sidebar-overlay open" onClick={function() { setMobileOpen(false) }} />}

        {/* Main content */}
        <main className="portal-main">
          <Outlet />
        </main>
      </div>
    </SessionContext.Provider>
  )
}
