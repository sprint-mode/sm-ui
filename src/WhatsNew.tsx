import React, { useEffect, useState } from 'react'

export interface WhatsNewRelease {
  id: string
  title: string
  items: string[]
}

interface WhatsNewProps {
  releases: WhatsNewRelease[]
  storageKey: string
  onTour?: () => void
  tourDone?: boolean
}

function lsGet(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function lsSet(k: string, v: string): void { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

export function WhatsNew({ releases, storageKey, onTour, tourDone }: WhatsNewProps) {
  const [current, setCurrent] = useState<WhatsNewRelease | null>(null)

  useEffect(function () {
    if (!releases.length) return
    const latest = releases[0]
    const seen = lsGet(storageKey + '_seen')
    if (latest && seen !== latest.id) setCurrent(latest)
  }, [releases, storageKey])

  function dismiss() {
    if (current) lsSet(storageKey + '_seen', current.id)
    setCurrent(null)
  }

  function handleTour() {
    if (current) lsSet(storageKey + '_seen', current.id)
    setCurrent(null)
    onTour?.()
  }

  if (!current) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={dismiss}
    >
      <div
        className="sm-card"
        style={{ maxWidth: 520, width: '100%' }}
        onClick={function (e) { e.stopPropagation() }}
      >
        <div className="sm-card-body">
          <div className="sm-label">What's new</div>
          <div className="sm-card-title" style={{ marginBottom: 8 }}>{current.title}</div>
          <ul style={{ margin: '0 0 14px 18px', padding: 0, fontSize: 14, lineHeight: 1.6 }}>
            {current.items.map(function (it, i) { return <li key={i}>{it}</li> })}
          </ul>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {!tourDone && onTour ? (
              <button className="sm-btn sm-btn-secondary sm-btn-sm" onClick={handleTour}>
                Take the tour
              </button>
            ) : null}
            <button className="sm-btn sm-btn-primary sm-btn-sm" onClick={dismiss}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
