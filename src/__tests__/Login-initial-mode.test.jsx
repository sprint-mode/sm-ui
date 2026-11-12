// src/__tests__/Login-initial-mode.test.jsx
// FEAT-5737: Login can open on its sign-up form via initialMode
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Login from '../Login.tsx'

vi.mock('../usePortalConfig.jsx', function() {
  return {
    usePortalConfig: function() { return { config: null } },
  }
})

vi.mock('../dark-mode', function() {
  return {
    isDarkMode: function() { return false },
    themedMarkFromLogoUrl: function() { return null },
    applyResolvedThemeAttr: function() {},
  }
})

vi.mock('@simplewebauthn/browser', function() {
  return {
    startAuthentication: vi.fn().mockResolvedValue({ id: 'cred_id', response: {} }),
    startRegistration: vi.fn().mockResolvedValue({ id: 'cred_id', response: {} }),
  }
})

var SIGNUP = 'signup=true&product=raise'

function renderLogin(props) {
  return render(<Login authBase="https://api.sprintmode.ai" {...props} />)
}

beforeEach(function() {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(function() {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Login — initialMode (FEAT-5737)', function() {
  it('opens on the sign-up fields when initialMode is "signup" and signupParams is set', function() {
    renderLogin({ signupParams: SIGNUP, initialMode: 'signup' })
    expect(screen.getByLabelText('First name')).toBeTruthy()
    expect(screen.getByLabelText('Last name')).toBeTruthy()
    expect(screen.getByLabelText(/Company name/)).toBeTruthy()
  })

  it('opens on the sign-in form when signupParams is set but initialMode is not', function() {
    renderLogin({ signupParams: SIGNUP })
    expect(screen.queryByLabelText('First name')).toBeNull()
    expect(screen.getByText('Create an account')).toBeTruthy()
  })

  it('opens on the sign-in form when initialMode is "signup" but signupParams is missing', function() {
    renderLogin({ initialMode: 'signup' })
    expect(screen.queryByLabelText('First name')).toBeNull()
    expect(screen.queryByText('Create an account')).toBeNull()
  })

  it('still toggles from the sign-up start to sign-in', function() {
    renderLogin({ signupParams: SIGNUP, initialMode: 'signup' })
    expect(screen.getByLabelText('First name')).toBeTruthy()
    fireEvent.click(screen.getByText('Sign in', { selector: 'a' }))
    expect(screen.queryByLabelText('First name')).toBeNull()
    expect(screen.getByText('Create an account')).toBeTruthy()
  })
})
