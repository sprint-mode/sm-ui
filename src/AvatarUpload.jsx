// AvatarUpload.jsx -- Standalone avatar/logo upload widget for CRM cards
//
// Usage (contact photo):
//   <AvatarUpload
//     entityType="contact"
//     entityId="ct_abc123"
//     currentUrl={contact.photo_url}
//     initials="AH"
//     source={contact.photo_source}
//     apiBase="https://api.sprintmode.ai"
//     onUpdate={function(url) { /* refresh contact */ }}
//   />
//
// Usage (company logo):
//   <AvatarUpload
//     entityType="company"
//     entityId="co_xyz789"
//     currentUrl={company.logo_url}
//     initials="SM"
//     source={company.logo_source}
//     apiBase="https://api.sprintmode.ai"
//     onUpdate={function(url) { /* refresh company */ }}
//     size={48}
//   />
//

import React, { useState, useRef } from 'react'

var DEFAULT_API = 'https://api.sprintmode.ai'

var ENDPOINTS = {
  contact: { field: 'photo', uploadPath: '/api/contacts/', uploadSuffix: '/photo' },
  company: { field: 'logo', uploadPath: '/api/companies/', uploadSuffix: '/logo' },
}

/**
 * AvatarUpload
 * Renders an avatar circle with upload/remove controls for CRM admin views.
 *
 * @param {object} props
 * @param {'contact'|'company'} props.entityType - 'contact' for photos, 'company' for logos
 * @param {string} props.entityId - The contact or company ID
 * @param {string|null} [props.currentUrl] - Current photo/logo URL
 * @param {string} [props.initials] - Fallback initials when no image
 * @param {string|null} [props.source] - photo_source or logo_source value
 * @param {string} [props.apiBase] - API base URL (default: https://api.sprintmode.ai)
 * @param {function} [props.onUpdate] - Called with new URL after upload, or null after delete
 * @param {number} [props.size] - Avatar size in px (default: 56)
 */
export function AvatarUpload({ entityType, entityId, currentUrl, initials, source, apiBase, onUpdate, size }) {
  var base = apiBase || DEFAULT_API
  var sz = size || 56
  var cfg = ENDPOINTS[entityType] || ENDPOINTS.contact
  var [mode, setMode] = useState(null) // null | 'picker' | 'saving'
  var [error, setError] = useState(null)
  var fileRef = useRef(null)

  async function handleFile(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB')
      return
    }
    setError(null)
    setMode('saving')
    try {
      var form = new FormData()
      form.append(cfg.field, file)
      var res = await fetch(base + cfg.uploadPath + entityId + cfg.uploadSuffix, {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      var data = await res.json()
      if (data.ok && data.data) {
        var newUrl = data.data.photo_url || data.data.logo_url
        if (onUpdate) onUpdate(newUrl)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (_e) {
      setError('Upload failed')
    }
    setMode(null)
    // Reset file input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemove() {
    setMode('saving')
    setError(null)
    try {
      var res = await fetch(base + cfg.uploadPath + entityId + cfg.uploadSuffix, {
        method: 'DELETE',
        credentials: 'include',
      })
      var data = await res.json()
      if (data.ok) {
        if (onUpdate) onUpdate(null)
      } else {
        setError(data.error || 'Remove failed')
      }
    } catch (_e) {
      setError('Remove failed')
    }
    setMode(null)
  }

  var circle = (
    <div style={{
      width: sz, height: sz, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'var(--accent-10, hsla(215,80%,55%,.1))',
      color: 'var(--accent, #2362ea)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: sz * 0.36, fontWeight: 800,
    }}>
      {currentUrl
        ? <img src={currentUrl} alt="" style={{ width: sz, height: sz, objectFit: 'cover', display: 'block' }} onError={function(e) { e.target.style.display = 'none' }} />
        : (initials || '?')
      }
    </div>
  )

  return (
    <div style={{ position: 'relative', width: sz, height: sz, flexShrink: 0 }}>
      {circle}
      {mode === null && (
        <button onClick={function() { setMode('picker'); setError(null) }} title={entityType === 'company' ? 'Change logo' : 'Change photo'}
          style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%',
            background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: 'var(--muted, #6b7280)', padding: 0 }}>
          {'\u270e'}
        </button>
      )}
      {mode === 'saving' && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>...</div>
      )}
      {mode === 'picker' && (
        <div style={{ position: 'absolute', top: sz + 8, left: 0, zIndex: 20,
          background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 10, padding: 14, width: 220, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            {entityType === 'company' ? 'Change logo' : 'Change photo'}
          </div>
          <button onClick={function() { fileRef.current && fileRef.current.click() }}
            style={{ width: '100%', fontSize: 12, padding: '6px 10px', marginBottom: 6, borderRadius: 6,
              border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg, #f9fafb)',
              cursor: 'pointer', textAlign: 'left' }}>
            {'\uD83D\uDCC1'} Upload from device
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          {currentUrl && (
            <button onClick={handleRemove}
              style={{ width: '100%', fontSize: 12, padding: '6px 10px', marginBottom: 6, borderRadius: 6,
                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg, #f9fafb)',
                cursor: 'pointer', textAlign: 'left', color: '#dc2626' }}>
              {'\u2715'} Remove {entityType === 'company' ? 'logo' : 'photo'}
            </button>
          )}
          {error && (
            <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 4 }}>{error}</div>
          )}
          {source && (
            <div style={{ fontSize: 10, color: 'var(--muted, #9ca3af)', marginTop: 4 }}>
              Source: {source}
            </div>
          )}
          <button onClick={function() { setMode(null) }}
            style={{ marginTop: 6, fontSize: 11, color: 'var(--muted, #6b7280)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
