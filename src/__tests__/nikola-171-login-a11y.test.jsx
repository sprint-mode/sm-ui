// Nikola 171: the sign-in email field is labelled, its error is announced and
// tied to it, and the focus ring uses the accent token rather than fixed blue.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Login from '../Login.tsx'

vi.mock('../usePortalConfig.jsx', function() {
  return { usePortalConfig: function() { return { config: null } } }
})
vi.mock('../dark-mode', function() {
  return {
    isDarkMode: function() { return false },
    themedMarkFromLogoUrl: function() { return null },
    applyResolvedThemeAttr: function() {},
  }
})
vi.mock('@simplewebauthn/browser', function() {
  return { startAuthentication: vi.fn(), startRegistration: vi.fn() }
})

beforeEach(function() { vi.stubGlobal('fetch', vi.fn()) })
afterEach(function() { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function renderLogin() {
  return render(<Login authBase="https://api.example.test" />)
}

describe('Nikola 171: Login email field accessibility', function() {
  it('the Email address label is tied to the input', function() {
    renderLogin()
    var input = screen.getByLabelText(/email address/i)
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('an error is announced (role=alert) and described on the input', async function() {
    fetch.mockResolvedValueOnce({
      json: function() { return Promise.resolve({ ok: false, error: 'No account for that email.' }) },
    })
    renderLogin()
    var input = screen.getByLabelText(/email address/i)
    fireEvent.change(input, { target: { value: 'nobody@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))
    var alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('No account for that email.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
    expect(input).toHaveAccessibleDescription('No account for that email.')
  })

  it('the focus ring uses the accent token, not --blue', function() {
    renderLogin()
    var input = screen.getByLabelText(/email address/i)
    fireEvent.focus(input)
    expect(input.style.borderColor).toBe('var(--accent)')
    expect(input.style.boxShadow).toContain('var(--accent-10)')
    expect(input.style.boxShadow).not.toContain('blue')
    fireEvent.blur(input)
    expect(input.style.borderColor).toBe('var(--border)')
  })

  it('the code field is named and its error is announced and described', async function() {
    fetch.mockResolvedValueOnce({
      json: function() { return Promise.resolve({ ok: true, redirect_url: '/' }) },
    })
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))
    var code = await screen.findByLabelText('Verification code')
    fetch.mockResolvedValueOnce({
      json: function() { return Promise.resolve({ ok: false, error: 'invalid_code' }) },
    })
    fireEvent.change(code, { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }))
    var alert = await screen.findByRole('alert')
    await waitFor(function() { expect(code).toHaveAttribute('aria-invalid', 'true') })
    expect(code.getAttribute('aria-describedby')).toBe(alert.id)
  })
})
