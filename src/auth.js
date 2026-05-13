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
  } catch (e) { return null }
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
