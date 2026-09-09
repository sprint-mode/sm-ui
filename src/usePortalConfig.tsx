import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export interface PortalConfig {
  id?: string
  subdomain?: string
  name?: string
  brand_color?: string | null
  brand_tint?: string | null
  /** FEAT-3283: dark-mode accent override. When present, injected under
   *  prefers-color-scheme:dark and [data-theme="dark"]. */
  brand_color_dark?: string | null
  /** FEAT-3283: optional token overrides — only --radius and --font are
   *  in the published set; anything else is ignored by the injector. */
  theme_overrides?: { '--radius'?: string; '--font'?: string } | null
  logo_url?: string | null
  favicon_url?: string | null
  icon_key?: string | null
  logo_mark_url?: string | null
  custom_domain?: string | null
  nav_enabled?: boolean | number
  billing_enabled?: boolean | number
  cmdk_enabled?: boolean | number
  // bug_panel removed — BUG-2220 killed cross-portal panel
  updates_enabled?: boolean | number
  chat_enabled?: boolean | number
  [key: string]: unknown
}

export interface PortalConfigContextValue {
  config: PortalConfig | null
  loading: boolean
  error: string | null
}

export interface PortalConfigProviderProps {
  subdomain: string
  /** TASK-3229 (D2 one door shape): prefix in front of /api/* routes.
   *  "" routes the portal-config read through the portal's own origin
   *  (proxy). The default stays direct to https://api.sprintmode.ai until
   *  a later square flips every portal to the proxy default. */
  apiBase?: string
  children: ReactNode
}

// ── FEAT-3283: theme injection helpers ───────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  var c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(function(ch) { return ch + ch }).join('')
  var n = parseInt(c, 16)
  if (isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function darkenHex(hex: string, pct: number): string {
  var rgb = hexToRgb(hex)
  if (!rgb) return hex
  var f = 1 - pct / 100
  return '#' + [rgb.r, rgb.g, rgb.b].map(function(v) {
    return Math.max(0, Math.round(v * f)).toString(16).padStart(2, '0')
  }).join('')
}

function contrastForeground(hex: string): string {
  var rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.55 ? '#111110' : '#ffffff'
}

function accentBlock(sel: string, color: string, tint?: string | null): string {
  var rgb = hexToRgb(color)
  var rgbStr = rgb ? rgb.r + ',' + rgb.g + ',' + rgb.b : '0,0,0'
  return [
    sel + '{',
    '  --accent:' + color + ';',
    '  --accent-hover:' + darkenHex(color, 10) + ';',
    '  --accent-10:rgba(' + rgbStr + ',0.1);',
    '  --accent-20:rgba(' + rgbStr + ',0.2);',
    '  --accent-tint:' + (tint || 'rgba(' + rgbStr + ',0.15)') + ';',
    '  --accent-foreground:' + contrastForeground(color) + ';',
    '}',
  ].join('\n')
}

function injectPortalTheme(subdomain: string, config: PortalConfig): void {
  var el = document.getElementById('sm-theme-inject') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'sm-theme-inject'
    document.head.appendChild(el)
  }
  var q = JSON.stringify(subdomain)
  var sel = '[data-sm-theme=' + q + ']'
  var color = config.brand_color as string
  var tint = config.brand_tint as string | undefined
  var blocks: string[] = [accentBlock(sel, color, tint)]
  var overrides = config.theme_overrides as { '--radius'?: string; '--font'?: string } | null | undefined
  if (overrides && (overrides['--radius'] || overrides['--font'])) {
    var extra = [sel + '{']
    if (overrides['--radius']) extra.push('  --radius:' + overrides['--radius'] + ';')
    if (overrides['--font']) extra.push('  --font:' + overrides['--font'] + ';')
    extra.push('}')
    blocks.push(extra.join('\n'))
  }
  var dark = config.brand_color_dark as string | undefined
  if (dark) {
    var darkSel = sel + '[data-theme=dark],' + sel + ':not([data-theme=light]):has([data-theme=dark])'
    blocks.push(accentBlock(darkSel, dark))
    blocks.push('@media(prefers-color-scheme:dark){' + accentBlock(sel + ':not([data-theme=light])', dark) + '}')
  }
  el.textContent = blocks.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────

var PortalConfigContext = createContext<PortalConfigContextValue | null>(null)

export function usePortalConfig(): PortalConfigContextValue {
  return useContext(PortalConfigContext) || { config: null, loading: true, error: null }
}

export function PortalConfigProvider({ subdomain, apiBase, children }: PortalConfigProviderProps) {
  var [config, setConfig] = useState<PortalConfig | null>(null)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState<string | null>(null)

  useEffect(function() {
    if (!subdomain) { setLoading(false); return }
    var base = apiBase ?? 'https://api.sprintmode.ai'
    fetch(base + '/api/portal/config?subdomain=' + encodeURIComponent(subdomain), {
      credentials: 'include'
    })
      .then(function(r) { return r.json() })
      .then(function(d: { ok: boolean; config?: PortalConfig; error?: string }) {
        if (d.ok && d.config) {
          setConfig(d.config)
          // FEAT-3283: inject the full accent token set from brand_color.
          // Targets [data-sm-theme=<subdomain>] on the Layout shell div so the
          // block wins over the hardcoded tokens.css per-product fallbacks and
          // survives sm-ui bumps without a CSS fork. BUG-2883 (login route
          // theming) is preserved — the style tag sits in <head> globally.
          if (d.config.brand_color && subdomain) {
            injectPortalTheme(subdomain, d.config)
          }
        } else {
          setError(d.error || 'Failed to load portal config')
        }
        setLoading(false)
      })
      .catch(function(err: Error) {
        setError(err.message)
        setLoading(false)
      })
  }, [subdomain, apiBase])

  return (
    <PortalConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </PortalConfigContext.Provider>
  )
}
