// src/BugPanel.jsx
// BUG-TOOL-1: Floating bug/feature reporting panel.
// Drop into any portal via Layout. Reporter mode or Admin triage mode.
//
// Props:
//   isAdmin    — boolean, admin sees all + triage actions + Claude Threads
//   apiBase    — API base URL (default: '')
//   product    — current portal product string
//   label      — trigger button label (default: 'Report Bug')
//   session    — current user session { contact_id, display_name, email }
//
// Usage:
//   import { BugPanel } from '@nomadahq/sm-ui'
//   <BugPanel isAdmin={true} apiBase="https://api.sprintmode.ai" product="admin" session={user} />

import React, { useState, useEffect, useRef, useCallback } from 'react'

// ── Status colors mapped to CSS vars ─────────────────────────────────────────
var STATUS_META = {
  open:     { color: 'var(--red)',    bg: 'var(--red-light)',   label: 'open' },
  triaged:  { color: 'var(--amber)',  bg: 'var(--amber-light)', label: 'triaged' },
  fixing:   { color: 'var(--blue)',   bg: 'var(--blue-10)',     label: 'fixing' },
  qa:       { color: 'var(--green)',  bg: 'var(--green-light)', label: 'qa' },
  verified: { color: 'var(--green)',  bg: 'var(--green-light)', label: 'verified' },
  closed:   { color: 'var(--muted)',  bg: 'var(--bg-subtle)',   label: 'closed' },
}

var TYPES = ['bug', 'feature', 'ux', 'task']
var PRODUCTS = {
  'Products': ['studios', 'mode', 'signal', 'privacy'],
  'Apps': ['admin', 'platform', 'website', 'sm'],
}
var ADMIN_TABS = [
  { id: 'queue',    label: 'Queue',       statuses: ['open'] },
  { id: 'progress', label: 'In Progress', statuses: ['triaged', 'fixing'] },
  { id: 'verify',   label: 'Verify',      statuses: ['qa'] },
  { id: 'closed',   label: 'Closed',      statuses: ['verified', 'closed'] },
]
var REPORTER_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'open',     label: 'Open',        statuses: ['open'] },
  { id: 'progress', label: 'In Progress', statuses: ['triaged', 'fixing', 'qa'] },
  { id: 'done',     label: 'Closed',      statuses: ['verified', 'closed'] },
]

// ── Icons ────────────────────────────────────────────────────────────────────
function BugIcon({ size }) {
  return React.createElement('svg', { width: size || 18, height: size || 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
    React.createElement('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 })
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

// ── Styles ───────────────────────────────────────────────────────────────────
var S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 8999 },
  panel: { position: 'fixed', top: 0, right: 0, width: 480, height: '100vh', background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 9000, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  panelMobile: { width: '100%' },
  header: { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title: { fontSize: 15, fontWeight: 700, color: 'var(--foreground)' },
  closeBtn: { background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', cursor: 'pointer', padding: 0 },
  sourceToggle: { display: 'flex', padding: '6px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 0 },
  sourceBtn: function(active) { return { flex: 1, padding: '7px 8px', fontSize: 12, fontFamily: 'var(--font)', fontWeight: 600, border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent)' : 'var(--bg-subtle)', color: active ? '#fff' : 'var(--muted)', cursor: 'pointer', textAlign: 'center' } },
  sourceBtnFirst: { borderRadius: '6px 0 0 6px', borderRight: 'none' },
  sourceBtnLast: { borderRadius: '0 6px 6px 0' },
  filterBar: { display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' },
  filterSelect: { fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--foreground)', outline: 'none' },
  tabBar: { display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  tabBtn: function(active) { return { flex: 1, padding: '8px 4px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', textAlign: 'center' } },
  list: { flex: 1, overflowY: 'auto', padding: 8 },
  rpills: { display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  rpill: function(active) { return { padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, borderRadius: 999, border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--border)', background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--muted)', cursor: 'pointer' } },
  // Card
  card: function(expanded) { return { background: 'var(--bg-subtle)', border: '1px solid', borderColor: expanded ? 'var(--accent)' : 'var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.15s' } },
  meta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: function(color) { return { width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 } },
  typeBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' },
  productBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' },
  submittedBy: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)' },
  statusPill: function(status) { var m = STATUS_META[status] || STATUS_META.open; return { display: 'inline-block', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 8px', borderRadius: 999, marginLeft: 'auto', flexShrink: 0, background: m.bg, color: m.color } },
  bugTitle: { fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)' },
  bugDesc: { fontSize: 12, color: 'var(--muted)', marginBottom: 6, lineHeight: 1.4 },
  bugUrl: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: 6 },
  bugTime: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)' },
  bugId: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 3, cursor: 'pointer', userSelect: 'all' },
  // Detail
  detail: { marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' },
  sectionLabel: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '10px 0 4px' },
  // AI triage
  aiTriage: { marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--accent-10, rgba(35,98,234,0.1))', border: '1px solid var(--border)' },
  aiHeader: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 },
  aiBadge: function(bg, color) { return { display: 'inline-block', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: bg, color: color, marginRight: 4 } },
  aiNotes: { fontSize: 11, color: 'var(--muted)', lineHeight: 1.4, marginTop: 4 },
  // Fire prompt
  fireSection: { marginTop: 10, padding: 10, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' },
  fireHeader: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 },
  firePreview: { fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', lineHeight: 1.5, background: 'var(--bg-subtle)', padding: 8, borderRadius: 4, border: '1px solid var(--border)', maxHeight: 60, overflow: 'hidden', marginBottom: 8, whiteSpace: 'pre-wrap' },
  // Buttons
  btnSm: function(bg, color, border) { return { fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: border || 'none', background: bg, color: color } },
  // Comment
  commentAvatar: function(initials) { return { width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-10, rgba(35,98,234,0.1))', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)' } },
  commentInput: { flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', outline: 'none' },
  commentSubmit: { padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 },
  // Form
  formArea: { borderTop: '1px solid var(--border)', padding: 12, background: 'var(--bg-subtle)', flexShrink: 0 },
  formSelect: { fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', flex: 1, outline: 'none' },
  formInput: { width: '100%', padding: 8, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', marginBottom: 6, outline: 'none', boxSizing: 'border-box' },
  formTextarea: { width: '100%', padding: 8, fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)', fontFamily: 'var(--font)', resize: 'vertical', marginBottom: 6, outline: 'none', boxSizing: 'border-box' },
  screenshotZone: { flex: 1, border: '1.5px dashed var(--border)', borderRadius: 6, padding: 10, textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', cursor: 'pointer' },
  captureBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent-10, rgba(35,98,234,0.1))', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 },
  fileBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' },
  submitBtn: { flex: 1, padding: 8, borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' },
  cancelBtn: { padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' },
  // FAB
  fab: { position: 'fixed', bottom: 24, right: 24, zIndex: 9000, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' },
  fabOffset: { bottom: 80 }, // offset when chatbot FAB is present
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 },
  threadBadge: { fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--blue-10)', color: 'var(--blue)' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?'
  var parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function shortId(id) {
  if (!id) return ''
  // bug_abc123 -> BUG-abc123, ps_abc -> PS-abc
  if (id.startsWith('bug_')) return 'BUG-' + id.slice(4, 10)
  return 'PS-' + id.slice(0, 6)
}

function relTime(iso) {
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

function blastColor(blast) {
  if (blast === 'low') return { bg: 'var(--green-light)', color: 'var(--green)' }
  if (blast === 'medium') return { bg: 'var(--amber-light)', color: 'var(--amber)' }
  return { bg: 'var(--red-light)', color: 'var(--red)' }
}

// ─── BugCard ─────────────────────────────────────────────────────────────────
function BugCard({ bug, isAdmin, expanded, onToggle, onAction, onComment, apiBase }) {
  var _comment = useState(''); var comment = _comment[0]; var setComment = _comment[1]
  var _copied = useState(false); var copied = _copied[0]; var setCopied = _copied[1]
  var _posting = useState(false); var posting = _posting[0]; var setPosting = _posting[1]

  var sm = STATUS_META[bug.status] || STATUS_META.open
  var ai = null
  try { ai = typeof bug.ai_classification === 'string' ? JSON.parse(bug.ai_classification) : bug.ai_classification } catch(e) {}

  function copyId(e) {
    e.stopPropagation()
    var sid = shortId(bug.id)
    navigator.clipboard.writeText(bug.id).then(function() { setCopied(true); setTimeout(function() { setCopied(false) }, 1200) })
  }

  function postComment(e) {
    e.stopPropagation()
    if (!comment.trim() || posting) return
    setPosting(true)
    onComment(bug.id, comment.trim()).then(function() {
      setComment('')
      setPosting(false)
    }).catch(function() { setPosting(false) })
  }

  function copyFirePrompt(e) {
    e.stopPropagation()
    if (bug.fire_prompt) navigator.clipboard.writeText(bug.fire_prompt)
  }

  return (
    <div style={S.card(expanded)} onClick={onToggle}>
      {/* Meta row */}
      <div style={S.meta}>
        <span style={S.dot(sm.color)} />
        <span style={S.typeBadge}>{bug.type || 'bug'}</span>
        <span style={S.productBadge}>{bug.product}</span>
        {isAdmin && bug.submitted_by_name && <span style={S.submittedBy}>{bug.submitted_by_name.split(' ')[0].toLowerCase()}</span>}
        {isAdmin ? <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginLeft: 'auto', color: sm.color }}>{bug.status}</span>
                 : <span style={S.statusPill(bug.status)}>{sm.label}</span>}
      </div>

      {/* ID + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={S.bugId} onClick={copyId} title="Click to copy ID">{shortId(bug.id)}</span>
        {copied && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>copied</span>}
      </div>
      <div style={S.bugTitle}>{bug.title}</div>

      {/* Description snippet */}
      {bug.description && <div style={S.bugDesc}>{bug.description.length > 120 ? bug.description.slice(0, 120) + '...' : bug.description}</div>}

      {/* Page URL */}
      {bug.page_url && <div style={S.bugUrl}>{bug.page_url}</div>}

      {/* Timestamp */}
      <div style={S.bugTime}>{relTime(bug.created_at)}</div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={S.detail}>

          {/* Full description */}
          {bug.description && bug.description.length > 120 && (
            <>
              <div style={Object.assign({}, S.sectionLabel, { marginTop: 0 })}>Full Description</div>
              <div style={S.bugDesc}>{bug.description}</div>
            </>
          )}

          {/* Attachments */}
          {bug.attachments && bug.attachments.length > 0 && (
            <>
              <div style={S.sectionLabel}>Attachments</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bug.attachments.map(function(att) {
                  return <a key={att.id} href={apiBase + '/bugs/' + bug.id + '/files/' + att.id + '/' + att.filename} target="_blank" rel="noopener"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textDecoration: 'none' }}
                    onClick={function(e) { e.stopPropagation() }}>
                    {att.type === 'image' ? '🖼' : '📄'} {att.filename}
                  </a>
                })}
              </div>
            </>
          )}

          {/* AI Triage */}
          {ai && (
            <div style={S.aiTriage}>
              <div style={S.aiHeader}>AI Triage{ai.auto_fixable ? ' (auto)' : ''}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={S.aiBadge('var(--blue-10)', 'var(--blue)')}>{ai.classification || bug.type}</span>
                {ai.blast_radius && <span style={S.aiBadge(blastColor(ai.blast_radius).bg, blastColor(ai.blast_radius).color)}>blast: {ai.blast_radius}</span>}
                {ai.auto_fixable !== undefined && <span style={S.aiBadge(ai.auto_fixable ? 'var(--green-light)' : 'var(--bg-subtle)', ai.auto_fixable ? 'var(--green)' : 'var(--muted)')}>{ai.auto_fixable ? 'auto-fixable' : 'manual fix'}</span>}
                {ai.suggested_priority && <span style={S.aiBadge('var(--bg-subtle)', 'var(--muted)')}>priority: {ai.suggested_priority}</span>}
              </div>
              {ai.triage_notes && <div style={S.aiNotes}>{ai.triage_notes}</div>}
            </div>
          )}

          {/* Fire prompt (admin only) */}
          {isAdmin && bug.fire_prompt && (
            <div style={S.fireSection}>
              <div style={S.fireHeader}><PlayIcon /> Fire Prompt Ready</div>
              <div style={S.firePreview}>{bug.fire_prompt}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={S.btnSm('var(--green)', '#fff', 'none')} onClick={copyFirePrompt}>Copy Fire Prompt</button>
              </div>
            </div>
          )}

          {/* Comments */}
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

          {/* Admin actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {bug.status === 'open' && (
                <>
                  <button style={S.btnSm('transparent', 'var(--accent)', '1px solid var(--accent)')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'triaged' }) }}>Confirm Triage</button>
                  <button style={S.btnSm('transparent', 'var(--muted)', '1px solid var(--border)')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'closed' }) }}>Close</button>
                </>
              )}
              {(bug.status === 'triaged' || bug.status === 'fixing') && (
                <button style={S.btnSm('var(--accent)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'qa' }) }}>Mark for QA</button>
              )}
              {bug.status === 'qa' && (
                <>
                  <button style={S.btnSm('var(--green)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'verified' }) }}>Fixed</button>
                  <button style={S.btnSm('var(--red)', '#fff', 'none')} onClick={function(e) { e.stopPropagation(); onAction(bug.id, { status: 'open' }) }}>Not Fixed</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ThreadCard (project_state items) ────────────────────────────────────────
function ThreadCard({ item, expanded, onToggle }) {
  var _copied = useState(false); var copied = _copied[0]; var setCopied = _copied[1]

  function copyId(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(item.id).then(function() { setCopied(true); setTimeout(function() { setCopied(false) }, 1200) })
  }

  return (
    <div style={S.card(expanded)} onClick={onToggle}>
      <div style={S.meta}>
        <span style={S.dot('var(--red)')} />
        <span style={S.threadBadge}>{item.thread_id || 'unknown'}</span>
        <span style={S.productBadge}>{item.product}</span>
        <span style={S.aiBadge(item.priority === 'high' ? 'var(--red-light)' : 'var(--bg-subtle)', item.priority === 'high' ? 'var(--red)' : 'var(--muted)')}>{item.priority}</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginLeft: 'auto', color: 'var(--red)' }}>{item.status}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={S.bugId} onClick={copyId} title="Click to copy ID">PS-{(item.id || '').slice(0, 6)}</span>
        {copied && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>copied</span>}
      </div>
      <div style={S.bugTitle}>{item.title}</div>
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

// ═══ BugPanel ════════════════════════════════════════════════════════════════
export function BugPanel(props) {
  var isAdmin = props.isAdmin
  var apiBase = props.apiBase || ''
  var product = props.product || 'sm'
  var label = props.label || 'Report Bug'
  var session = props.session
  var offsetFab = props.offsetFab // when true, push FAB up to avoid chatbot overlap
  var onClose = props.onClose // called when panel closes (for Layout integration)
  var visible = props.visible // controlled mode — Layout controls open/close

  // In uncontrolled mode, BugPanel manages its own open state + FAB
  var _open = useState(false); var selfOpen = _open[0]; var setSelfOpen = _open[1]
  var open = visible !== undefined ? visible : selfOpen
  var setOpen = visible !== undefined ? function() {} : setSelfOpen

  var _bugs = useState([]); var bugs = _bugs[0]; var setBugs = _bugs[1]
  var _threads = useState([]); var threads = _threads[0]; var setThreads = _threads[1]
  var _loading = useState(false); var loading = _loading[0]; var setLoading = _loading[1]
  var _source = useState('reports'); var source = _source[0]; var setSource = _source[1]
  var _tab = useState('queue'); var tab = _tab[0]; var setTab = _tab[1]
  var _rFilter = useState('all'); var rFilter = _rFilter[0]; var setRFilter = _rFilter[1]
  var _expanded = useState(null); var expanded = _expanded[0]; var setExpanded = _expanded[1]
  var _showForm = useState(false); var showForm = _showForm[0]; var setShowForm = _showForm[1]
  // Form state
  var _fTitle = useState(''); var fTitle = _fTitle[0]; var setFTitle = _fTitle[1]
  var _fDesc = useState(''); var fDesc = _fDesc[0]; var setFDesc = _fDesc[1]
  var _fType = useState('bug'); var fType = _fType[0]; var setFType = _fType[1]
  var _fProduct = useState(product); var fProduct = _fProduct[0]; var setFProduct = _fProduct[1]
  var _submitting = useState(false); var submitting = _submitting[0]; var setSubmitting = _submitting[1]
  var _filterProduct = useState('all'); var filterProduct = _filterProduct[0]; var setFilterProduct = _filterProduct[1]
  var _filterType = useState('all'); var filterType = _filterType[0]; var setFilterType = _filterType[1]
  var _sortBy = useState('newest'); var sortBy = _sortBy[0]; var setSortBy = _sortBy[1]
  var _screenshot = useState(null); var screenshot = _screenshot[0]; var setScreenshot = _screenshot[1]
  var _capturing = useState(false); var capturing = _capturing[0]; var setCapturing = _capturing[1]
  var fileInputRef = useRef(null)
  var formFileRef = useRef(null) // file to upload after bug creation

  // ── Screenshot paste handler (global when form is open) ─────────────────
  useEffect(function() {
    if (!showForm) return
    var handler = function(e) {
      var items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile()
          var reader = new FileReader()
          reader.onload = function(ev) { setScreenshot(ev.target.result) }
          reader.readAsDataURL(blob)
          e.preventDefault()
          break
        }
      }
    }
    window.addEventListener('paste', handler)
    return function() { window.removeEventListener('paste', handler) }
  }, [showForm])

  // ── Capture screen via html2canvas ──────────────────────────────────────
  function captureScreen() {
    setCapturing(true)
    // Dynamically load html2canvas from CDN
    var script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = function() {
      // Hide the bug panel overlay before capture
      var overlay = document.querySelector('[data-bug-overlay]')
      var panel = document.querySelector('[data-bug-panel]')
      if (overlay) overlay.style.display = 'none'
      if (panel) panel.style.display = 'none'

      window.html2canvas(document.body, { useCORS: true, scale: 1, logging: false }).then(function(canvas) {
        setScreenshot(canvas.toDataURL('image/png'))
        if (overlay) overlay.style.display = ''
        if (panel) panel.style.display = ''
        setCapturing(false)
      }).catch(function() {
        if (overlay) overlay.style.display = ''
        if (panel) overlay.style.display = ''
        setCapturing(false)
      })
    }
    script.onerror = function() { setCapturing(false) }
    document.head.appendChild(script)
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  var loadBugs = useCallback(function() {
    setLoading(true)
    var params = []
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
    params.push('limit=100')

    // For admin tabs with multiple statuses, fetch without status filter and filter client-side
    var url = apiBase + '/api/bugs'
    if (isAdmin && source === 'reports') {
      var at2 = ADMIN_TABS.find(function(t) { return t.id === tab })
      if (at2) {
        // Fetch all and filter client-side for multi-status tabs
        url += '?' + params.filter(function(p) { return !p.startsWith('status=') }).join('&')
      }
    } else {
      url += '?' + params.join('&')
    }

    fetch(url, { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d) {
        var items = Array.isArray(d.data) ? d.data : []
        // Client-side status filter for admin tabs
        if (isAdmin && source === 'reports') {
          var at3 = ADMIN_TABS.find(function(t) { return t.id === tab })
          if (at3) items = items.filter(function(b) { return at3.statuses.indexOf(b.status) !== -1 })
        }
        setBugs(items)
        setLoading(false)
      })
      .catch(function() { setLoading(false) })
  }, [apiBase, isAdmin, source, tab, rFilter, filterProduct, filterType])

  var loadThreads = useCallback(function() {
    if (!isAdmin) return
    setLoading(true)
    var params = ['status=open']
    if (filterProduct !== 'all') params.push('product=' + filterProduct)
    fetch(apiBase + '/api/bugs/threads?' + params.join('&'), { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d) { setThreads(Array.isArray(d.data) ? d.data : []); setLoading(false) })
      .catch(function() { setLoading(false) })
  }, [apiBase, isAdmin, filterProduct])

  useEffect(function() {
    if (!open) return
    if (source === 'reports') loadBugs()
    else loadThreads()
  }, [open, source, tab, rFilter, filterProduct, filterType, loadBugs, loadThreads])

  // ── Load detail with comments/attachments on expand ───────────────────────
  useEffect(function() {
    if (!expanded || source !== 'reports') return
    fetch(apiBase + '/api/bugs/' + expanded, { credentials: 'include' })
      .then(function(r) { return r.json() })
      .then(function(d) {
        if (d.ok && d.data) {
          setBugs(function(prev) {
            return prev.map(function(b) {
              return b.id === expanded ? Object.assign({}, b, { comments: d.data.comments, attachments: d.data.attachments }) : b
            })
          })
        }
      })
      .catch(function() {})
  }, [expanded, apiBase, source])

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleAction(bugId, updates) {
    fetch(apiBase + '/api/bugs/' + bugId, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(function() { loadBugs() })
  }

  function handleComment(bugId, body) {
    return fetch(apiBase + '/api/bugs/' + bugId + '/comments', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body })
    }).then(function() {
      // Reload detail
      return fetch(apiBase + '/api/bugs/' + bugId, { credentials: 'include' })
        .then(function(r) { return r.json() })
        .then(function(d) {
          if (d.ok && d.data) {
            setBugs(function(prev) {
              return prev.map(function(b) {
                return b.id === bugId ? Object.assign({}, b, { comments: d.data.comments }) : b
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
      .then(function(d) {
        if (d.ok && d.data && d.data.id) {
          var bugId = d.data.id
          var uploads = []

          // Upload screenshot if captured/pasted
          if (screenshot) {
            var byteString = atob(screenshot.split(',')[1])
            var ab = new ArrayBuffer(byteString.length)
            var ia = new Uint8Array(ab)
            for (var i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
            var blob = new Blob([ab], { type: 'image/png' })
            var fd = new FormData()
            fd.append('file', blob, 'screenshot.png')
            uploads.push(fetch(apiBase + '/api/bugs/' + bugId + '/attachments', {
              method: 'POST', credentials: 'include', body: fd
            }))
          }

          // Upload file if selected
          if (formFileRef.current) {
            var ffd = new FormData()
            ffd.append('file', formFileRef.current)
            uploads.push(fetch(apiBase + '/api/bugs/' + bugId + '/attachments', {
              method: 'POST', credentials: 'include', body: ffd
            }))
          }

          Promise.all(uploads).then(function() {
            setFTitle(''); setFDesc(''); setScreenshot(null); formFileRef.current = null
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

  function handleFileUpload(bugId, file) {
    var fd = new FormData()
    fd.append('file', file)
    fetch(apiBase + '/api/bugs/' + bugId + '/attachments', {
      method: 'POST', credentials: 'include', body: fd
    }).then(function() {
      // Reload detail
      if (expanded === bugId) {
        fetch(apiBase + '/api/bugs/' + bugId, { credentials: 'include' })
          .then(function(r) { return r.json() })
          .then(function(d) {
            if (d.ok && d.data) {
              setBugs(function(prev) {
                return prev.map(function(b) {
                  return b.id === bugId ? Object.assign({}, b, { attachments: d.data.attachments }) : b
                })
              })
            }
          })
      }
    })
  }

  function closePanel() {
    if (onClose) onClose()
    else setOpen(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!open) {
    // Only show FAB in uncontrolled mode
    if (visible !== undefined) return null
    return (
      <button style={Object.assign({}, S.fab, offsetFab ? S.fabOffset : {})} onClick={function() { setOpen(true) }}>
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

        {/* Header */}
        <div style={S.header}>
          <span style={S.title}>{isAdmin ? 'Bug Panel' : label}</span>
          <button style={S.closeBtn} onClick={closePanel}><CloseIcon /></button>
        </div>

        {/* Source toggle (admin only) */}
        {isAdmin && (
          <div style={S.sourceToggle}>
            <button style={Object.assign({}, S.sourceBtn(source === 'reports'), S.sourceBtnFirst)} onClick={function() { setSource('reports') }}>
              Reports <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, opacity: 0.8 }}>{bugs.length}</span>
            </button>
            <button style={Object.assign({}, S.sourceBtn(source === 'threads'), S.sourceBtnLast)} onClick={function() { setSource('threads') }}>
              Claude Threads <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 4, opacity: 0.8 }}>{threads.length}</span>
            </button>
          </div>
        )}

        {/* Reporter filter pills */}
        {!isAdmin && (
          <div style={S.rpills}>
            {REPORTER_FILTERS.map(function(f) {
              return <button key={f.id} style={S.rpill(rFilter === f.id)} onClick={function() { setRFilter(f.id) }}>{f.label}</button>
            })}
          </div>
        )}

        {/* Admin filter + sort bar */}
        {isAdmin && (
          <div style={S.filterBar}>
            <select style={S.filterSelect} value={filterProduct} onChange={function(e) { setFilterProduct(e.target.value) }}>
              <option value="all">All Products + Apps</option>
              {Object.keys(PRODUCTS).map(function(group) {
                return <optgroup key={group} label={group}>
                  {PRODUCTS[group].map(function(p) { return <option key={p} value={p}>{p}</option> })}
                </optgroup>
              })}
            </select>
            {source === 'reports' && (
              <select style={S.filterSelect} value={filterType} onChange={function(e) { setFilterType(e.target.value) }}>
                <option value="all">All Types</option>
                {TYPES.map(function(t) { return <option key={t} value={t}>{t}</option> })}
              </select>
            )}
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginLeft: 'auto' }}>Sort:</span>
            <select style={S.filterSelect} value={sortBy} onChange={function(e) { setSortBy(e.target.value) }}>
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        )}

        {/* Admin tabs (reports view only) */}
        {isAdmin && source === 'reports' && (
          <div style={S.tabBar}>
            {ADMIN_TABS.map(function(t) {
              return <button key={t.id} style={S.tabBtn(tab === t.id)} onClick={function() { setTab(t.id); setExpanded(null) }}>{t.label}</button>
            })}
          </div>
        )}

        {/* Item list */}
        <div style={S.list}>
          {loading && <div style={S.empty}>Loading...</div>}
          {!loading && items.length === 0 && <div style={S.empty}>No items.</div>}
          {!loading && source === 'reports' && bugs.map(function(bug) {
            return <BugCard key={bug.id} bug={bug} isAdmin={isAdmin} expanded={expanded === bug.id}
              onToggle={function() { setExpanded(expanded === bug.id ? null : bug.id) }}
              onAction={handleAction} onComment={handleComment} apiBase={apiBase} />
          })}
          {!loading && source === 'threads' && threads.map(function(item) {
            return <ThreadCard key={item.id} item={item} expanded={expanded === item.id}
              onToggle={function() { setExpanded(expanded === item.id ? null : item.id) }} />
          })}
        </div>

        {/* Submit form */}
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
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <div style={S.screenshotZone}>Paste -- Cmd+V</div>
              <button style={S.captureBtn} onClick={function(e) { e.stopPropagation(); captureScreen() }} disabled={capturing}>
                <CameraIcon /> {capturing ? '...' : 'Capture'}
              </button>
              <button style={S.fileBtn} onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}><UploadIcon /> File</button>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={function(e) { if (e.target.files && e.target.files[0]) formFileRef.current = e.target.files[0] }} />
            </div>
            {/* Screenshot/file preview */}
            {screenshot && (
              <div style={{ marginBottom: 8, position: 'relative' }}>
                <img src={screenshot} alt="screenshot" style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
                <button onClick={function() { setScreenshot(null) }}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>x</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.submitBtn} onClick={handleSubmit} disabled={submitting || !fTitle.trim()}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button style={S.cancelBtn} onClick={function() { setShowForm(false); setFTitle(''); setFDesc('') }}>Cancel</button>
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

// ── Header button (for Layout integration) ──────────────────────────────────
export function BugPanelHeaderButton({ onClick }) {
  return React.createElement('button', {
    onClick: onClick,
    'aria-label': 'Report bug',
    title: 'Report Bug (Ctrl+B)',
    style: {
      width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 7,
      background: 'var(--bg-card)', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'border-color .2s',
      flexShrink: 0, padding: 0, color: 'var(--foreground)'
    }
  }, React.createElement(BugIcon, { size: 16 }))
}
