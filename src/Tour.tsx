import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export interface TourStep {
  path: string
  selector: string
  title: string
  body: string
}

interface TourProps {
  steps: TourStep[]
  storageKey: string
  autoStart?: boolean
}

interface Rect { top: number; left: number; width: number; height: number }

function lsGet(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function lsSet(k: string, v: string): void { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

export function Tour({ steps, storageKey, autoStart = true }: TourProps) {
  const nav = useNavigate()
  const loc = useLocation()
  const [step, setStep] = useState(-1)
  const [rect, setRect] = useState<Rect | null>(null)

  function startTour() {
    setStep(0)
  }

  useEffect(function () {
    if (!autoStart) return
    if (lsGet(storageKey + '_done') || lsGet(storageKey + '_started')) return
    lsSet(storageKey + '_started', '1')
    const t = setTimeout(startTour, 600)
    return function () { clearTimeout(t) }
  }, [storageKey, autoStart])

  useEffect(function () {
    const handler = function () { startTour() }
    window.addEventListener(storageKey + ':tour', handler)
    return function () { window.removeEventListener(storageKey + ':tour', handler) }
  }, [storageKey])

  useEffect(function () {
    if (step < 0) return
    const s = steps[step]
    if (!s) { setStep(-1); lsSet(storageKey + '_done', '1'); return }
    if (loc.pathname !== s.path) { nav(s.path); return }
    const t = setTimeout(function () {
      const el = document.querySelector(s.selector) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        const r = el.getBoundingClientRect()
        setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height })
      } else {
        setRect(null)
      }
    }, 350)
    return function () { clearTimeout(t) }
  }, [step, loc.pathname, steps, storageKey, nav])

  function skip() { setStep(-1); lsSet(storageKey + '_done', '1') }
  function next() { setStep(step + 1) }

  const s = step >= 0 ? steps[step] : null

  if (!s) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 91, background: 'rgba(0,0,0,.45)', pointerEvents: 'none' }} />
      {rect ? (
        <div style={{
          position: 'absolute',
          top: rect.top - 6, left: rect.left - 6,
          width: rect.width + 12, height: rect.height + 12,
          zIndex: 92, borderRadius: 12,
          boxShadow: '0 0 0 4px var(--accent), 0 0 0 9999px rgba(0,0,0,.45)',
          pointerEvents: 'none',
        }} />
      ) : null}
      <div className="sm-card" style={{ position: 'fixed', zIndex: 93, left: '50%', transform: 'translateX(-50%)', bottom: 24, maxWidth: 440, width: 'calc(100% - 32px)' }}>
        <div className="sm-card-body">
          <div className="sm-label">Tour {step + 1} of {steps.length}</div>
          <div className="sm-card-title" style={{ marginBottom: 6 }}>{s.title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>{s.body}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="sm-btn sm-btn-secondary sm-btn-sm" onClick={skip}>Skip</button>
            <button className="sm-btn sm-btn-primary sm-btn-sm" onClick={next}>
              {step + 1 < steps.length ? 'Next' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function triggerTour(storageKey: string) {
  window.dispatchEvent(new CustomEvent(storageKey + ':tour'))
}
