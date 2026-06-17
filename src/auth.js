// @sprintmode/ui/auth — Worker-side auth helpers
// These run in Cloudflare Workers (server-side), not in the browser.
// Extracted from sprint-mode-clients/_worker.js

/**
 * Sign a JWT with HMAC-SHA256
 * @param {Object} payload - JWT payload
 * @param {string} secret - HMAC secret
 * @returns {Promise<string>} Signed JWT string
 */
export async function signJWT(payload, secret) {
  var header = { alg: 'HS256', typ: 'JWT' }
  var enc = new TextEncoder()
  var key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  var h = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  var p = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  var data = h + '.' + p
  var sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  var s = btoa(String.fromCharCode.apply(null, new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return data + '.' + s
}

/**
 * Verify a JWT with HMAC-SHA256
 * @param {string} token - JWT string
 * @param {string} secret - HMAC secret
 * @returns {Promise<Object|null>} Decoded payload or null if invalid/expired
 */
export async function verifyJWT(token, secret) {
  try {
    var parts = token.split('.')
    if (parts.length !== 3) return null
    var enc = new TextEncoder()
    var key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    function pad(s) { return s + '==='.slice((s.length + 3) % 4) }
    var sig = Uint8Array.from(atob(pad(parts[2].replace(/-/g, '+').replace(/_/g, '/'))), function(c) { return c.charCodeAt(0) })
    var valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(parts[0] + '.' + parts[1]))
    if (!valid) return null
    var payload = JSON.parse(atob(pad(parts[1].replace(/-/g, '+').replace(/_/g, '/'))))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (_e) { return null }
}

/**
 * Extract session token from sm_client cookie
 * @param {Request} request - Incoming request
 * @returns {string|null} Token value or null
 */
export function getSession(request) {
  var cookie = request.headers.get('Cookie') || ''
  var match = cookie.match(/sm_client=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Full auth check: extract cookie, verify JWT, return session or null
 * @param {Request} request - Incoming request
 * @param {Object} env - Worker env (needs JWT_SECRET)
 * @returns {Promise<Object|null>} Decoded session payload or null
 */
export async function requireAuth(request, env) {
  var token = getSession(request)
  if (!token) return null
  return await verifyJWT(token, env.JWT_SECRET)
}

/**
 * Generate a random 48-character token for magic links
 * @returns {string} Random alphanumeric token
 */
export function generateToken() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  var token = ''
  var bytes = crypto.getRandomValues(new Uint8Array(48))
  for (var i = 0; i < 48; i++) token += chars[bytes[i] % chars.length]
  return token
}

/**
 * Generate a prefixed ID (e.g. "ct_a1b2c3d4e5f6g7h8")
 * @param {string} prefix - ID prefix
 * @returns {string} Prefixed random hex ID
 */
export function generateId(prefix) {
  var hex = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(function(b) { return b.toString(16).padStart(2, '0') }).join('')
  return prefix + '_' + hex
}

// ═══ SM API CLIENT ═══
// This is the ONLY approved way for portal workers to call the SM API.
// SM API requires the X-SM-Platform header on all CF-Access service token calls.
// Hand-rolled fetch() with just CF-Access headers will be rejected with 403.

var SM_UI_VERSION = '0.1.0'
var SM_API_DEFAULT = 'https://api.sprintmode.ai'

/**
 * Create an SM API client for portal workers.
 * This adds the required X-SM-Platform header automatically.
 * SM API will reject portal calls without this header.
 *
 * @param {Object} env - Worker env (needs SM_API_CLIENT_ID, SM_API_CLIENT_SECRET)
 * @param {Object} [opts] - Options
 * @param {string} [opts.baseUrl] - Override API base URL (default: https://api.sprintmode.ai)
 * @returns {Object} Client with get/post/patch/del methods
 *
 * @example
 * import { createSmApiClient } from '@nomadahq/sm-ui/auth'
 * var smApi = createSmApiClient(env)
 * var company = await smApi.get('/api/companies/co_123')
 * var contact = await smApi.post('/api/contacts', { email: 'a@b.com' })
 * await smApi.patch('/api/contacts/ct_123', { full_name: 'Updated' })
 */
export function createSmApiClient(env, opts) {
  var baseUrl = (opts && opts.baseUrl) || env.SM_API_URL || SM_API_DEFAULT

  async function request(method, path, body, extraHeaders) {
    var headers = {
      'Content-Type': 'application/json',
      'X-SM-Platform': 'sm-ui/' + SM_UI_VERSION,
      'CF-Access-Client-Id': env.SM_API_CLIENT_ID || '',
      'CF-Access-Client-Secret': env.SM_API_CLIENT_SECRET || ''
    }
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(function(k) { headers[k] = extraHeaders[k] })
    }
    var fetchOpts = { method: method, headers: headers }
    if (body && method !== 'GET') fetchOpts.body = JSON.stringify(body)
    var resp = await fetch(baseUrl + path, fetchOpts)
    if (!resp.ok) {
      var text = await resp.text()
      var parsed
      try { parsed = JSON.parse(text) } catch (_e) { parsed = { ok: false, error: text } }
      parsed._status = resp.status
      return parsed
    }
    return resp.json()
  }

  return {
    get: function(path, extraHeaders) { return request('GET', path, null, extraHeaders) },
    post: function(path, body, extraHeaders) { return request('POST', path, body, extraHeaders) },
    patch: function(path, body, extraHeaders) { return request('PATCH', path, body, extraHeaders) },
    put: function(path, body, extraHeaders) { return request('PUT', path, body, extraHeaders) },
    del: function(path, extraHeaders) { return request('DELETE', path, null, extraHeaders) },
    /** Pass a browser cookie string to forward the user's session alongside service auth */
    withCookie: function(cookieStr) {
      return {
        get: function(path) { return request('GET', path, null, { 'Cookie': cookieStr }) },
        post: function(path, body) { return request('POST', path, body, { 'Cookie': cookieStr }) },
        patch: function(path, body) { return request('PATCH', path, body, { 'Cookie': cookieStr }) },
        put: function(path, body) { return request('PUT', path, body, { 'Cookie': cookieStr }) },
        del: function(path) { return request('DELETE', path, null, { 'Cookie': cookieStr }) }
      }
    }
  }
}
