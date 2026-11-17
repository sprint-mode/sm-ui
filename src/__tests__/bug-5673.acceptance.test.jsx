// BUG-5673: the search palette (CmdK) keyed each row by its link, so rows that
// share `to` collided and React kept rows from an earlier search. These tests
// pin the expected behavior (S1-S3) and the behavior that must not change (S4-S7).
// Scenarios: specs/changes/bug-5673/spec.md
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { CmdK } from '../Layout.tsx'

var NI_RESULTS = {
  items: [
    { label: 'Daniel Zacharias', to: '/people', section: 'People' },
    { label: 'Nina Ortiz', to: '/people', section: 'People' },
  ],
  total: 2,
}
var NIK_RESULTS = {
  items: [{ label: 'Nikola Dulovic', to: '/people/nikola', section: 'People' }],
  total: 1,
}
var WAIT = { timeout: 3000 }

beforeEach(function() { localStorage.clear() })
afterEach(function() { cleanup(); vi.restoreAllMocks(); localStorage.clear() })

function onSearch(query) {
  if (query === 'Ni') return Promise.resolve(NI_RESULTS)
  if (query === 'Nik') return Promise.resolve(NIK_RESULTS)
  return Promise.resolve({ items: [], total: 0 })
}

function openPalette(props) {
  var onClose = vi.fn()
  var onNavigate = vi.fn()
  var view = render(<CmdK open={true} onClose={onClose} onNavigate={onNavigate} {...props} />)
  return { onClose: onClose, onNavigate: onNavigate, container: view.container }
}

function rows(container) {
  return Array.prototype.slice.call(container.querySelectorAll('a'))
}

function rowTexts(container) {
  return rows(container).map(function(a) { return a.textContent })
}

function typeQuery(value) {
  fireEvent.change(screen.getByPlaceholderText('Jump to...'), { target: { value: value } })
}

async function searchNi() {
  var palette = openPalette({ onSearch: onSearch })
  typeQuery('Ni')
  await waitFor(function() { expect(screen.getByText('2 items')).toBeTruthy() }, WAIT)
  return palette
}

async function searchNiThenNik() {
  var palette = await searchNi()
  typeQuery('Nik')
  await waitFor(function() { expect(screen.getByText('1 items')).toBeTruthy() }, WAIT)
  return palette
}

describe('BUG-5673 search palette rows that share a link', function() {
  it('[bug-5673 S3] rows that share a link raise no duplicate-key warning', async function() {
    var errorSpy = vi.spyOn(console, 'error').mockImplementation(function() {})
    await searchNi()
    var duplicateKeyMessages = errorSpy.mock.calls
      .map(function(args) { return args.map(String).join(' ') })
      .filter(function(message) { return message.indexOf('Encountered two children with the same key') !== -1 })
    expect(duplicateKeyMessages).toEqual([])
  })

  it('[bug-5673 S1] rows from an earlier search are gone after the results change', async function() {
    vi.spyOn(console, 'error').mockImplementation(function() {})
    var palette = await searchNiThenNik()
    var texts = rowTexts(palette.container)
    expect(texts).toHaveLength(1)
    expect(texts[0]).toContain('Nikola Dulovic')
    expect(palette.container.textContent).not.toContain('Daniel Zacharias')
    expect(palette.container.textContent).not.toContain('Nina Ortiz')
  })

  it('[bug-5673 S2] the number of rows equals the footer count', async function() {
    vi.spyOn(console, 'error').mockImplementation(function() {})
    var palette = await searchNiThenNik()
    expect(screen.getByText('1 items')).toBeTruthy()
    expect(rows(palette.container)).toHaveLength(1)
  })

  it('[bug-5673 S4] (guard) both rows that share a link are drawn', async function() {
    vi.spyOn(console, 'error').mockImplementation(function() {})
    var palette = await searchNi()
    var texts = rowTexts(palette.container)
    expect(texts).toHaveLength(2)
    expect(texts[0]).toContain('Daniel Zacharias')
    expect(texts[1]).toContain('Nina Ortiz')
    expect(screen.getByText('2 items')).toBeTruthy()
  })

  it('[bug-5673 S5] (guard) a click on a row that shares a link still navigates', async function() {
    vi.spyOn(console, 'error').mockImplementation(function() {})
    var palette = await searchNi()
    var nina = rows(palette.container).filter(function(a) { return a.textContent.indexOf('Nina Ortiz') !== -1 })[0]
    fireEvent.click(nina)
    expect(palette.onClose).toHaveBeenCalledTimes(1)
    expect(palette.onNavigate).toHaveBeenCalledTimes(1)
    expect(palette.onNavigate).toHaveBeenCalledWith('/people')
  })
})

describe('BUG-5673 search palette behavior that must not change', function() {
  it('[bug-5673 S6] (guard) static items still filter by the query', function() {
    var palette = openPalette({
      items: [
        { label: 'Dashboard', to: '/', section: 'Pages' },
        { label: 'Contracts', to: '/finance/contracts', section: 'Finance' },
      ],
    })
    typeQuery('contr')
    var texts = rowTexts(palette.container)
    expect(texts).toHaveLength(1)
    expect(texts[0]).toContain('Contracts')
    expect(screen.getByText('1 items')).toBeTruthy()
  })

  it('[bug-5673 S7] (guard) recent rows still show when the query is empty', function() {
    localStorage.setItem('cmdk-test-recent', JSON.stringify([
      { label: 'Contracts', to: '/finance/contracts' },
      { label: 'Dashboard', to: '/' },
    ]))
    var palette = openPalette({ recentKey: 'cmdk-test-recent' })
    expect(screen.getByText('Recent')).toBeTruthy()
    var texts = rowTexts(palette.container)
    expect(texts).toEqual(['Contracts', 'Dashboard'])
    expect(screen.getByText('2 items')).toBeTruthy()
  })
})
