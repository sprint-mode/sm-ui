// Helpers for public marketing sites that use SiteHeader. Session-free.
// FEAT-2997.

import { useEffect } from 'react'

// ─── No-FOUC theme snippet ───────────────────────────────────────────────────
// Inline this in the site's <head>, BEFORE any stylesheet, so the resolved
// data-theme attribute is on <html> before first paint. It uses the SAME
// storage key ('sm-theme') and resolution as Layout's useTheme / SiteHeader:
// stored 'dark'|'light' wins; otherwise the OS preference; the applied attribute
// is always concrete because [data-theme="dark"] overrides have no @media twins.
//
// Usage (Vite index.html):
//   <script>SM_SITE_THEME_SNIPPET</script>   // paste the string below verbatim
// or in JSX:
//   <script dangerouslySetInnerHTML={{ __html: siteThemeSnippet }} />

// It also sets data-sm-theme-mode to the chosen mode ('auto'|'dark'|'light'),
// which SiteHeader's prerendered theme pill reads so it shows the stored theme
// before hydration (Nikola 54).
export var siteThemeSnippet =
  "(function(){try{var t=localStorage.getItem('sm-theme');" +
  "var s=(t==='dark'||t==='light');" +
  "var d=s?t:" +
  "((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');" +
  "document.documentElement.setAttribute('data-theme',d);" +
  "document.documentElement.setAttribute('data-sm-theme-mode',s?t:'auto');}catch(e){}})();"

// Apply the resolved theme attribute imperatively (e.g. from an SSR entry that
// cannot inline a script). Idempotent with the snippet above.
export function applySiteTheme(): void {
  if (typeof document === 'undefined') return
  var t: string | null = null
  try { t = localStorage.getItem('sm-theme') } catch (_e) { /* noop */ }
  var applied = (t === 'dark' || t === 'light')
    ? t
    : (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', applied)
  document.documentElement.setAttribute('data-sm-theme-mode', (t === 'dark' || t === 'light') ? t : 'auto')
}

// ─── Per-page title helper ────────────────────────────────────────────────────
// Sets document.title to "<page> -- <site>" (or just <site> on the home page).
// Pass a falsy `page` for the home page.

export function formatPageTitle(page: string | null | undefined, site: string): string {
  return page ? page + ' — ' + site : site
}

export function setPageTitle(page: string | null | undefined, site: string): void {
  if (typeof document !== 'undefined') document.title = formatPageTitle(page, site)
}

// React hook form: re-applies on change.
export function usePageTitle(page: string | null | undefined, site: string): void {
  useEffect(function() {
    setPageTitle(page, site)
  }, [page, site])
}
