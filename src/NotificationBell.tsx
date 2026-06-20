import React, { useState, useEffect, useRef, useCallback } from 'react'

export interface Notification {
  id: string
  title: string
  body?: string
  status: 'read' | 'unread'
  priority: 'high' | 'normal' | 'low'
  action_url?: string
  action_label?: string
  created_at?: string
}

export interface NotificationBellProps {
  apiBase?: string
  onNavigate?: (url: string) => void
}

var POLL_INTERVAL = 60000

function BellIcon({ size }: { size?: number }) {
  return React.createElement('svg', {
    width: size || 18, height: size || 18, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true',
  },
    React.createElement('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    React.createElement('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })
  )
}

function CheckIcon() {
  return React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '20 6 9 17 4 12' })
  )
}

function priorityDot(priority: string) {
  var colors: Record<string, string> = { high: '#E24B4A', normal: 'var(--muted)', low: 'var(--border)' }
  var c = colors[priority] || colors['normal']
  return React.createElement('span', { style: { width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 4 } })
}

function relativeTime(isoStr: string | undefined): string {
  if (!isoStr) return ''
  var diff = Date.now() - new Date(isoStr).getTime()
  var m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm'
  var h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  return Math.floor(h / 24) + 'd'
}

export function NotificationBell(props: NotificationBellProps) {
  var apiBase = props.apiBase || ''
  var onNavigate = props.onNavigate

  var _open = useState(false); var open = _open[0]; var setOpen = _open[1]
  var _notifs = useState<Notification[]>([]); var notifs = _notifs[0]; var setNotifs = _notifs[1]
  var _unread = useState(0); var unread = _unread[0]; var setUnread = _unread[1]
  var ref = useRef<HTMLDivElement>(null)

  var fetchNotifs = useCallback(function() {
    fetch(apiBase + '/api/notifications', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(d: { ok: boolean; data?: { notifications?: Notification[]; unread_count?: number } } | null) {
        if (d && d.ok && d.data) {
          setNotifs(d.data.notifications || [])
          setUnread(d.data.unread_count || 0)
        }
      })
      .catch(function() {})
  }, [apiBase])

  useEffect(function() {
    fetchNotifs()
    var interval = setInterval(fetchNotifs, POLL_INTERVAL)
    return function() { clearInterval(interval) }
  }, [fetchNotifs])

  useEffect(function() {
    var close = function(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return function() { document.removeEventListener('mousedown', close) }
  }, [])

  function markRead(id: string) {
    fetch(apiBase + '/api/notifications/' + id + '/read', { method: 'POST', credentials: 'include' }).catch(function() {})
    setNotifs(function(prev) { return prev.map(function(n) { return n.id === id ? Object.assign({}, n, { status: 'read' as const }) : n }) })
    setUnread(function(u) { return Math.max(0, u - 1) })
  }

  function dismiss(id: string) {
    fetch(apiBase + '/api/notifications/' + id + '/dismiss', { method: 'POST', credentials: 'include' }).catch(function() {})
    setNotifs(function(prev) { return prev.filter(function(n) { return n.id !== id }) })
    setUnread(function(u) {
      var wasUnread = notifs.find(function(n) { return n.id === id && n.status === 'unread' })
      return wasUnread ? Math.max(0, u - 1) : u
    })
  }

  function markAllRead() {
    fetch(apiBase + '/api/notifications/read-all', { method: 'POST', credentials: 'include' }).catch(function() {})
    setNotifs(function(prev) { return prev.map(function(n) { return Object.assign({}, n, { status: 'read' as const }) }) })
    setUnread(0)
  }

  function handleAction(notif: Notification) {
    if (notif.status === 'unread') markRead(notif.id)
    if (notif.action_url) {
      if (onNavigate) { onNavigate(notif.action_url) }
      else { window.location.href = notif.action_url }
    }
    setOpen(false)
  }

  return React.createElement('div', { ref: ref, style: { position: 'relative' } },
    React.createElement('button', {
      onClick: function() { setOpen(function(o) { return !o }) },
      'aria-label': 'Notifications' + (unread ? ' (' + unread + ' unread)' : ''),
      style: {
        position: 'relative', width: 34, height: 34, border: '1px solid var(--border)',
        borderRadius: 7, background: 'var(--bg-card)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color .2s', flexShrink: 0, padding: 0,
        color: unread > 0 ? 'var(--accent)' : 'var(--foreground)',
      }
    },
      React.createElement(BellIcon, null),
      unread > 0 && React.createElement('span', {
        style: {
          position: 'absolute', top: -4, right: -4,
          minWidth: 16, height: 16, borderRadius: 999,
          background: 'var(--accent)', color: '#fff',
          fontSize: 10, fontWeight: 700, lineHeight: '16px',
          textAlign: 'center', padding: '0 4px',
          border: '2px solid var(--bg)',
          fontFamily: 'var(--font)',
        }
      }, unread > 99 ? '99+' : unread)
    ),

    open && React.createElement('div', {
      style: {
        position: 'absolute', right: 0, top: 42, width: 340, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        zIndex: 9999, overflow: 'hidden',
      }
    },
      React.createElement('div', {
        style: { padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
      },
        React.createElement('span', { style: { fontSize: 13, fontWeight: 600 } }, 'Notifications'),
        unread > 0 && React.createElement('button', {
          onClick: markAllRead,
          style: { fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'var(--font)' }
        }, 'Mark all read')
      ),

      React.createElement('div', { style: { maxHeight: 360, overflowY: 'auto' } },
        notifs.length === 0
          ? React.createElement('div', { style: { padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' } }, 'All caught up')
          : notifs.map(function(n) {
              var isUnread = n.status === 'unread'
              return React.createElement('div', {
                key: n.id,
                style: {
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', borderBottom: '1px solid var(--border)',
                  background: isUnread ? 'var(--accent-10)' : 'transparent',
                  transition: 'background .15s',
                }
              },
                priorityDot(n.priority),
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', {
                    style: {
                      fontSize: 13, fontWeight: isUnread ? 600 : 400,
                      color: 'var(--foreground)', cursor: n.action_url ? 'pointer' : 'default',
                      lineHeight: 1.4,
                    },
                    onClick: function() { handleAction(n) }
                  }, n.title),
                  n.body && React.createElement('div', {
                    style: { fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                  }, n.body),
                  React.createElement('div', { style: { fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 } },
                    relativeTime(n.created_at),
                    n.action_url && React.createElement('span', {
                      onClick: function() { handleAction(n) },
                      style: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }
                    }, n.action_label || 'View \u2192')
                  )
                ),
                React.createElement('button', {
                  onClick: function() { dismiss(n.id) },
                  title: 'Dismiss',
                  style: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)', opacity: 0.6, flexShrink: 0 }
                }, React.createElement(CheckIcon, null))
              )
            })
      ),

      React.createElement('div', {
        style: { padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }
      },
        React.createElement('a', {
          href: '/settings/notifications',
          style: { fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }
        }, 'Notification settings')
      )
    )
  )
}
