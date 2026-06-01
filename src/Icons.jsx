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
export var IconArrowUp = function(p) { return <svg {...S} {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> }
export var IconArrowDown = function(p) { return <svg {...S} {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> }
export var IconArrowLeft = function(p) { return <svg {...S} {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
export var IconArrowRight = function(p) { return <svg {...S} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> }
export var IconChevronRight = function(p) { return <svg {...S} {...p}><polyline points="9 18 15 12 9 6"/></svg> }
export var IconChevronDown = function(p) { return <svg {...S} {...p}><polyline points="6 9 12 15 18 9"/></svg> }
export var IconRocket = function(p) { return <svg {...S} {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> }
export var IconTarget = function(p) { return <svg {...S} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }
export var IconFolder = function(p) { return <svg {...S} {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
export var IconClipboard = function(p) { return <svg {...S} {...p}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> }
export var IconPalette = function(p) { return <svg {...S} {...p}><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.14-.74-.39-1.04-.24-.3-.39-.65-.39-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></svg> }
export var IconEdit = function(p) { return <svg {...S} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
export var IconReceipt = function(p) { return <svg {...S} {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg> }

// Admin / platform icons
export var IconSearch = function(p) { return <svg {...S} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
export var IconPlay = function(p) { return <svg {...S} {...p}><polygon points="5 3 19 12 5 21 5 3"/></svg> }
export var IconUserPlus = function(p) { return <svg {...S} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> }
export var IconMonitor = function(p) { return <svg {...S} {...p}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
export var IconMoon = function(p) { return <svg {...S} {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
export var IconSun = function(p) { return <svg {...S} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
export var IconPipeline = function(p) { return <svg {...S} {...p}><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="7" rx="1"/></svg> }
export var IconSend = function(p) { return <svg {...S} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
export var IconShield = function(p) { return <svg {...S} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
export var IconGridPlus = function(p) { return <svg {...S} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7"/><path d="M17 14v6"/></svg> }
export var IconLink = function(p) { return <svg {...S} {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
export var IconPackage = function(p) { return <svg {...S} {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
export var IconQuestion = function(p) { return <svg {...S} {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
export var IconPaperclip = function(p) { return <svg {...S} {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> }
export var IconChevronUp = function(p) { return <svg {...S} {...p}><polyline points="18 15 12 9 6 15"/></svg> }

// These are 24x24 stroke icons matching the brand logo design.
// Wrap in a tint background div for the "app icon" look.

export var LogoSprintMode = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#2362ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="10 8 14 12 10 16"/></svg>
}
export var LogoStudios = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#7947d1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
}
export var LogoMode = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#0c917b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>
}
export var LogoHub = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#4f5d93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
export var LogoSprintCapital = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#1fac6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}
export var LogoPrivacyAI = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>
}

// Tinted product icon badge wrapper
export var ProductIcon = function(p) {
  var product = p.product || 'sprint-mode'
  var colors = {
    'sprint-mode':    { bg: '#e9effc', Logo: LogoSprintMode },
    'studios':        { bg: '#f1ecfa', Logo: LogoStudios },
    'mode':           { bg: '#e6f4f1', Logo: LogoMode },
    'hub':            { bg: '#eef0f8', Logo: LogoHub },
    'sprint-capital': { bg: '#e8f6f0', Logo: LogoSprintCapital },
    'privacyai':      { bg: '#e8f4f8', Logo: LogoPrivacyAI },
    'dev-portal':     { bg: '#b8b8bc', Logo: LogoDevPortal },
    'signal':         { bg: '#f9ecf1', Logo: LogoSignal },
    'api':             { bg: '#faeadf', Logo: LogoAPI } },
  }
  var c = colors[product] || colors['sprint-mode']
  var size = p.size || 40
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <c.Logo width={size * 0.5} height={size * 0.5} />
    </div>
  )
}

// Dev Portal — terminal window icon
export var LogoDevPortal = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#4a4a52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="6.5" cy="6" r="0.8" fill="#4a4a52" stroke="none"/><circle cx="9" cy="6" r="0.8" fill="#4a4a52" stroke="none"/><circle cx="11.5" cy="6" r="0.8" fill="#4a4a52" stroke="none"/><line x1="3" y1="8.5" x2="21" y2="8.5"/><polyline points="7 12.5 10 15.5 7 18.5"/><line x1="13" y1="18.5" x2="17" y2="18.5"/></svg>
}

// Signal — bar chart icon
export var LogoSignal = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#c24576" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}

// API — terminal prompt icon
export var LogoAPI = function(p) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
}
