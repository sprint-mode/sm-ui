import React from 'react'

// Base SVG props — Feather icon style, 24x24, stroke-based
var S = { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24',
          fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

// ═══ SYSTEM ICONS ═══

export var IconGrid = function(p) { return <svg {...S} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
export var IconCode = function(p) { return <svg {...S} {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
export var IconDoc = function(p) { return <svg {...S} {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg> }
export var IconLock = function(p) { return <svg {...S} {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg> }
export var IconTrend = function(p) { return <svg {...S} {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> }
export var IconUsers = function(p) { return <svg {...S} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
export var IconUser = function(p) { return <svg {...S} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> }
export var IconDollar = function(p) { return <svg {...S} {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
export var IconTerminal = function(p) { return <svg {...S} {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> }
export var IconGear = function(p) { return <svg {...S} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
export var IconSessions = function(p) { return <svg {...S} {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> }
export var IconEye = function(p) { return <svg {...S} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
export var IconLayers = function(p) { return <svg {...S} {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> }
export var IconStar = function(p) { return <svg {...S} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
export var IconCheck = function(p) { return <svg {...S} {...p}><polyline points="20 6 9 17 4 12"/></svg> }
export var IconRefresh = function(p) { return <svg {...S} {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
export var IconWarn = function(p) { return <svg {...S} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
export var IconSpark = function(p) { return <svg {...S} {...p}><path d="M12 3v4m0 10v4M5.636 5.636l2.828 2.828m7.072 7.072l2.828 2.828M3 12h4m10 0h4M5.636 18.364l2.828-2.828m7.072-7.072l2.828-2.828"/></svg> }
export var IconClick = function(p) { return <svg {...S} {...p}><path d="M9 9l5 12 1.774-5.226L21 14 9 9z"/><path d="M16.071 16.071l4.243 4.243"/></svg> }
export var IconPercent = function(p) { return <svg {...S} {...p}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> }
export var IconCloud = function(p) { return <svg {...S} {...p}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> }
export var IconExternal = function(p) { return <svg {...S} {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> }
export var IconFile = function(p) { return <svg {...S} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
export var IconMsg = function(p) { return <svg {...S} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
export var IconBill = function(p) { return <svg {...S} {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
export var IconPortfolio = function(p) { return <svg {...S} {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> }
export var IconExpand = function(p) { return <svg {...S} {...p}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> }
export var IconWrench = function(p) { return <svg {...S} {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> }
export var IconPlus = function(p) { return <svg {...S} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
export var IconX = function(p) { return <svg {...S} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
export var IconMail = function(p) { return <svg {...S} {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> }
export var IconChevron = function(p) { return <svg {...S} {...p}><polyline points="6 9 12 15 18 9"/></svg> }

// ═══ PRODUCT LOGO ICONS (from DESIGN_SYSTEM.md Section 5) ═══
// These are 24x24 stroke icons matching the brand logo design.
// Wrap in a tint background div for the "app icon" look.

export var LogoSprintMode = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/></svg>
}
export var LogoStudios = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#7947d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
}
export var LogoMode = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#f4930a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>
}
export var LogoHub = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
export var LogoSprintCapital = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#1fac6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}
export var LogoPrivacyAI = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#0fb67f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>
}

// Tinted product icon badge wrapper
export var ProductIcon = function(p) {
  var product = p.product || 'sprint-mode'
  var colors = {
    'sprint-mode':    { bg: '#e9effc', Logo: LogoSprintMode },
    'studios':        { bg: '#f1ecfa', Logo: LogoStudios },
    'mode':           { bg: '#fdf4e6', Logo: LogoMode },
    'hub':            { bg: '#e9effc', Logo: LogoHub },
    'sprint-capital': { bg: '#e8f6f0', Logo: LogoSprintCapital },
    'privacyai':      { bg: '#e7f7f2', Logo: LogoPrivacyAI },
  }
  var c = colors[product] || colors['sprint-mode']
  var size = p.size || 40
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <c.Logo width={size * 0.5} height={size * 0.5} />
    </div>
  )
}
