// src/__tests__/section-tint.test.jsx
// BUG-4588: the section icon tile's background must be a valid CSS colour for
// a token as well as a hex (it used to be the colour string plus "1f", which
// made var(--accent), the default, invalid), keep the 12% alpha, and stay
// transparent in dark mode. Tested on the rendered tile, not only the helper.
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SidebarSection, sectionTint } from '../Layout.tsx'

var darkMode = { value: false }
vi.mock('../dark-mode', function() {
  return {
    isDarkMode: function() { return darkMode.value },
    getThemedMarkUrl: function() { return null },
    themedMarkFromLogoUrl: function() { return null },
    applyResolvedThemeAttr: function() {},
  }
})

vi.mock('../usePortalConfig.jsx', function() {
  return { usePortalConfig: function() { return { config: null } } }
})

function tileBackground(props) {
  var out = render(
    <MemoryRouter>
      <SidebarSection
        label="Section"
        sectionIcon={<span data-testid="icon" />}
        items={[{ to: '/x', label: 'X' }]}
        color="var(--accent)"
        tint="var(--accent-10)"
        {...props}
      />
    </MemoryRouter>,
  )
  var tile = out.container.querySelector('.ps-section-icon')
  expect(tile).not.toBeNull()
  var bg = tile.style.background || tile.style.backgroundColor
  out.unmount()
  return bg
}

describe('section icon tile (BUG-4588)', () => {
  beforeEach(() => { darkMode.value = false })

  it('a token sectionColor renders a valid color-mix() tile, never a hex suffix', () => {
    var bg = tileBackground({ sectionColor: 'var(--accent)' })
    expect(bg).toBe('color-mix(in srgb, var(--accent) 12%, transparent)')
    expect(bg).not.toContain(')1f')
  })

  it('a hex sectionColor keeps the 12% alpha the old "1f" suffix gave', () => {
    expect(Math.round((0x1f / 255) * 100)).toBe(12)
    // jsdom normalises the hex inside color-mix() to rgb(); the mix and alpha are what matter.
    expect(tileBackground({ sectionColor: '#2362ea' })).toMatch(/^color-mix\(in srgb, (#2362ea|rgb\(35, 98, 234\)) 12%, transparent\)$/)
  })

  it('no sectionColor: the default colour gives a valid tile in light mode', () => {
    expect(tileBackground({})).toBe('color-mix(in srgb, var(--accent) 12%, transparent)')
  })

  it('no sectionColor: the tile is transparent in dark mode', () => {
    darkMode.value = true
    expect(tileBackground({})).toBe('transparent')
  })

  it('sectionTint: hsl() goes through the same path instead of a string rewrite', () => {
    expect(sectionTint('hsl(35, 79%, 57%)')).toBe('color-mix(in srgb, hsl(35, 79%, 57%) 12%, transparent)')
  })
})
