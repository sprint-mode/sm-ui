// TASK-4748: the inside look switch. "sm-core" is the sprintmode.ai v2 look for the core
// product (Platform) and Studios; its rules live in theme-core.css and are all scoped to
// html[data-sm-look="sm-core"], so nothing changes until a portal turns it on.
//
// Turn it on in one of three ways (any one is enough):
//   1. index.html:    <html data-sm-look="sm-core">   no flash on first paint; preferred
//   2. Layout prop:   <Layout look="sm-core">
//   3. portal config: look: "sm-core"                  read by PortalConfigProvider

export type SmLook = 'sm-core'

export const SM_LOOKS: readonly SmLook[] = ['sm-core']

export function isSmLook(v: unknown): v is SmLook {
  return typeof v === 'string' && (SM_LOOKS as readonly string[]).indexOf(v) !== -1
}

/** Sets data-sm-look on <html>. Unknown values are ignored, and a look the portal already
 *  set in index.html is never removed. */
export function applySmLook(look: unknown): void {
  if (typeof document === 'undefined' || !isSmLook(look)) return
  document.documentElement.setAttribute('data-sm-look', look)
  loadSmLookFonts(look)
}

/** The sm-core faces (Space Grotesk, IBM Plex Mono). Only portals with the look on load them. */
export const SM_CORE_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'

/** Adds the look's font stylesheet to <head> once. Unknown looks are ignored. */
export function loadSmLookFonts(look: unknown): void {
  if (typeof document === 'undefined' || !isSmLook(look)) return
  if (document.querySelector('link[data-sm-look-fonts]')) return
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = SM_CORE_FONTS_HREF
  link.setAttribute('data-sm-look-fonts', look)
  document.head.appendChild(link)
}

/** The look in force right now, or null. */
export function currentSmLook(): SmLook | null {
  if (typeof document === 'undefined') return null
  var v = document.documentElement.getAttribute('data-sm-look')
  return isSmLook(v) ? v : null
}
