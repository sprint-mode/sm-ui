// FEAT-4168: Layout's header user menu is exported as UserMenu so a public site can show the
// same signed-in menu outside Layout.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { UserMenu } from '../index.ts'

afterEach(function() { cleanup(); vi.restoreAllMocks() })

describe('UserMenu export', function() {
  it('renders outside Layout and opens to a Sign out link', function() {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, json: function() { return Promise.resolve({ ok: false }) } })
    render(<UserMenu session={{ ok: true, name: 'Pat Example', email: 'pat@example.com' }} logoutHref="/api/auth/logout" />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    const out = screen.getByText('Sign out')
    expect(out.getAttribute('href')).toBe('/api/auth/logout')
  })
})
