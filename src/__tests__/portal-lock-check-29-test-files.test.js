// @vitest-environment node
//
// BUG-4589: check 29 (no-non-spine-auth-calls) skips test files. A test that
// passes the portal's own host through its middleware is not a browser-side
// auth call; app code under pages/ still counts.

import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isTestFile, runChecks } from '../../bin/sm-portal-lock.mjs'
import { appendToFile, cleanup, cloneFixture, findResult, loadStandard } from './portal-lock-helpers.js'

const standard = loadStandard()
const AUTH_URL = "fetch('https://feat-x.acme.pages.dev/api/auth/me')\n"

describe('check 29 skips test files (BUG-4589)', () => {
  let dir

  beforeEach(() => {
    dir = cloneFixture()
  })

  afterEach(() => {
    cleanup(dir)
  })

  it('isTestFile: __tests__/, test/, tests/ and *.test.* or *.spec.* names are tests; pages/ is not', () => {
    expect(isTestFile('src/__tests__/preview-api.test.js')).toBe(true)
    expect(isTestFile('tests/root-mount.test.jsx')).toBe(true)
    expect(isTestFile('workers/mcp/test/mcp.test.mjs')).toBe(true)
    expect(isTestFile('src/tests/portal-registry-raise.test.ts')).toBe(true)
    expect(isTestFile('src/App.spec.tsx')).toBe(true)
    expect(isTestFile('pages/App.jsx')).toBe(false)
    expect(isTestFile('src/latest-news.tsx')).toBe(false)
    expect(isTestFile('functions/_middleware.js')).toBe(false)
  })

  it('an auth URL in a test file does not count', () => {
    appendToFile(join(dir, 'src', '__tests__', 'preview-api.test.js'), AUTH_URL)
    const results = runChecks(dir, standard, {})
    expect(findResult(results, 'no-non-spine-auth-calls').status).toBe('pass')
  })

  it('the same URL in pages/ still counts', () => {
    appendToFile(join(dir, 'pages', 'RogueAuth.jsx'), AUTH_URL)
    const results = runChecks(dir, standard, {})
    const r = findResult(results, 'no-non-spine-auth-calls')
    expect(r.status).toBe('deviation')
    expect(r.found).toContain('pages/RogueAuth.jsx')
  })
})
