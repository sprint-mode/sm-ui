// Control's #406 review Minors plus the BUG-4926 follow-up:
// 1. theme-core.css no longer imports Google Fonts for every portal; the fonts load only when
//    the sm-core look is on (applySmLook, or the Layout for a look set in index.html).
// 2. The Layout's look prop effect is tested.
// 3. The user menu with Notification Settings hidden draws one rule under the identity block,
//    not two.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Layout, UserMenu, applySmLook, SM_CORE_FONTS_HREF } from '../index.ts'

function reset() {
  document.documentElement.removeAttribute('data-sm-look')
  document.querySelectorAll('link[data-sm-look-fonts]').forEach(function(l) { l.remove() })
}
const fontLinks = function() { return document.querySelectorAll('link[data-sm-look-fonts]') }
const session = { ok: true, name: 'Pat Example', email: 'pat@example.com', my_roles: [{ role: 'admin', role_type: 'admin', role_display_name: 'Admin' }] }

beforeEach(function() {
  reset()
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401, json: function() { return Promise.resolve({ ok: false }) } })
})
afterEach(function() { cleanup(); vi.restoreAllMocks(); reset() })

describe('theme-core.css fonts', function() {
  it('has no remote @import, so portals without the look load no fonts', function() {
    const css = readFileSync(resolve(process.cwd(), 'src/theme-core.css'), 'utf8')
    expect(/@import\s+url\(\s*['"]?https?:/.test(css)).toBe(false)
  })
  it('applySmLook adds the font stylesheet once', function() {
    applySmLook('sm-core')
    applySmLook('sm-core')
    expect(fontLinks().length).toBe(1)
    expect(fontLinks()[0].getAttribute('href')).toBe(SM_CORE_FONTS_HREF)
  })
  it('an unknown look adds nothing', function() {
    applySmLook('nope')
    expect(document.documentElement.getAttribute('data-sm-look')).toBeNull()
    expect(fontLinks().length).toBe(0)
  })
})

function shell(props) {
  return render(<MemoryRouter><Layout session={session} navConfig={[]} {...props}><p>page</p></Layout></MemoryRouter>)
}

describe('Layout look prop', function() {
  it('look="sm-core" turns the look on and loads its fonts', async function() {
    await act(async function() { shell({ look: 'sm-core' }) })
    expect(document.documentElement.getAttribute('data-sm-look')).toBe('sm-core')
    expect(fontLinks().length).toBe(1)
  })
  it('no look prop and no attribute: nothing changes', async function() {
    await act(async function() { shell({}) })
    expect(document.documentElement.getAttribute('data-sm-look')).toBeNull()
    expect(fontLinks().length).toBe(0)
  })
  it('look set in index.html: the Layout still loads its fonts', async function() {
    document.documentElement.setAttribute('data-sm-look', 'sm-core')
    await act(async function() { shell({}) })
    expect(fontLinks().length).toBe(1)
  })
})

function rules() {
  // the menu's dividers: the identity block's bottom border and the switcher's 1px rules
  const menu = screen.getByText('Sign out').parentElement
  const ident = menu.firstElementChild
  let n = ident.style.borderBottom ? 1 : 0
  menu.querySelectorAll('div').forEach(function(d) { if (d.style.height === '1px') n++ })
  return { n, firstAfterIdentity: ident.nextElementSibling }
}

describe('UserMenu dividers', function() {
  async function open(props) {
    await act(async function() { render(<UserMenu session={session} logoutHref="/api/auth/logout" portalSubdomain="website" {...props} />) })
    await act(async function() { fireEvent.click(screen.getAllByRole('button')[0]) })
  }
  it('Notification Settings hidden: no rule right under the identity block', async function() {
    await open({ notificationSettingsHref: null })
    const r = rules()
    expect(r.firstAfterIdentity.style.height).not.toBe('1px')
  })
  it('Notification Settings shown: the switcher keeps its rule (unchanged)', async function() {
    await open({})
    const hidden = rules().n
    cleanup()
    await open({ notificationSettingsHref: null })
    expect(rules().n).toBe(hidden - 1)
  })
})
