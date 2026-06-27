import React, { useState, useEffect, useRef, useCallback, CSSProperties } from 'react'
import { UpdateAttachments } from './UpdateAttachments'

export interface BugPanelSession {
  contact_id?: string
  display_name?: string
  email?: string
}

export interface BugPanelProps {
  isAdmin?: boolean
  apiBase?: string
  product?: string
  label?: string
  session?: BugPanelSession | null
  offsetFab?: boolean
  onClose?: () => void
  visible?: boolean
}

export interface BugPanelHeaderButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export interface BugComment {
  id: string
  author_name?: string
  body?: string
  created_at?: string
}

export interface BugAttachment {
  id: string
  type: 'image' | 'file'
  filename: string
  r2_key?: string
  size?: number
  mime?: string
}

export interface Bug {
  id: string
  title: string
  description?: string
  type?: string
  product?: string
  status: string
  priority?: string
  page_url?: string
  created_at?: string
  submitted_by_name?: string
  ai_classification?: string | Record<string, unknown>
  fire_prompt?: string
  close_reason?: string
  comments?: BugComment[]
  attachments?: BugAttachment[]
}

export interface ThreadItem {
  id: string
  title: string
  body?: string
  product?: string
  thread_id?: string
  priority?: string
  status?: string
  tags?: string
  created_at?: string
}

var STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  open:        { color: 'var(--red)',    bg: 'var(--red-light)',    label: 'open' },
  in_progress: { color: 'var(--blue)',   bg: 'var(--blue-10)',      label: 'in progress' },
  closed:      { color: 'var(--muted)',  bg: 'var(--bg-subtle)',    label: 'closed' },
  // Legacy statuses (pre-migration fallback)
  triaged:     { color: 'var(--blue)',   bg: 'var(--blue-10)',      label: 'in progress' },
  fixing:      { color: 'var(--blue)',   bg: 'var(--blue-10)',      label: 'in progress' },
  qa:          { color: 'var(--green)',  bg: 'var(--green-light)',  label: 'in progress' },
  verified:    { color: 'var(--muted)',  bg: 'var(--bg-subtle)',    label: 'closed' },
}

var TYPES = ['bug', 'feature', 'ux', 'task']

var PRIORITY_META: Record<string, { label: string; sublabel: string; color: string; bg: string; sort: number }> = {
  critical: { label: 'P0', sublabel: 'Critical', color: 'var(--red)',   bg: 'var(--red-light)',   sort: 0 },
  high:     { label: 'P1', sublabel: 'High',     color: '#e67700',      bg: '#fff3e0',            sort: 1 },
  normal:   { label: 'P2', sublabel: 'Normal',   color: 'var(--amber)', bg: 'var(--amber-light)', sort: 2 },
  medium:   { label: 'P2', sublabel: 'Normal',   color: 'var(--amber)', bg: 'var(--amber-light)', sort: 2 },
  low:      { label: 'P3', sublabel: 'Low',      color: 'var(--green)', bg: 'var(--green-light)', sort: 3 },
}

function priorityBadge(priority: string | undefined) {
  var m = PRIORITY_META[priority || ''] || PRIORITY_META['normal']
  return { label: m.label, sublabel: m.sublabel, color: m.color, bg: m.bg }
}

var PRODUCTS: Record<string, string[]> = {
  'Products': ['studios', 'mode', 'signal', 'privacy'],
  'Apps': ['admin', 'platform', 'website', 'sm'],
}

var ADMIN_TABS = [
  { id: 'queue',    label: 'Queue',       statuses: ['open'] },
  { id: 'progress', label: 'In Progress', statuses: ['in_progress'] },
  { id: 'closed',   label: 'Closed',      statuses: ['closed'] },
]

var REPORTER_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'open',     label: 'Open',        statuses: ['open'] },
  { id: 'progress', label: 'In Progress', statuses: ['in_progress'] },
  { id: 'done',     label: 'Closed',      statuses: ['closed'] },
]

function BugIcon({ size }: { size?: number }) {
  return React.createElement('svg', { width: size || 18, height: size || 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M9 9v-1a3 3 0 0 1 6 0v1' }),
    React.createElement('path', { d: 'M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3' }),
    React.createElement('path', { d: 'M3 13l4 0' }),
    React.createElement('path', { d: 'M17 13l4 0' }),
    React.createElement('path', { d: 'M12 20l0 -6' }),
    React.createElement('path', { d: 'M4 19l3.35 -2' }),
    React.createElement('path', { d: 'M20 19l-3.35 -2' }),
    React.createElement('path', { d: 'M4 7l3.75 2.4' }),
    React.createElement('path', { d: 'M20 7l-3.75 2.4' })
  )
}

function CloseIcon() {
  return React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' },
    React.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
    React.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
  )
}

function UploadIcon() {
  return React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '17 8 12 3 7 8' }),
    React.createElement('line', { x1: 12, y1: 3, x2: 12, y2: 15 })
  )
}

function CameraIcon() {
  return React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }),
    React.createElement('circle', { cx: 12, cy: 12, r: 3 })
  )
}

function PlayIcon() {
  return React.createElement('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 },
    React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' })
  )
}

var S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 8999 } as CSSProperties,
  panel: { position: 'fixed', top: 0, right: 0, width: 480, height: '100vh', background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 9000, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' } as CSSProperties,
  panelMobile: { width: '100%' } as CSSProperties,
  header: { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } as CSSProperties,
  title: { fontSize: 15, fontWeight: 700, color: 'var(--foreground)' } as CSSProperties,
  closeBtn: { background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', cursor: 'pointer', padding: 0 } as CSSProperties,
  sourceToggle: { display: 'flex', padding: '6px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 0 } as CSSProperties,
  sourceBtn: function(active: boolean): CSSProperties { return { flex: 1, padding: '7px 8px', fontSize: 12, fontFamily: 'var(--font)', fontWeight: 600, border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent)' : 'var(--bg-subtle)', color: active ? '#fff' : 'var(--muted)', cursor: 'pointer', textAlign: 'center' } },
  sourceBtnFirst: { borderRadius: '6px 0 0 6px', borderRight: 'none' } as CSSProperties,
  sourceBtnLast: { borderRadius: '0 6px 6px 0' } as CSSProperties,
  filterBar: { display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' } as CSSProperties,
  filterSelect: { fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--foreground)', outline: 'none' } as CSSProperties,
  tabBar: { display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 } as CSSProperties,
  tabBtn: function(active: boolean): CSSProperties { return { flex: 1, padding: '8px 4px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', textAlign: 'center' } },
  list: { flex: 1, overflowY: 'auto', padding: 8 } as CSSProperties,
  rpills: { display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 } as CSSProperties,
  rpill: function(active: boolean): CSSProperties { return { padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, borderRadius: 999, border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--muted)', cursor: 'pointer' } },
  card: function(expanded: boolean): CSSProperties { return { background: 'var(--bg-subtle)', border: '1px solid', borderColor: expanded ? 'var(--accent)' : 'var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.15s' } },
  meta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as CSSProperties,
  dot: function(color: string): CSSProperties { return { width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 } },
  typeBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' } as CSSProperties,
  productBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' } as CSSProperties,
  submittedBy: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)' } as CSSProperties,
  statusPill: function(status: string): CSSProperties { var m = STATUS_META[status] || STATUS_META['open']; return { display: 'inline-block', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 8px', borderRadius: 999, marginLeft: 'auto', flexShrink: 0, background: m.bg, color: m.color } },
  bugTitle: { fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)' } as CSSProperties,
  bugDesc: { fontSize: 12, color: 'var(--muted)', marginBottom: 6, lineHeight: 1.4 } as CSSProperties,
  bugUrl: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: 6 } as CSSProperties,
  bugTime: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' } as CSSProperties,
  bugId: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 3, cursor: 'pointer', userSelect: 'all' } as CSSProperties,
  detail: { marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' } as CSSProperties,
  sectionLabel: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '10px 0 4px' } as CSSProperties,
  aiTriage: { marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--accent-10, rgba(35,98,234,0.1))', border: '1px solid var(--border)' } as CSSProperties,
  aiHeader: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 } as CSSProperties,
  aiBadge: function(bg: string, color: string): CSSProperties { return { display: 'inline-block', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: bg, color: color, marginRight: 4 } },
  aiNotes: { fontSize: 11, color: 'var(--muted)', lineHeight: 1.4, marginTop: 4 } as CSSProperties,
  fireSection: { marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' } as CSSProperties,
  fireHeader: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 } as CSSProperties,
  firePreview: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', lineHeight: 1.5, background: 'var(--bg-subtle)', padding: 8, borderRadius: 4, border: '1px solid var(--border)', maxHeight: 60, overflow: 'hidden', marginBottom: 8, whiteSpace: 'pre-wrap' } as CSSProperties,
  btnSm: function(bg: string, color: string, border?: string): CSSProperties { return { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: border || 'none', background: bg, color: color } },
  commentAvatar: function(): CSSProperties { return { width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-10, rgba(35,98,234,0.1))', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)' } },
  commentInput: { flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', outline: 'none' } as CSSProperties,
  commentSubmit: { padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 } as CSSProperties,
  formArea: { borderTop: '1px solid var(--border)', padding: 12, background: 'var(--bg-subtle)', flexShrink: 0 } as CSSProperties,
  formSelect: { fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', flex: 1, outline: 'none' } as CSSProperties,
  formInput: { width: '100%', padding: 8, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', marginBottom: 6, outline: 'none', boxSizing: 'border-box' } as CSSProperties,
  formTextarea: { width: '100%', padding: 8, fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', resize: 'vertical', marginBottom: 6, outline: 'none', boxSizing: 'border-box' } as CSSProperties,
  screenshotZone: { flex: 1, border: '1.5px dashed var(--border)', borderRadius: 6, padding: 10, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', cursor: 'pointer' } as CSSProperties,
  captureBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent-10, rgba(35,98,234,0.1))', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 } as CSSProperties,
  fileBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' } as CSSProperties,
  submitBtn: { flex: 1, padding: 8, borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' } as CSSProperties,
  cancelBtn: { padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' } as CSSProperties,
  fab: { position: 'fixed', bottom: 24, right: 24, zIndex: 9000, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } as CSSProperties,
  fabOffset: { bottom: 80 } as CSSProperties,
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 } as CSSProperties,
  threadBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--blue-10)', color: 'var(--blue)' } as CSSProperties,
}

function initials(name: string | undefined): string {
  if (!name) return '?'
  var parts = name.split(' ')
  if (parts.length >= 2) return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function shortId(id: string | undefined): string {
  if (!id) return ''
  if (id.startsWith('bug_')) return 'BUG-' + id.slice(4, 10)
  return 'PS-' + id.slice(0, 6)
}

function relTime(iso: string | undefined): string {
  if (!iso) return ''
  var diff = Date.now() - new Date(iso).getTime()
  var m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  var h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  var d = Math.floor(h / 24)
  if (d < 30) return d + 'd ago'
  return new Date(iso).toLocaleDateString()
}

function blastColor(blast: string | undefined): { bg: string; color: string } {
  if (blast === 'low') return { bg: 'var(--green-light)', color: 'var(--green)' }
  if (blast === 'medium') return { bg: 'var(--amber-light)', color: 'var(--amber)' }
  return { bg: 'var(--red-light)', color: 'var(--red)' }
}

interface AiClassification {
  classification?: string
  blast_radius?: string
  auto_fixable?: boolean
  suggested_priority?: string
  triage_notes?: string
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !query.trim() || !text) return text
  var q = query.trim()
  var idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return React.createElement(React.Fragment, null,
    text.slice(0, idx),
    React.createElement('mark', { style: { background: 'var(--amber-light)', color: 'var(--foreground)', padding: '0 1px', borderRadius: 2 } }, text.slice(idx, idx + q.length)),
    text.slice(idx + q.length)
  )
}

function BugCard({ bug, isAdmin, expanded, onToggle, onAction, onComment, onFire, onFireTerminal, apiBase, searchQuery }: {
  bug: Bug
  isAdmin?: boolean
  expanded: boolean
  onToggle: () => void
  onAction: (bugId: string, updates: Record<string, string>) => void
  onComment: (bugId: string, body: string) => Promise<void>
  onFire?: (bugId: string) => void
  onFireTerminal?: (bugId: string) => void
  apiBase: string
  searchQuery?: string
}) {
  var _comment = useState(''); var comment = _comment[0]; var setComment = _comment[1]
  var _copied = useState(false); var copied = _copied[0]; var setCopied = _copied[1]
  var _posting = useState(false); var posting = _posting[0]; var setPosting = _posting[1]
  var _closing = useState(false); var closing = _closing[0]; var setClosure = _closing[1]
  var _closeReason = useState(''); var closeReason = _closeReason[0]; var setCloseReason = _closeReason[1]
  var _viewingAtt = useState<string | null>(null); var _viewingAttVal = _viewingAtt[0]; var _setViewingAtt = _viewingAtt[1]

  var sm = STATUS_META[bug.status] || STATUS_META['open']
  var ai: AiClassification | null = null
  try { ai = typeof bug.ai_classification === 'string' ? JSON.parse(bug.ai_classification) : (bug.ai_classification as AiClassification) || null } catch(_e) {}

  function copyId(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(bug.id).then(function() { setCopied(true); setTimeout(function() { setCopied(false) }, 1200) })
  }

  function postComment(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    if (!comment.trim() || posting) return
    setPosting(true)
    onComment(bug.id, comment.trim()).then(function() {
      setComment('')
      setPosting(false)
    }).catch(function() { setPosting(false) })
  }

  function copyFirePrompt(e: React.MouseEvent) {
    e.stopPropagation()
    if (bug.fire_prompt) navigator.clipboard.writeText(bug.fire_prompt)
  }

  function fireBug(e: React.MouseEvent) {
    e.stopPropagation()
    if (bug.fire_prompt) navigator.clipboard.writeText(bug.fire_prompt)
    onFire && onFire(bug.id)
  }

  function fireTerminal(e: React.MouseEvent) {
    e.stopPropagation()
    onFireTerminal && onFireTerminal(bug.id)
  }

  return (
    <div style={S.card(expanded)} onClick={onToggle} data-bug-id={bug.id}>
      <div style={S.meta}>
        <span style={S.dot(sm.color)} />
        <span style={S.typeBadge}>{bug.type || 'bug'}</span>
        <span style={S.productBadge}>{bug.product}</span>
        {isAdmin && bug.submitted_by_name && <span style={S.submittedBy}>{bug.submitted_by_name.split(' ')[0].toLowerCase()}</span>}
        {isAdmin ? <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginLeft: 'auto', color: sm.color }}>{bug.status}</span>
                 : <span style={S.statusPill(bug.status)}>{sm.label}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={S.bugId} onClick={copyId} title="Click to copy ID">{shortId(bug.id)}</span>
        {copied && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>copied</span>}
      </div>
      <div style={S.bugTitle}>{highlightText(bug.title, searchQuery || '')}</div>

      {bug.description && <div style={S.bugDesc}>{bug.description.length > 120 ? bug.description.slice(0, 120) + '...' : bug.description}</div>}
      {bug.page_url && <div style={S.bugUrl}>{bug.page_url}</div>}
      <div style={S.bugTime}>{relTime(bug.created_at)}</div>

      {expanded && (
        <div style={S.detail}>
          {bug.description && bug.description.length > 120 && (
            <>
              <div style={Object.assign({}, S.sectionLabel, { marginTop: 0 })}>Full Description</div>
              <div style={S.bugDesc}>{bug.description}</div>
            </>
          )}

          {bug.attachments && bug.attachments.length > 0 && (
            <>
              <div style={S.sectionLabel}>Attachments</div>
              <div onClick={function(e) { e.stopPropagation() }}>
              <UpdateAttachments
                attachments={bug.attachments.map(function(att) { return { id: att.id, type: att.type || 'file', filename: att.filename, r2Key: att.r2_key || att.id, size: att.size, mime: att.mime } })}
                updateId={bug.id}
                getSignedUrl={function(_uid: string, attId: string) {
                  return fetch(apiBase + '/api/bugs/' + bug.id + '/attachments/' + attId + '/url', { credentials: 'include' })
                    .then(function(r) { return r.json() })
                }}
              />
              </div>
            </>
          )}

          {ai && (
            <div style={S.aiTriage}>
              <div style={S.aiHeader}>AI Triage{ai.auto_fixable ? ' (auto)' : ''}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={S.aiBadge('var(--blue-10)', 'var(--blue)')}>{ai.classification || bug.type}</span>
                {ai.blast_radius && <span style={S.aiBadge(blastColor(ai.blast_radius).bg, blastColor(ai.blast_radius).color)}>blast: {ai.blast_radius}</span>}
                {ai.auto_fixable !== undefined && <span style={S.aiBadge(ai.auto_fixable ? 'var(--green-light)' : 'var(--bg-subtle)', ai.auto_fixable ? 'var(--green)' : 'var(--muted)')}>{ai.auto_fixable ? 'auto-fixable' : 'manual fix'}</span>}
                {ai.suggested_priority && (function() { var pb = priorityBadge(ai.suggested_priority); return <span style={S.aiBadge(pb.bg, pb.color)}>{pb.label} {pb.sublabel}</span> })()}
              </div>
              {ai.triage_notes && <div style={S.aiNotes}>{ai.triage_notes}</div>}
            </div>
          )}

          {isAdmin && bug.fire_prompt && (
            <div style={S.fireSection}>
              <div style={S.fireHeader}><PlayIcon /> Fire Prompt Ready</div>
              <div style={S.firePreview}>{bug.fire_prompt}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={S.btnSm('var(--green)', '#fff', 'none')} onClick={fireBug}>Fire &amp; Push Brief</button>
                <button style={S.btnSm('var(--bg-subtle)', 'var(--green)', '1px solid var(--green)')} onClick={fireTerminal}>Push to Terminal</button>
                <button style={S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)')} onClick={copyFirePrompt}>Copy Prompt</button>
              </div>
            </div>
          )}

          <div style={S.sectionLabel}>Comments</div>
          {bug.comments && bug.comments.map(function(c) {
            return (
              <div key={c.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                <div style={S.commentAvatar()}>{initials(c.author_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{c.author_name}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{relTime(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>{c.body}</div>
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <input style={S.commentInput} placeholder="Leave a comment..." value={comment}
              onChange={function(e) { setComment(e.target.value) }}
              onKeyDown={function(e) { if (e.key === 'Enter') postComment(e) }}
              onClick={function(e) { e.stopPropagation() }} />
            <button style={S.commentSubmit} onClick={postComment} disabled={posting}>{posting ? '...' : 'Post'}</button>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {bug.status === 'open' && (
                <>
                  <button style={S.btnSm('var(--accent)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'in_progress' }) }}>Start</button>
                  {!closing ? (
                    <button style={S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)')} onClick={function(e) { e.stopPropagation(); setClosure(true) }}>Close</button>
                  ) : (
                    <>
                      <select style={Object.assign({}, S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)'), { cursor: 'pointer', fontSize: 11 })} value={closeReason} onChange={function(e) { e.stopPropagation(); setCloseReason(e.target.value) }} onClick={function(e) { e.stopPropagation() }}>
                        <option value="">Select reason...</option>
                        <option value="invalid">Invalid</option>
                        <option value="duplicate">Duplicate</option>
                        <option value="already_fixed">Already Fixed</option>
                        <option value="wont_fix">Won't Fix</option>
                        <option value="moved_to_feature">Moved to Feature</option>
                      </select>
                      {closeReason && <button style={S.btnSm('var(--red)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'closed', close_reason: closeReason }); setClosure(false); setCloseReason('') }}>Confirm</button>}
                      <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }} onClick={function(e) { e.stopPropagation(); setClosure(false); setCloseReason('') }}>Cancel</button>
                    </>
                  )}
                </>
              )}
              {bug.status === 'in_progress' && (
                <>
                  {!closing ? (
                    <button style={S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)')} onClick={function(e) { e.stopPropagation(); setClosure(true) }}>Close</button>
                  ) : (
                    <>
                      <select style={Object.assign({}, S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)'), { cursor: 'pointer', fontSize: 11 })} value={closeReason} onChange={function(e) { e.stopPropagation(); setCloseReason(e.target.value) }} onClick={function(e) { e.stopPropagation() }}>
                        <option value="">Select reason...</option>
                        <option value="fixed">Fixed</option>
                        <option value="invalid">Invalid</option>
                        <option value="duplicate">Duplicate</option>
                        <option value="already_fixed">Already Fixed</option>
                        <option value="wont_fix">Won't Fix</option>
                        <option value="moved_to_feature">Moved to Feature</option>
                      </select>
                      {closeReason && <button style={S.btnSm('var(--red)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'closed', close_reason: closeReason }); setClosure(false); setCloseReason('') }}>Confirm</button>}
                      <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }} onClick={function(e) { e.stopPropagation(); setClosure(false); setCloseReason('') }}>Cancel</button>
                    </>
                  )}
                  <button style={S.btnSm('transparent', 'var(--accent)', '1px solid var(--accent)')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'open' }) }}>Re-open</button>
                </>
              )}
              {bug.status === 'closed' && (
                <>
                  <button style={S.btnSm('transparent', 'var(--accent)', '1px solid var(--accent)')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'open' }) }}>Re-open</button>
                  {bug.close_reason && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{bug.close_reason.replace(/_/g, ' ')}</span>}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ThreadCard({ item, expanded, onToggle, searchQuery }: { item: ThreadItem; expanded: boolean; onToggle: () => void; searchQuery?: string }) {
  var _copied = useState(false); var copied = _copied[0]; var setCopied = _copied[1]

  function copyId(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(item.id).then(function() { setCopied(true); setTimeout(function() { setCopied(false) }, 1200) })
  }

  var pb = priorityBadge(item.priority)

  return (
    <div style={S.card(expanded)} onClick={onToggle}>
      <div style={S.meta}>
        <span style={S.dot('var(--red)')} />
        <span style={S.threadBadge}>{item.thread_id || 'unknown'}</span>
        <span style={S.productBadge}>{item.product}</span>
        <span style={S.aiBadge(pb.bg, pb.color)}>{pb.label}</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginLeft: 'auto', color: 'var(--red)' }}>{item.status}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={S.bugId} onClick={copyId} title="Click to copy ID">PS-{(item.id || '').slice(0, 6)}</span>
        {copied && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>copied</span>}
      </div>
      <div style={S.bugTitle}>{highlightText(item.title, searchQuery || '')}</div>
      {item.body && <div style={S.bugDesc}>{item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body}</div>}
      <div style={S.bugTime}>Logged {relTime(item.created_at)}</div>
      {expanded && (
        <div style={S.detail}>
          {item.body && item.body.length > 100 && (
            <>
              <div style={Object.assign({}, S.sectionLabel, { marginTop: 0 })}>Full Description</div>
              <div style={S.bugDesc}>{item.body}</div>
            </>
          )}
          {item.tags && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {item.tags.split(',').map(function(t, i) {
                return <span key={i} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: 3, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t.trim()}</span>
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function BugPanel(props: BugPanelProps) {
  var isAdmin = props.isAdmin
  var apiBase = props.apiBase || ''
  var product = props.product || 'sm'
  var label = props.label || 'Report Bug'
  var offsetFab = props.offsetFab
  var onClose = props.onClose
  var visible = props.visible

  var _open = useState(false); var selfOpen = _open[0]; var setSelfOpen = _open[1]
  var open = visible !== undefined ? visible : selfOpen
  var setOpen = visible !== undefined ? function() {} : setSelfOpen

  var _bugs = useState<Bug[]>([]); var bugs = _bugs[0]; var setBugs = _bugs[1]
  var _threads = useState<ThreadItem[]>([]); var threads = _threads[0]; var setThreads = _threads[1]
  var _threadTotal = useState(0); var threadTotal = _threadTotal[0]; var setThreadTotal = _threadTotal[1]
  var _loading = useState(false); var loading = _loading[0]; var setLoading = _loading[1]
  var _source = useState('reports'); var source = _source[0]; var setSource = _source[1]
  var _tab = useState('queue'); var tab = _tab[0]; var setTab = _tab[1]
  var _rFilter = useState('all'); var rFilter = _rFilter[0]; var setRFilter = _rFilter[1]
  var _expanded = useState<string | null>(null); var expanded = _expanded[0]; var setExpanded = _expanded[1]
  var _showForm = useState(false); var showForm = _showForm[0]; var setShowForm = _showForm[1]
  var _fTitle = useState(''); var fTitle = _fTitle[0]; var setFTitle = _fTitle[1]
  var _fDesc = useState(''); var fDesc = _fDesc[0]; var setFDesc = _fDesc[1]
  var _fType = useState('bug'); var fType = _fType[0]; var setFType = _fType[1]
  var _fProduct = useState(product); var fProduct = _fProduct[0]; var setFProduct = _fProduct[1]
  var _submitting = useState(false); var submitting = _submitting[0]; var setSubmitting = _submitting[1]
  var _filterProduct = useState(isAdmin ? 'all' : (props.product || 'all')); var filterProduct = _filterProduct[0]; var setFilterProduct = _filterProduct[1]
  var _filterType = useState('all'); var filterType = _filterType[0]; var setFilterType = _filterType[1]
  var _filterPriority = useState('all'); var filterPriority = _filterPriority[0]; var setFilterPriority = _filterPriority[1]
  var _filterPerson = useState('all'); var filterPerson = _filterPerson[0]; var setFilterPerson = _filterPerson[1]
  var _sortBy = useState('newest'); var sortBy = _sortBy[0]; var setSortBy = _sortBy[1]
  var _searchQuery = useState(''); var searchQuery = _searchQuery[0]; var setSearchQuery = _searchQuery[1]
  var _debouncedSearch = useState(''); var debouncedSearch = _debouncedSearch[0]; var setDebouncedSearch = _debouncedSearch[1]
  var searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  var _formAttachments = useState<Array<{ id: string; name: string; dataUrl: string; file?: File }>>([]); var formAttachments = _formAttachments[0]; var setFormAttachments = _formAttachments[1]
  var _previewModal = useState<string | null>(null); var previewModal = _previewModal[0]; var setPreviewModal = _previewModal[1]
  var _capturing = useState(false); var capturing = _capturing[0]; var setCapturing = _capturing[1]
  var fileInputRef = useRef<HTMLInputElement>(null)
  var attIdCounter = useRef(0)
  function addAttachment(name: string, dataUrl: string, file?: File) {
    attIdCounter.current++
    setFormAttachments(function(prev) { return prev.concat([{ id: 'att_' + attIdCounter.current + '_' + Date.now(), name: name, dataUrl: dataUrl, file: file }]) })
  }
  function removeAttachment(id: string) {
    setFormAttachments(function(prev) { return prev.filter(function(a) { return a.id !== id }) })
  }

  // Deep link: ?bug=bug_xxx opens panel and expands that bug
  var deepLinkBugId = useRef<string | null>(null)
  useEffect(function() {
    var params = new URLSearchParams(window.location.search)
    var bugId = params.get('bug')
    if (bugId) {
      setSelfOpen(true)
      setExpanded(bugId)
      deepLinkBugId.current = bugId
    }
  }, [])

  // Scroll to deep-linked bug once it's rendered
  useEffect(function() {
    if (deepLinkBugId.current && bugs.length > 0) {
      var id = deepLinkBugId.current
      deepLinkBugId.current = null
      setTimeout(function() {
        var el = document.querySelector('[data-bug-id="' + id + '"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [bugs])

  useEffect(function() {
    if (!showForm) return
    var handler = function(e: ClipboardEvent) {
      var items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile()
          if (!blob) break
          var reader = new FileReader()
          reader.onload = function(ev) { addAttachment('pasted-image.png', ev.target?.result as string) }
          reader.readAsDataURL(blob)
          e.preventDefault()
          break
        }
      }
    }
    window.addEventListener('paste', handler)
    return function() { window.removeEventListener('paste', handler) }
  }, [showForm])

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(function() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(function() {
      setDebouncedSearch(searchQuery)
    }, 300)
    return function() { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [searchQuery])

  function captureScreen() {
    setCapturing(true)
    var script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = function() {
      // Use ignoreElements to skip the bug panel — no hide/show flash
      // @ts-ignore — html2canvas loaded dynamically
      window.html2canvas(document.body, {
        useCORS: true, scale: 1, logging: false,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        ignoreElements: function(el: HTMLElement) {
          return el.hasAttribute('data-bug-overlay') || el.hasAttribute('data-bug-panel') || el.id === 'sm-bug-root'
        }
      }).then(function(canvas: HTMLCanvasElement) {
        addAttachment("screenshot.png", canvas.toDataURL('image/png'))
        setCapturing(false)
      }).catch(function() {
        setCapturing(false)
      })
    }
    script.onerror = function() { setCapturing(false) }
    document.head.appendChild(script)
  }

  var loadBugs = useCallback(function() {
    setLoading(true)
    var params: string[] = []
    if (!isAdmin && rFilter !== 'all') {
      var rf = REPORTER_FILTERS.find(function(f) { return f.id === rFilter })
      if (rf && rf.statuses) params.push('status=' + rf.statuses.join(','))
    }
    if (isAdmin && source === 'reports') {
      var at = ADMIN_TABS.find(function(t) { return t.id === tab })
      if (at) at.statuses.forEach(function(s) { params.push('status=' + s) })
    }
    if (filterProduct !== 'all') params.push('product=' + filterProduct)
    if (filterType !== 'all') params.push('type=' + filterType)
    if (filterPriority !== 'all') params.push('priority=' + filterPriority)
    if (debouncedSearch.trim()) params.push('q=' + encodeURIComponent(debouncedSearch.trim()))
    params.push('limit=100')

    var url = apiBase + '/api/bugs'
    if (isAdmin && source === 'reports') {
      var at2 = ADMIN_TABS.find(function(t) { return t.id === tab })
      if (at2) {
        url += '?' + params.filter(function(p) { return !p.startsWith('status=') }).join('&')
      }
    } else {
      url += '?' + params.join('&')
    }

    fetch(url, { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d: { data?: Bug[] }) {
        var items: Bug[] = Array.isArray(d.data) ? d.data : []
        if (isAdmin && source === 'reports') {
          var at3 = ADMIN_TABS.find(function(t) { return t.id === tab })
          if (at3) { var at3s = at3.statuses; items = items.filter(function(b) { return at3s.indexOf(b.status) !== -1 }) }
        }
        setBugs(items)
        setLoading(false)
      })
      .catch(function() { setLoading(false) })
  }, [apiBase, isAdmin, source, tab, rFilter, filterProduct, filterType, filterPriority, debouncedSearch])

  var _threadLimit = useState(50); var threadLimit = _threadLimit[0]; var setThreadLimit = _threadLimit[1]

  var loadThreads = useCallback(function() {
    if (!isAdmin) return
    setLoading(true)
    var params = ['status=open', 'limit=' + threadLimit]
    if (filterProduct !== 'all') params.push('product=' + filterProduct)
    if (filterPriority !== 'all') params.push('priority=' + filterPriority)
    if (debouncedSearch.trim()) params.push('q=' + encodeURIComponent(debouncedSearch.trim()))
    fetch(apiBase + '/api/bugs/threads?' + params.join('&'), { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d: { data?: ThreadItem[]; total?: number }) { setThreads(Array.isArray(d.data) ? d.data : []); setThreadTotal(d.total || (d.data ? d.data.length : 0)); setLoading(false) })
      .catch(function() { setLoading(false) })
  }, [apiBase, isAdmin, filterProduct, filterPriority, threadLimit, debouncedSearch])

  useEffect(function() {
    if (!open) return
    if (source === 'reports') loadBugs()
    else loadThreads()
    if (isAdmin) {
      var params = ['status=open', 'limit=1']
      if (filterProduct !== 'all') params.push('product=' + filterProduct)
      if (filterPriority !== 'all') params.push('priority=' + filterPriority)
      fetch(apiBase + '/api/bugs/threads?' + params.join('&'), { credentials: 'include' })
        .then(function(r) { return r.json() })
        .then(function(d: { total?: number }) { if (d.total !== undefined) setThreadTotal(d.total) })
        .catch(function() {})
    }
  }, [open, source, tab, rFilter, filterProduct, filterType, filterPriority, debouncedSearch, loadBugs, loadThreads, isAdmin, apiBase])

  useEffect(function() {
    if (!expanded || source !== 'reports') return
    fetch(apiBase + '/api/bugs/' + expanded, { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d: { ok: boolean; data?: Bug }) {
        if (d.ok && d.data) {
          setBugs(function(prev) {
            return prev.map(function(b) {
              return b.id === expanded ? Object.assign({}, b, { comments: d.data!.comments, attachments: d.data!.attachments }) : b
            })
          })
        }
      })
      .catch(function() {})
  }, [expanded, apiBase, source])

  function handleAction(bugId: string, updates: Record<string, string>) {
    fetch(apiBase + '/api/bugs/' + bugId, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(function() { loadBugs() })
  }

  function handleFire(bugId: string) {
    fetch(apiBase + '/api/bugs/' + bugId + '/fire', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(function(r) { return r.json() })
      .then(function(d: { ok: boolean }) {
        if (d.ok) loadBugs()
      })
  }

  function handleFireTerminal(bugId: string) {
    fetch(apiBase + '/api/bugs/' + bugId + '/fire', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'terminal' })
    }).then(function(r) { return r.json() })
      .then(function(d: { ok: boolean; data?: { fire_prompt?: string } }) {
        if (d.ok) {
          if (d.data && d.data.fire_prompt) navigator.clipboard.writeText(d.data.fire_prompt)
          loadBugs()
        }
      })
  }

  function handleComment(bugId: string, body: string): Promise<void> {
    return fetch(apiBase + '/api/bugs/' + bugId + '/comments', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body })
    }).then(function() {
      return fetch(apiBase + '/api/bugs/' + bugId, { credentials: 'include' })
        .then(function(r) { return r.json() })
        .then(function(d: { ok: boolean; data?: Bug }) {
          if (d.ok && d.data) {
            setBugs(function(prev) {
              return prev.map(function(b) {
                return b.id === bugId ? Object.assign({}, b, { comments: d.data!.comments }) : b
              })
            })
          }
        })
    })
  }

  function handleSubmit() {
    if (!fTitle.trim() || submitting) return
    setSubmitting(true)
    fetch(apiBase + '/api/bugs', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: fTitle.trim(), description: fDesc.trim(), type: fType, product: fProduct, page_url: window.location.pathname })
    })
      .then(function(r) { return r.json() })
      .then(function(d: { ok: boolean; data?: { id?: string } }) {
        if (d.ok && d.data && d.data.id) {
          var bugId = d.data.id
          var uploads: Promise<Response>[] = []

          formAttachments.forEach(function(att) {
            var fd = new FormData()
            if (att.file) {
              fd.append('file', att.file)
            } else if (att.dataUrl) {
              var byteString = atob(att.dataUrl.split(',')[1])
              var ab = new ArrayBuffer(byteString.length)
              var ia = new Uint8Array(ab)
              for (var i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
              var mime = att.dataUrl.split(';')[0].split(':')[1] || 'image/png'
              var blob = new Blob([ab], { type: mime })
              fd.append('file', blob, att.name)
            }
            uploads.push(fetch(apiBase + '/api/bugs/' + bugId + '/attachments', {
              method: 'POST', credentials: 'include', body: fd
            }))
          })

          Promise.all(uploads).then(function() {
            setFTitle(''); setFDesc(''); setFormAttachments([])
            if (fileInputRef.current) fileInputRef.current.value = ''
            setShowForm(false)
            loadBugs()
            setSubmitting(false)
          }).catch(function() {
            setShowForm(false); loadBugs(); setSubmitting(false)
          })
        } else {
          setSubmitting(false)
        }
      })
      .catch(function() { setSubmitting(false) })
  }

  function closePanel() {
    if (onClose) onClose()
    else setOpen(false)
  }

  if (!open) {
    if (visible !== undefined) return null
    return (
      <button style={Object.assign({}, S.fab, offsetFab ? S.fabOffset : {})} onClick={function() { setSelfOpen(true) }}>
        <BugIcon size={16} /> {label}
      </button>
    )
  }

  var isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  var items = source === 'reports' ? bugs : threads

  return (
    <>
      <div data-bug-overlay="" style={S.overlay} onClick={closePanel} />
      <div data-bug-panel="" style={Object.assign({}, S.panel, isMobile ? S.panelMobile : {})}>

        <div style={S.header}>
          <span style={S.title}>{isAdmin ? 'Bug Catcher' : label}</span>
          <kbd style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle,var(--bg))', color: 'var(--muted)', lineHeight: 1.4, marginLeft: 6, fontFamily: 'var(--font-mono,monospace)' }}>{typeof navigator !== 'undefined' && navigator.platform && navigator.platform.indexOf('Mac') !== -1 ? '\u2318B' : 'Ctrl+B'}</kbd>
          <span style={{ flex: 1 }} />
          <button style={S.closeBtn} onClick={closePanel}><CloseIcon /></button>
        </div>

        {isAdmin && (
          <div style={S.sourceToggle}>
            <button style={Object.assign({}, S.sourceBtn(source === 'reports'), S.sourceBtnFirst)} onClick={function() { setSource('reports') }}>
              Reports <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, opacity: 0.8 }}>{bugs.length}</span>
            </button>
            <button style={Object.assign({}, S.sourceBtn(source === 'threads'), S.sourceBtnLast)} onClick={function() { setSource('threads') }}>
              Claude Threads <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, opacity: 0.8 }}>{threadTotal}</span>
            </button>
          </div>
        )}

        {!isAdmin && (
          <div style={S.rpills}>
            {REPORTER_FILTERS.map(function(f) {
              return <button key={f.id} style={S.rpill(rFilter === f.id)} onClick={function() { setRFilter(f.id) }}>{f.label}</button>
            })}
          </div>
        )}

        {!isAdmin && (
          <div style={{ padding: '4px 16px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search bugs..."
                value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value) }}
                style={Object.assign({}, S.filterSelect, { width: '100%', padding: '6px 28px 6px 8px', boxSizing: 'border-box' as const })}
              />
              {searchQuery && (
                <button
                  onClick={function() { setSearchQuery('') }}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, color: 'var(--muted)', fontWeight: 700, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Clear search"
                >×</button>
              )}
            </div>
          </div>
        )}

        {isAdmin && (
          <div style={S.filterBar}>
            <select style={S.filterSelect} value={filterProduct} onChange={function(e) { setFilterProduct(e.target.value) }}>
              <option value="all">Products</option>
              {Object.keys(PRODUCTS).map(function(group) {
                return <optgroup key={group} label={group}>
                  {PRODUCTS[group].map(function(p) { return <option key={p} value={p}>{p}</option> })}
                </optgroup>
              })}
            </select>
            {source === 'reports' ? (
              <select style={S.filterSelect} value={filterType} onChange={function(e) { setFilterType(e.target.value) }}>
                <option value="all">Types</option>
                {TYPES.map(function(t) { return <option key={t} value={t}>{t}</option> })}
              </select>
            ) : (
              <select style={Object.assign({}, S.filterSelect, { opacity: 0.4, pointerEvents: 'none' as const })} disabled value="all">
                <option value="all">Types</option>
              </select>
            )}
            <select style={S.filterSelect} value={filterPriority} onChange={function(e) { setFilterPriority(e.target.value) }}>
              <option value="all">Priorities</option>
              <option value="critical">P0 Critical</option>
              <option value="high">P1 High</option>
              <option value="normal">P2 Normal</option>
              <option value="low">P3 Low</option>
            </select>
            <select style={S.filterSelect} value={filterPerson} onChange={function(e) { setFilterPerson(e.target.value) }}>
              <option value="all">People</option>
              {Array.from(new Set(bugs.map(function(b) { return b.submitted_by_name }).filter(Boolean))).sort().map(function(name) {
                return <option key={name} value={name}>{name}</option>
              })}
            </select>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 120px', minWidth: 100 }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value) }}
                style={Object.assign({}, S.filterSelect, { width: '100%', paddingRight: searchQuery ? 24 : 8, boxSizing: 'border-box' as const })}
              />
              {searchQuery && (
                <button
                  onClick={function() { setSearchQuery('') }}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, color: 'var(--muted)', fontWeight: 700, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Clear search"
                >×</button>
              )}
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginLeft: 'auto' }}>Sort:</span>
            <select style={S.filterSelect} value={sortBy} onChange={function(e) { setSortBy(e.target.value) }}>
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        )}

        {isAdmin && source === 'reports' && (
          <div style={S.tabBar}>
            {ADMIN_TABS.map(function(t) {
              return <button key={t.id} style={S.tabBtn(tab === t.id)} onClick={function() { setTab(t.id); setExpanded(null) }}>{t.label}</button>
            })}
          </div>
        )}

        <div style={S.list}>
          {loading && <div style={S.empty}>Loading...</div>}
          {!loading && items.length === 0 && <div style={S.empty}>No items.</div>}
          {!loading && source === 'reports' && bugs.filter(function(b) {
            return filterPerson === 'all' || b.submitted_by_name === filterPerson
          }).slice().sort(function(a, b) {
            if (sortBy === 'priority') {
              return ((PRIORITY_META[a.priority || ''] || PRIORITY_META['normal']).sort) - ((PRIORITY_META[b.priority || ''] || PRIORITY_META['normal']).sort)
            }
            if (sortBy === 'oldest') return (a.created_at || '').localeCompare(b.created_at || '')
            return (b.created_at || '').localeCompare(a.created_at || '')
          }).map(function(bug) {
            return <BugCard key={bug.id} bug={bug} isAdmin={isAdmin} expanded={expanded === bug.id}
              onToggle={function() { setExpanded(expanded === bug.id ? null : bug.id) }}
              onAction={handleAction} onComment={handleComment} onFire={handleFire} onFireTerminal={handleFireTerminal} apiBase={apiBase} searchQuery={debouncedSearch} />
          })}
          {!loading && source === 'threads' && threads.map(function(item) {
            return <ThreadCard key={item.id} item={item} expanded={expanded === item.id}
              onToggle={function() { setExpanded(expanded === item.id ? null : item.id) }} searchQuery={debouncedSearch} />
          })}
          {!loading && source === 'threads' && threads.length < threadTotal && (
            <button onClick={function() { setThreadLimit(threadLimit + 50) }}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: 4 }}>
              Load more ({threads.length} of {threadTotal})
            </button>
          )}
        </div>

        {showForm ? (
          <div style={S.formArea}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select style={S.formSelect} value={fType} onChange={function(e) { setFType(e.target.value) }}>
                {TYPES.map(function(t) { return <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option> })}
              </select>
              <select style={S.formSelect} value={fProduct} onChange={function(e) { setFProduct(e.target.value) }}>
                {Object.keys(PRODUCTS).map(function(group) {
                  return <optgroup key={group} label={group}>
                    {PRODUCTS[group].map(function(p) { return <option key={p} value={p}>{p}</option> })}
                  </optgroup>
                })}
              </select>
            </div>
            <input style={S.formInput} placeholder="Bug title" value={fTitle}
              onChange={function(e) { setFTitle(e.target.value) }}
              onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) handleSubmit() }} autoFocus />
            <textarea style={S.formTextarea} rows={2} placeholder="Description" value={fDesc}
              onChange={function(e) { setFDesc(e.target.value) }} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}
              onDragOver={function(e) { e.preventDefault(); e.stopPropagation() }}
              onDrop={function(e) {
                e.preventDefault(); e.stopPropagation()
                var files = e.dataTransfer.files
                for (var i = 0; i < files.length; i++) {
                  var f = files[i]
                  if (f.type.startsWith('image/')) {
                    var r = new FileReader()
                    r.onload = function(ev) { addAttachment(f.name, ev.target?.result as string, f) }
                    r.readAsDataURL(f)
                  } else {
                    addAttachment(f.name, '', f)
                  }
                }
              }}>
              <div style={S.screenshotZone}>Drop, Paste, or Cmd+V</div>
              <button style={S.captureBtn} onClick={function(e) { e.stopPropagation(); captureScreen() }} disabled={capturing}>
                <CameraIcon /> {capturing ? '...' : 'Capture'}
              </button>
              <button style={S.fileBtn} onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}><UploadIcon /> File</button>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={function(e) {
                  if (!e.target.files) return
                  for (var i = 0; i < e.target.files.length; i++) {
                    var f = e.target.files[i]
                    if (f.type.startsWith('image/')) {
                      var r = new FileReader()
                      r.onload = (function(file) { return function(ev) { addAttachment(file.name, ev.target?.result as string, file) } })(f)
                      r.readAsDataURL(f)
                    } else {
                      addAttachment(f.name, '', f)
                    }
                  }
                  e.target.value = ''
                }} />
            </div>
            {formAttachments.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {formAttachments.map(function(att) {
                  return <div key={att.id} style={{ position: 'relative', display: 'inline-block' }}>
                    {att.dataUrl ? (
                      <img src={att.dataUrl} alt={att.name} onClick={function() { setPreviewModal(att.id) }}
                        style={{ width: 64, height: 48, borderRadius: 4, border: '1px solid var(--border)', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
                    ) : (
                      <div style={{ width: 64, height: 48, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textAlign: 'center', padding: 2, overflow: 'hidden' }}>
                        {att.name.length > 12 ? att.name.slice(0, 10) + '..' : att.name}
                      </div>
                    )}
                    <button onClick={function() { removeAttachment(att.id) }}
                      style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 9, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                  </div>
                })}
              </div>
            )}
            {previewModal && (function() {
              var att = formAttachments.find(function(a) { return a.id === previewModal })
              if (!att || !att.dataUrl) { setPreviewModal(null); return null }
              return <div onClick={function() { setPreviewModal(null) }}
                style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 24 }}>
                <img src={att.dataUrl} alt={att.name} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
              </div>
            })()}
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.submitBtn} onClick={handleSubmit} disabled={submitting || !fTitle.trim()}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button style={S.cancelBtn} onClick={function() { setShowForm(false); setFTitle(''); setFDesc(''); setFormAttachments([]) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px', flexShrink: 0 }}>
            <button style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}
              onClick={function() { setShowForm(true) }}>
              + Report Bug or Feature
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export function BugPanelHeaderButton({ onClick }: BugPanelHeaderButtonProps) {
  return React.createElement('button', {
    onClick: onClick,
    'aria-label': 'Report bug',
    title: 'Bug Catcher (Ctrl+B)',
    style: {
      width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 7,
      background: 'var(--bg-card)', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'border-color .2s',
      flexShrink: 0, padding: 0, color: 'var(--foreground)'
    } as CSSProperties
  }, React.createElement(BugIcon, { size: 16 }))
}
