import React, { useState, useEffect, useCallback } from 'react'

export interface NotificationBellNavProps {
  href?: string
  apiBase?: string
  onNavigate?: (href: string) => void
  countEndpoint?: string
}

var POLL_INTERVAL = 60000

function MailboxIcon() {
  return React.createElement('svg', {
    width: 18, height: 18, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true',
  },
    React.createElement('path', { d: 'M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 7 5h10c3 0 5 2 5 4.5Z' }),
    React.createElement('polyline', { points: '2 10 12 16 22 10' })
  )
}

export function NotificationBellNav(props: NotificationBellNavProps) {
  var href = props.href || '/user/updates'
  var apiBase = props.apiBase || ''
  var onNavigate = props.onNavigate
  var countEndpoint = props.countEndpoint || '/api/notifications?count_only=true'

  var _count = useState(0); var count = _count[0]; var setCount = _count[1]

  var fetchCount = useCallback(function() {
    fetch(apiBase + countEndpoint, { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(d: { ok: boolean; data?: { unread_count?: number; count?: number } } | null) {
        if (d && d.ok) {
          setCount((d.data?.unread_count) || (d.data?.count) || 0)
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

  var isMac = typeof navigator !== 'undefined' && navigator.platform && navigator.platform.indexOf('Mac') !== -1

  return React.createElement('a', {
    href: href,
    onClick: handleClick,
    'aria-label': 'Inbox' + (count > 0 ? ' (' + count + ' new)' : ''),
    title: isMac ? 'Inbox (\u2318I)' : 'Inbox (Ctrl+I)',
    style: {
      position: 'relative', width: 34, height: 34, border: '1px solid var(--border)',
      borderRadius: 7, background: 'var(--bg-card)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color .2s', flexShrink: 0, padding: 0,
      color: 'var(--muted)',
      textDecoration: 'none',
    }
  },
    React.createElement(MailboxIcon, null),
    count > 0 && React.createElement('span', {
      style: {
        position: 'absolute', top: -6, right: -6,
        minWidth: 18, height: 18, borderRadius: 9,
        background: '#ef4444',
        color: '#fff',
        fontSize: 10, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
        border: '2px solid var(--bg, #fff)',
        lineHeight: 1,
      }
    }, count > 99 ? '99+' : String(count))
  )
}
