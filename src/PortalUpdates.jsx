/**
 * PortalUpdates — generic Updates page for any SM portal.
 * Calls GET /api/portal/updates (session-aware, audience resolved server-side).
 * Used by Portal Manager scaffold when the updates feature is enabled on a portal.
 *
 * Props:
 *   api         {Function}  — portal API function: (path, opts?) => Promise<any>
 *                             Same signature as useStudioApi().api or usePortalApi().api
 *   title       {string}    — page title override (default: "Updates")
 *   subtitle    {string}    — page subtitle override
 *   emptyMessage {string}   — custom empty state message
 */

import React, { useState, useEffect } from 'react'
import { UpdateAttachments } from './UpdateAttachments.jsx'

var TYPE_LABELS = {
  ai_weekly:    'AI Weekly',
  sprint_report:'Sprint Report',
  milestone:    'Milestone',
  announcement: 'Announcement',
  policy:       'Policy',
  culture:      'Culture',
  flash_update: 'Flash Update',
  board_update: 'Board Update',
  general:      'Update',
}

var TYPE_COLORS = {
  ai_weekly:    '#7c5cbf',
  sprint_report:'#7c5cbf',
  milestone:    '#3b6d11',
  announcement: '#1967d2',
  policy:       '#633806',
  culture:      '#0891b2',
  flash_update: '#d93025',
  board_update: '#1967d2',
  general:      '#6b7280',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function TypeBadge({ updateType }) {
  var label = TYPE_LABELS[updateType] || 'Update'
  var color = TYPE_COLORS[updateType] || '#6b7280'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      background: color + '18',
      color: color,
      border: '1px solid ' + color + '40',
    }}>{label}</span>
  )
}

function UpdateCard({ item, getSignedUrl }) {
  var [expanded, setExpanded] = useState(true)
  var isLong = item.body && item.body.length > 600

  return (
    <div style={{
      background: 'var(--bg-card, #fff)',
      border: '1px solid var(--border, #e5e7eb)',
      borderRadius: 'var(--radius, 8px)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground, #111)' }}>{item.title}</span>
              <TypeBadge updateType={item.update_type} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>
              {formatDate(item.published_at)}
              {item.author_name ? ' · ' + item.author_name : ''}
            </div>
          </div>
        </div>

        {item.body && (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontSize: 14, lineHeight: 1.75,
                color: 'var(--foreground, #111)',
                whiteSpace: 'pre-wrap',
                maxHeight: (!isLong || expanded) ? 'none' : 160,
                overflow: 'hidden',
              }}
            >
              {item.body}
            </div>
            {isLong && !expanded && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                background: 'linear-gradient(transparent, var(--bg-card, #fff))',
              }} />
            )}
            {isLong && (
              <button
                onClick={function() { setExpanded(function(e) { return !e }) }}
                style={{
                  marginTop: 8, fontSize: 13, color: 'var(--brand, #7c5cbf)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        <UpdateAttachments
          attachments={item.attachments}
          updateId={item.id}
          getSignedUrl={getSignedUrl}
        />
      </div>
    </div>
  )
}

export function PortalUpdates({ api, title, subtitle, emptyMessage }) {
  var [items, setItems] = useState(null)
  var [error, setError] = useState(null)

  useEffect(function() {
    if (!api) return
    api('/api/portal/updates').then(function(res) {
      setItems(res && res.data ? res.data.items || [] : [])
    }).catch(function(e) {
      setError(e.message || 'Failed to load updates')
      setItems([])
    })
  }, [api])

  function getSignedUrl(updateId, attId) {
    return api('/api/updates/' + updateId + '/attachments/' + attId + '/url')
  }

  return (
    <div style={{ maxWidth: 'var(--max-w-app, 760px)', margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground, #111)', marginBottom: 4 }}>
          {title || 'Updates'}
        </h1>
        {(subtitle) && (
          <p style={{ fontSize: 14, color: 'var(--muted, #6b7280)', margin: 0 }}>
            {subtitle || 'Communications from your Sprint Mode team'}
          </p>
        )}
      </div>

      {items === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--border, #e5e7eb)', borderTopColor: 'var(--brand, #7c5cbf)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted, #6b7280)', fontSize: 14 }}>
          {error}
        </div>
      ) : items.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 'var(--radius, 8px)',
          color: 'var(--muted, #6b7280)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No updates yet</div>
          <div style={{ fontSize: 13 }}>
            {emptyMessage || 'Updates and communications will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(function(item) {
            return <UpdateCard key={item.id} item={item} getSignedUrl={getSignedUrl} />
          })}
        </div>
      )}
    </div>
  )
}
