var SESSION_CACHE = null

export async function getSession() {
  if (SESSION_CACHE) return SESSION_CACHE
  try {
    var res = await fetch('/api/auth/me', { credentials: 'include' })
    var data = await res.json()
    if (data && data.ok) {
      SESSION_CACHE = data
      return data
    }
  } catch (_e) { /* fall through */ }
  return null
}

export function clearSession() {
  SESSION_CACHE = null
}

export async function api(path, opts) {
  var options = opts || {}
  var config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {},
  }
  if (options.body) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(options.body)
  }
  try {
    var res = await fetch(path, config)
    return await res.json()
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function formatCurrency(cents) {
  if (cents == null) return '$0'
  var dollars = typeof cents === 'number' && cents > 100 ? cents / 100 : cents
  return '$' + Number(dollars).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatDate(str) {
  if (!str) return '--'
  try {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (_e) { return str }
}

export function formatRelative(str) {
  if (!str) return ''
  try {
    var diff = Date.now() - new Date(str).getTime()
    var mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm ago'
    var hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs + 'h ago'
    var days = Math.floor(hrs / 24)
    return days + 'd ago'
  } catch (_e) { return str }
}

export function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
