// bug-4086-support-widget-ack.test.jsx -- BUG-4086 (BUG-3376 done-when 2)
//
// Submitting a support ticket shows an inline acknowledgement carrying the
// request reference (request_id from POST /support/thread), the same reference
// appears on the ticket row in My tickets and in the ticket detail, and a
// failure keeps the form contents and shows the error inline. No window.alert
// on any path.

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PortalSupportWidget } from '../PortalSupportWidget.tsx'

var NEW_THREAD = 'ct_new0000000000001'
var NEW_REQUEST = 'csr_new000000000001'

function jsonResponse(body, status) {
  return Promise.resolve({
    ok: status < 400,
    status: status,
    json: function() { return Promise.resolve(body) },
  })
}

// Routes the widget's fetches. `post` decides what POST /support/thread does.
function installFetch(opts) {
  opts = opts || {}
  var listRows = opts.listRows || [
    // The row the widget just created: the list endpoint carries no request_id.
    { id: NEW_THREAD, subject: 'Export is empty', status: 'active', request_status: 'open', updated_at: '2026-09-21T06:00:00Z' },
    // An older row where the server already returns request_id.
    { id: 'ct_old0000000000001', request_id: 'csr_old000000000001', subject: 'Login loop', status: 'resolved', updated_at: '2026-09-10T06:00:00Z' },
    // An older row with neither: falls back to the thread id.
    { id: 'ct_bare000000000001', subject: 'Billing question', status: 'active', updated_at: '2026-09-01T06:00:00Z' },
  ]
  var calls = []
  var fetchMock = vi.fn(function(url, init) {
    var method = (init && init.method) || 'GET'
    calls.push({ url: url, method: method, body: init && init.body })
    if (url.indexOf('/config') !== -1) return jsonResponse({ ok: true, data: { chatbot: 0 } }, 200)
    if (method === 'POST' && url.indexOf('/support/thread') !== -1) {
      if (opts.post === 'reject') return Promise.reject(new Error('network down'))
      if (opts.post === 'fail') return jsonResponse({ ok: false, error: 'subject and body are required' }, 400)
      return jsonResponse({ ok: true, data: { thread_id: NEW_THREAD, request_id: NEW_REQUEST } }, 201)
    }
    if (url.indexOf('/support/threads/') !== -1) {
      var id = url.split('/support/threads/')[1]
      return jsonResponse({ ok: true, data: {
        thread: { id: id, status: 'active', purpose: 'support' },
        messages: [
          { id: 'cm_1', role: 'user', content: '**Export is empty**\n\nThe CSV download has headers only.', created_at: '2026-09-21T06:00:00Z' },
          { id: 'cm_2', role: 'assistant', content: 'Looking into it now.', created_at: '2026-09-21T06:05:00Z' },
        ],
      } }, 200)
    }
    if (url.indexOf('/support/threads') !== -1) return jsonResponse({ ok: true, data: listRows }, 200)
    return jsonResponse({ ok: false, error: 'unexpected ' + url }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetch: fetchMock, calls: calls }
}

function renderWidget() {
  return render(<PortalSupportWidget subdomain="signal" apiBase="" embedded initialTab="form" />)
}

async function fillAndSubmit() {
  var subject = await screen.findByPlaceholderText('Brief description')
  var body = screen.getByPlaceholderText("Tell us what's going on...")
  fireEvent.change(subject, { target: { value: 'Export is empty' } })
  fireEvent.change(body, { target: { value: 'The CSV download has headers only.' } })
  fireEvent.click(screen.getByText('Submit ticket'))
}

describe('BUG-4086 support widget acknowledgement', function() {
  var alertSpy
  beforeEach(function() {
    alertSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)
  })
  afterEach(function() {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-theme')
  })

  ;['light', 'dark'].forEach(function(theme) {
    it('shows an inline acknowledgement with the request reference and switches to My tickets (' + theme + ')', async function() {
      document.documentElement.setAttribute('data-theme', theme)
      var f = installFetch()
      renderWidget()
      await fillAndSubmit()

      var ack = await screen.findByTestId('sm-support-ack')
      expect(ack).toHaveTextContent('Your ticket was received.')
      expect(screen.getByTestId('sm-support-ack-ref')).toHaveTextContent(NEW_REQUEST)
      expect(ack.getAttribute('role')).toBe('status')
      expect(alertSpy).not.toHaveBeenCalled()

      // The POST carried the form contents and the list reloaded afterwards.
      var post = f.calls.filter(function(c) { return c.method === 'POST' })[0]
      expect(JSON.parse(post.body)).toEqual({ subject: 'Export is empty', message: 'The CSV download has headers only.', category: 'general' })
      expect(f.calls.some(function(c) { return c.method === 'GET' && /\/support\/threads$/.test(c.url) })).toBe(true)

      // The same reference is on the new ticket's row; other rows show what the
      // server gave them, or the thread id when it gave nothing.
      var refs = await screen.findAllByTestId('sm-support-row-ref')
      var texts = refs.map(function(el) { return el.textContent })
      expect(texts).toEqual([NEW_REQUEST, 'csr_old000000000001', 'ct_bare000000000001'])

      // The form was cleared for the next ticket.
      fireEvent.click(screen.getByText('New ticket'))
      expect(screen.getByPlaceholderText('Brief description').value).toBe('')
      expect(screen.getByPlaceholderText("Tell us what's going on...").value).toBe('')
    })
  })

  it('keeps the form contents and shows the server error inline on a non-ok response', async function() {
    installFetch({ post: 'fail' })
    renderWidget()
    await fillAndSubmit()

    var err = await screen.findByTestId('sm-support-error')
    expect(err).toHaveTextContent('subject and body are required')
    expect(err.getAttribute('role')).toBe('alert')
    expect(alertSpy).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Brief description').value).toBe('Export is empty')
    expect(screen.getByPlaceholderText("Tell us what's going on...").value).toBe('The CSV download has headers only.')
    expect(screen.queryByTestId('sm-support-ack')).toBeNull()
  })

  it('keeps the form contents and shows a connection error inline when the request fails', async function() {
    installFetch({ post: 'reject' })
    renderWidget()
    await fillAndSubmit()

    var err = await screen.findByTestId('sm-support-error')
    expect(err).toHaveTextContent('Connection error')
    expect(alertSpy).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Brief description').value).toBe('Export is empty')
    expect(screen.getByText('Submit ticket')).not.toBeDisabled()
  })

  it('shows the reference and the messages in the ticket detail', async function() {
    installFetch()
    renderWidget()
    await fillAndSubmit()
    await screen.findByTestId('sm-support-ack')

    var rows = await screen.findAllByTestId('sm-support-row')
    fireEvent.click(rows[0])

    var detail = await screen.findByTestId('sm-support-detail')
    expect(screen.getByTestId('sm-support-detail-ref')).toHaveTextContent(NEW_REQUEST)
    await waitFor(function() {
      expect(within(detail).getByText(/The CSV download has headers only/)).toBeInTheDocument()
    })
    // Markdown bold markers from the stored first message are not shown.
    expect(within(detail).queryByText(/\*\*/)).toBeNull()
    expect(within(detail).getByText('Looking into it now.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('< Back to My tickets'))
    expect(await screen.findAllByTestId('sm-support-row')).toHaveLength(3)
  })

  it('shows the reference the server returns on rows after a fresh load', async function() {
    installFetch({ listRows: [
      { id: 'ct_a', request_id: 'csr_a', subject: 'A', status: 'active' },
      { id: 'ct_b', subject: 'B', status: 'active' },
    ] })
    renderWidget()
    fireEvent.click(await screen.findByText('My tickets'))
    var refs = await screen.findAllByTestId('sm-support-row-ref')
    expect(refs.map(function(el) { return el.textContent })).toEqual(['csr_a', 'ct_b'])
    expect(screen.queryByTestId('sm-support-ack')).toBeNull()
  })
})
