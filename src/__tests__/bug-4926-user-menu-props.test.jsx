// BUG-4926: two shared-menu props. notificationSettingsHref (omitted = /user/notifications as before,
// null = hidden, for sprintmode.ai) and profileLabel (default "View Profile"; PrivacyAI passes
// "Settings"). ProfileCard takes heading (default "Profile").
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { UserMenu, ProfileCard } from '../index.ts'

afterEach(function() { cleanup(); vi.restoreAllMocks() })
const session = { ok: true, name: 'Pat Example', email: 'pat@example.com' }
function open(props) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, json: function() { return Promise.resolve({ ok: false }) } })
  render(<UserMenu session={session} logoutHref="/api/auth/logout" {...props} />)
  fireEvent.click(screen.getAllByRole('button')[0])
}

describe('UserMenu notificationSettingsHref', function() {
  it('omitted: Notification Settings goes to /user/notifications (unchanged)', function() {
    open({})
    expect(screen.getByText('Notification Settings').closest('a').getAttribute('href')).toBe('/user/notifications')
  })
  it('a path: the item goes there', function() {
    open({ notificationSettingsHref: '/settings#notifications' })
    expect(screen.getByText('Notification Settings').closest('a').getAttribute('href')).toBe('/settings#notifications')
  })
  it('null: the item is hidden', function() {
    open({ notificationSettingsHref: null })
    expect(screen.queryByText('Notification Settings')).toBeNull()
    expect(screen.getByText('Sign out')).toBeTruthy()
  })
})

describe('UserMenu profileLabel', function() {
  it('default label is View Profile', function() {
    open({ profilePath: '/profile' })
    expect(screen.getByText('View Profile').getAttribute('href')).toBe('/profile')
  })
  it('PrivacyAI passes Settings', function() {
    open({ profilePath: '/settings', profileLabel: 'Settings' })
    expect(screen.queryByText('View Profile')).toBeNull()
    expect(screen.getByText('Settings').getAttribute('href')).toBe('/settings')
  })
})

describe('ProfileCard heading', function() {
  function mockProfile() {
    vi.spyOn(globalThis, 'fetch').mockImplementation(function(url) {
      var body = String(url).indexOf('/api/profile') >= 0 ? { ok: true, profile: { full_name: 'Pat Example', email: 'pat@example.com' } } : { ok: true, data: {} }
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve(body) } })
    })
  }
  it('defaults to Profile', async function() {
    mockProfile()
    render(<ProfileCard />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Profile')
  })
  it('takes Settings (PrivacyAI)', async function() {
    mockProfile()
    render(<ProfileCard heading="Settings" />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Settings')
  })
})
