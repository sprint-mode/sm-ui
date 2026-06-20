import React, { useState, useEffect, useCallback } from 'react'

export interface NotificationBellNavProps {
  href?: string
  apiBase?: string
  onNavigate?: (href: string) => void
  countEndpoint?: string
}

var POLL_INTERVAL = 60000

function BellIcon() {
  return React.createElement('svg', {
    width: 18, height: 18, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true',
  },
    React.createElement('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    React.createElement('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })
  )
}

export function NotificationBellNav(props: NotificationBellNavProps) {
  var href = props.href || '/updates'
  var apiBase = props.apiBase || ''
  var onNavigate = props.onNavigate
  var countEndpoint = props.countEndpoint || '/api/notifications?count_only=true'

  var _unread = useState(0); var unread = _unread[0]; var setUnread = _unread[1]

  var fetchCount = useCallback(function() {
    fetch(apiBase + countEndpoint, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(d: { ok: boolean; data?: { unread_count?: number; count?: number } } | null) {
        if (d && d.ok) {
          setUnread((d.data?.unread_count) || (d.data?.count) || 0)
        }
      })
      .catch(function() {})
  }, [apiBase, countEndpoint])

  useEffect(function() {
    fetchCount()
    var interval = setInterval(fetchCount, POLL_INTERVAL)
    return function() { clearInterval(interval) }
  }, [fetchCount])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(href)
    }
  }

  return React.createElement('a', {
    href: href,
    onClick: handleClick,
    'aria-label': 'Notifications' + (unread ? ' (' + unread + ' unread)' : ''),
    style: {
      position: 'relative', width: 34, height: 34, border: '1px solid var(--border)',
      borderRadius: 7, background: 'var(--bg-card)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color .2s', flexShrink: 0, padding: 0,
      color: unread > 0 ? 'var(--accent)' : 'var(--foreground)',
      textDecoration: 'none',
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
  )
}
