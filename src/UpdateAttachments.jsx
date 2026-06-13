/**
 * UpdateAttachments — shared component for rendering update attachments.
 * Used by: portal Updates pages (recipient view) and sm-admin UpdatesDetail/Compose (admin view).
 *
 * Handles four attachment types:
 *   image  — R2 file; fetches presigned URL, renders inline thumbnail, click to open full size
 *   file   — R2 file; fetches presigned URL, renders download chip with size + filename
 *   drive  — Google Drive link; renders Drive preview card, opens viewUrl in new tab
 *   link   — Pasted URL; renders link preview card, opens in new tab
 *
 * Props:
 *   attachments  {Array}    — attachment objects from update.attachments JSON
 *   getSignedUrl {Function} — async (updateId, attId) => { url, expires_at }
 *                             Pass null for drive/link types (no R2 key)
 *   updateId     {string}   — parent update ID, passed to getSignedUrl
 *   compact      {boolean}  — render as a tight horizontal strip (e.g. in list views)
 */

import React, { useState, useEffect } from 'react'

var DRIVE_ICON_COLORS = {
  'application/vnd.google-apps.presentation': '#f4b400',
  'application/vnd.google-apps.document':     '#4285f4',
  'application/vnd.google-apps.spreadsheet':  '#0f9d58',
  'application/vnd.google-apps.form':         '#7b68ee',
  default: '#7c5cbf',
}

var FILE_ICONS = {
  pdf:     { icon: 'ti-file-type-pdf', color: '#d93025' },
  doc:     { icon: 'ti-file-word',     color: '#1967d2' },
  docx:    { icon: 'ti-file-word',     color: '#1967d2' },
  xls:     { icon: 'ti-file-spreadsheet', color: '#0f9d58' },
  xlsx:    { icon: 'ti-file-spreadsheet', color: '#0f9d58' },
  csv:     { icon: 'ti-file-spreadsheet', color: '#0f9d58' },
  ppt:     { icon: 'ti-file-presentation', color: '#f4b400' },
  pptx:    { icon: 'ti-file-presentation', color: '#f4b400' },
  key:     { icon: 'ti-file-presentation', color: '#f4b400' },
  numbers: { icon: 'ti-file-spreadsheet',  color: '#0f9d58' },
  pages:   { icon: 'ti-file-word',         color: '#1967d2' },
  mp4:     { icon: 'ti-file-video',  color: '#7c5cbf' },
  mov:     { icon: 'ti-file-video',  color: '#7c5cbf' },
  m4v:     { icon: 'ti-file-video',  color: '#7c5cbf' },
  md:      { icon: 'ti-file-text',   color: '#333' },
  zip:     { icon: 'ti-file-zip',    color: '#888' },
}

function fileExt(filename) {
  return (filename || '').split('.').pop().toLowerCase()
}

function fileIconFor(filename) {
  var ext = fileExt(filename)
  return FILE_ICONS[ext] || { icon: 'ti-file', color: '#888' }
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// ─── Image attachment ─────────────────────────────────────────────────────────

function ImageAttachment({ att, signedUrl, loading }) {
  var [lightbox, setLightbox] = useState(false)
  return (
    <>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        cursor: signedUrl ? 'pointer' : 'default',
      }} onClick={function() { if (signedUrl) setLightbox(true) }}>
        <div style={{
          width: 120, height: 80, borderRadius: 6,
          border: '1px solid var(--border, #e5e7eb)',
          background: 'var(--bg-2, #f3f4f6)',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {loading ? (
            <i className="ti ti-loader-2" style={{ fontSize: 20, opacity: .4 }} aria-hidden="true" />
          ) : signedUrl ? (
            <img
              src={signedUrl}
              alt={att.filename}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <i className="ti ti-photo" style={{ fontSize: 20, opacity: .3 }} aria-hidden="true" />
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted, #6b7280)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {att.filename}
        </span>
      </div>
      {lightbox && signedUrl && (
        <div
          onClick={function() { setLightbox(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={signedUrl} alt={att.filename}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,.5)' }}
            onClick={function(e) { e.stopPropagation() }}
          />
          <button
            onClick={function() { setLightbox(false) }}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
              width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}

// ─── File attachment ──────────────────────────────────────────────────────────

function FileAttachment({ att, signedUrl, loading }) {
  var { icon, color } = fileIconFor(att.filename)
  return (
    <a
      href={signedUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
      download={!signedUrl ? undefined : att.filename}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border, #e5e7eb)',
        background: 'var(--bg-1, #f9fafb)',
        color: 'var(--foreground, #111)',
        textDecoration: 'none',
        opacity: loading ? .5 : 1,
        cursor: (loading || !signedUrl) ? 'default' : 'pointer',
        maxWidth: 280,
      }}
    >
      <i className={'ti ' + icon} aria-hidden="true" style={{ fontSize: 20, color, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {att.filename}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted, #6b7280)', marginTop: 1 }}>
          {loading ? 'Loading…' : (formatSize(att.size) || 'Download')}
        </div>
      </div>
      {!loading && signedUrl && (
        <i className="ti ti-download" aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted, #6b7280)', marginLeft: 'auto', flexShrink: 0 }} />
      )}
    </a>
  )
}

// ─── Drive attachment ─────────────────────────────────────────────────────────

function DriveAttachment({ att }) {
  var color = DRIVE_ICON_COLORS[att.mime] || DRIVE_ICON_COLORS.default
  return (
    <a
      href={att.url || att.viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border, #e5e7eb)',
        background: 'var(--bg-1, #f9fafb)',
        color: 'var(--foreground, #111)',
        textDecoration: 'none', maxWidth: 280,
      }}
    >
      <i className="ti ti-brand-google-drive" aria-hidden="true" style={{ fontSize: 20, color, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {att.filename || att.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted, #6b7280)', marginTop: 1 }}>
          Open in Drive
        </div>
      </div>
      <i className="ti ti-external-link" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted, #6b7280)', marginLeft: 'auto', flexShrink: 0 }} />
    </a>
  )
}

// ─── Link attachment ──────────────────────────────────────────────────────────

function LinkAttachment({ att }) {
  var domain = ''
  try { domain = new URL(att.url).hostname.replace('www.', '') } catch (_e) {}
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border, #e5e7eb)',
        background: 'var(--bg-1, #f9fafb)',
        color: 'var(--foreground, #111)',
        textDecoration: 'none', maxWidth: 280,
      }}
    >
      <i className="ti ti-link" aria-hidden="true" style={{ fontSize: 20, color: '#7c5cbf', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {att.title || att.filename || att.url}
        </div>
        {domain && (
          <div style={{ fontSize: 11, color: 'var(--muted, #6b7280)', marginTop: 1 }}>{domain}</div>
        )}
      </div>
      <i className="ti ti-external-link" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted, #6b7280)', marginLeft: 'auto', flexShrink: 0 }} />
    </a>
  )
}

// ─── R2 attachment wrapper — fetches presigned URL ────────────────────────────

function R2Attachment({ att, getSignedUrl, updateId }) {
  var [signedUrl, setSignedUrl] = useState(null)
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    if (!getSignedUrl || !att.r2Key) {
      // Legacy attachment with stored url — use directly (may 403)
      setSignedUrl(att.url || null)
      setLoading(false)
      return
    }
    setLoading(true)
    getSignedUrl(updateId, att.id).then(function(res) {
      setSignedUrl(res && res.data ? res.data.url : (res && res.url) ? res.url : null)
      setLoading(false)
    }).catch(function() {
      setLoading(false)
    })
  }, [att.id, att.r2Key, updateId])

  if (att.type === 'image') {
    return <ImageAttachment att={att} signedUrl={signedUrl} loading={loading} />
  }
  return <FileAttachment att={att} signedUrl={signedUrl} loading={loading} />
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function UpdateAttachments({ attachments, getSignedUrl, updateId, compact }) {
  var parsed = attachments
  if (typeof attachments === 'string') {
    try { parsed = JSON.parse(attachments) } catch (_e) { parsed = [] }
  }
  if (!parsed || !parsed.length) return null

  var images = parsed.filter(function(a) { return a.type === 'image' })
  var files  = parsed.filter(function(a) { return a.type === 'file' })
  var drives = parsed.filter(function(a) { return a.type === 'drive' })
  var links  = parsed.filter(function(a) { return a.type === 'link' })

  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {parsed.map(function(att) {
          if (att.type === 'drive') return <DriveAttachment key={att.id} att={att} />
          if (att.type === 'link')  return <LinkAttachment key={att.id} att={att} />
          return <R2Attachment key={att.id} att={att} getSignedUrl={getSignedUrl} updateId={updateId} />
        })}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {images.map(function(att) {
            return <R2Attachment key={att.id} att={att} getSignedUrl={getSignedUrl} updateId={updateId} />
          })}
        </div>
      )}
      {(files.length > 0 || drives.length > 0 || links.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(function(att) {
            return <R2Attachment key={att.id} att={att} getSignedUrl={getSignedUrl} updateId={updateId} />
          })}
          {drives.map(function(att) {
            return <DriveAttachment key={att.id} att={att} />
          })}
          {links.map(function(att) {
            return <LinkAttachment key={att.id} att={att} />
          })}
        </div>
      )}
    </div>
  )
}
