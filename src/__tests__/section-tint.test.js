// src/__tests__/section-tint.test.js
// BUG-4588: the section icon tint must be a valid CSS colour for a token as
// well as a hex, and it must keep the 12% alpha the old hex suffix gave.
import { describe, expect, it } from 'vitest'
import { sectionTint } from '../Layout.tsx'

const VALID_COLOR_MIX = /^color-mix\(in srgb, (.+) 12%, transparent\)$/

describe('sectionTint (BUG-4588)', () => {
  it('a token colour gives a valid color-mix() tint, never a hex suffix', () => {
    const tint = sectionTint('var(--accent)')
    expect(tint).toMatch(VALID_COLOR_MIX)
    expect(tint.match(VALID_COLOR_MIX)[1]).toBe('var(--accent)')
    expect(tint).not.toContain(')1f')
  })

  it('a hex colour keeps the same 12% alpha the old "1f" suffix gave', () => {
    // 0x1f / 255 = 0.1216, which is the 12% mix.
    expect(Math.round((0x1f / 255) * 100)).toBe(12)
    expect(sectionTint('#2362ea')).toBe('color-mix(in srgb, #2362ea 12%, transparent)')
  })

  it('an hsl() colour goes through the same path instead of a string rewrite', () => {
    expect(sectionTint('hsl(35, 79%, 57%)')).toBe('color-mix(in srgb, hsl(35, 79%, 57%) 12%, transparent)')
  })
})
