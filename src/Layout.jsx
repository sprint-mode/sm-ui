import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { getSession, clearSession } from './api.js'
import { IconChevron } from './Icons.jsx'

// ═══ SESSION CONTEXT ═══

var SessionContext = createContext(null)
export function useSession() { return useContext(SessionContext) }

// ═══ VIEW-AS CONTEXT ═══
// Provides the impersonated user object (or null) to child components.
// Any page can check useViewAs() to scope its data or UI appropriately.

export var ViewAsContext = createContext(null)
export function useViewAs() { return useContext(ViewAsContext) }

// ═══ PRODUCT COLOR MAP ═══

var PRODUCT_COLORS = {
  'sprint-mode':    { color: '#2362ea', tint: '#e9effc' },
  'studios':        { color: '#7947d1', tint: '#f1ecfa' },
  'mode':           { color: '#f4930a', tint: '#fdf4e6' },
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
  } catch (e) { return null }
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
  if (!perms || !perms.products) return false
  return !!perms.products[product]
}

// ═══ SIDEBAR SECTION ═══

function SidebarSection({ label, Logo, sectionIcon, sectionColor, items, color, tint, defaultOpen, product, collapsed, onToggle }) {
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

  useEffect(function() {
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
    <div className={'ps-section' + (open ? '' : ' collapsed')} data-product={product} style={sectionStyle}>
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
      {open && (
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
var PRODUCT_LOGOS = {
  'sprint-mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e9effc"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/></g></svg> },
  'studios': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#f1ecfa"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#7947d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></g></svg> },
  'mode': function() { return <svg width="18" height="18" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#fdf4e6"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#f4930a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></g></svg> },
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
  var onLogout = props.onLogout
  var profilePath = props.profilePath

  // Session state — use prop or auto-fetch
  var _s = useState(sessionProp || null); var session = _s[0]; var setSession = _s[1]
  var _l = useState(!sessionProp); var loading = _l[0]; var setLoading = _l[1]
  var _m = useState(false); var mobileOpen = _m[0]; var setMobileOpen = _m[1]
  var _d = useState(false); var dropdownOpen = _d[0]; var setDropdownOpen = _d[1]
  var navigate = useNavigate()
  var location = useLocation()

  // Sync session prop changes
  useEffect(function() {
    if (sessionProp) { setSession(sessionProp); setLoading(false) }
  }, [sessionProp])

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
  var isSuperAdmin = session && (session.role === 'super_admin')
  var showViewAs = viewAsEnabled && isSuperAdmin
  var _va = useState(null); var viewAs = _va[0]; var setViewAs = _va[1]
  var _au = useState([]); var allUsers = _au[0]; var setAllUsers = _au[1]

  useEffect(function() {
    if (!showViewAs) return
    fetch(viewAsApi, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : [] })
      .then(function(data) { setAllUsers(Array.isArray(data) ? data : []) })
      .catch(function() {})
  }, [showViewAs, viewAsApi])

  function handleViewAs(email) {
    if (!email) { setViewAs(null); return }
    var detailUrl = viewAsDetailApi
      ? viewAsDetailApi.replace('{email}', encodeURIComponent(email))
      : viewAsApi + '/' + encodeURIComponent(email)
    fetch(detailUrl, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(data) { if (data) setViewAs(data) })
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>

  // ── Build sections ──
  var sections = []

  if (navSections) {
    // Admin pattern: explicit sections array with role filtering
    navSections.forEach(function(section) {
      if (section.product && !canViewProduct(effectivePerms, effectiveRole, section.product)) return
      var visibleItems = section.items.filter(function(item) {
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
    section.nav.items = section.nav.items.map(function(item) {
      if (item.icon && !item.Icon) {
        item = Object.assign({}, item, { Icon: resolveIcon(item.icon) })
      }
      return item
    })
  })

  var initials = session ? (session.name || session.email || '?').split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase() : '?'
  var logo = logoSrc || '/logo-sprint-mode-horizontal.png'
  var alt = logoAlt || 'Sprint Mode'
  var hasHeader = !!(title || headerRight)

  // ── Collapsible section state (admin pattern) ──
  var _cs = useState(function() {
    if (!navSections) return {}
    try {
      var saved = typeof localStorage !== 'undefined' ? localStorage.getItem('sm-nav-collapsed') : null
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    var d = {}
    navSections.forEach(function(s) { d[s.key || s.label] = true })
    return d
  })
  var collapsedState = _cs[0]; var setCollapsedState = _cs[1]

  function toggleCollapse(key) {
    setCollapsedState(function(prev) {
      var next = Object.assign({}, prev)
      next[key] = !prev[key]
      try { localStorage.setItem('sm-nav-collapsed', JSON.stringify(next)) } catch (e) {}
      return next
    })
  }

  var logoutHref = onLogout || ('/api/auth/logout?redirect=' + encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + '/auth/login'))

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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                        <rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/>
                      </svg>
                    </div>
                    <span className="shell-header-title">{title}</span>
                  </>
                ) : (
                  <picture><source srcSet={logo.replace(".png", "-dark.png")} media="(prefers-color-scheme: dark)" /><img src={logo} alt={alt} style={{ height: 24, width: 'auto' }} /></picture>
                )}
              </a>
              {headerRight && <div className="shell-header-right">{headerRight}</div>}
            </div>
          </header>
        )}

        {/* ── Body: sidebar + main (wrapped for header layout) ── */}
        <div className="shell-body">

        {/* ── Sidebar ── */}
        <aside className={'portal-sidebar' + (mobileOpen ? ' open' : '')} id="portalSidebar">
          {!hasHeader && (
            <div className="portal-sidebar-logo">
              <picture><source srcSet={logo.replace(".png", "-dark.png")} media="(prefers-color-scheme: dark)" /><img src={logo} alt={alt} style={{ height: 24, width: 'auto' }} /></picture>
            </div>
          )}
          <nav className="portal-sidebar-nav">
            {sections.map(function(section) {
              var pc = PRODUCT_COLORS[section.key] || PRODUCT_COLORS['sprint-mode']
              return (
                <SidebarSection
                  key={section.key}
                  label={section.nav.label}
                  Logo={PRODUCT_LOGOS[section.key]}
                  sectionIcon={section.nav.sectionIcon}
                  sectionColor={section.nav.sectionColor}
                  items={section.nav.items}
                  color={pc.color}
                  tint={pc.tint}
                  product={section.key}
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

          {/* View-As selector (super_admin only) */}
          {showViewAs && allUsers.length > 1 && (
            <div className="portal-sidebar-viewas">
              <div className="portal-sidebar-viewas-label">View as</div>
              <select
                value={viewAs ? viewAs.email : ''}
                onChange={function(e) { handleViewAs(e.target.value) }}
                className={'portal-sidebar-viewas-select' + (viewAs ? ' active' : '')}
              >
                <option value="">— Select —</option>
                {allUsers.filter(function(u) {
                  return u.email !== (session && session.email) && u.role !== 'super_admin'
                }).filter(function(u, i, arr) {
                  var base = u.email.replace('@sprintmode.co', '').replace('@sprintmode.ai', '')
                  return arr.findIndex(function(o) {
                    return o.email.replace('@sprintmode.co', '').replace('@sprintmode.ai', '') === base
                  }) === i
                }).map(function(u) {
                  return <option key={u.email} value={u.email}>{u.name || u.email.split('@')[0]} ({u.role})</option>
                })}
              </select>
            </div>
          )}

          {sidebarBottom}

          {/* Default user section (only if no header) */}
          {!hasHeader && (
            <div className="portal-sidebar-user">
              <button className="portal-avatar" onClick={function(e) { e.stopPropagation(); setDropdownOpen(!dropdownOpen) }}>{initials}</button>
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
          <picture><source srcSet={logo.replace(".png", "-dark.png")} media="(prefers-color-scheme: dark)" /><img src={logo} alt={alt} style={{ height: 24, width: 'auto' }} /></picture>
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
          {children || <Outlet />}
        </main>

        </div>{/* .shell-body */}
      </div>
    </ViewAsContext.Provider>
    </SessionContext.Provider>
  )
}
