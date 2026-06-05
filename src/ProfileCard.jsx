// ProfileCard.jsx -- shared self-service profile card for @nomadahq/sm-ui
//
// Usage:
//   <ProfileCard variant="self" apiBase="https://api.sprintmode.ai" />
//   <ProfileCard variant="self" backHref="/dashboard" />
//
// variant="self": fetches GET /api/profile at apiBase, shows editable name/title/phone,
//   read-only email/role, avatar editor, all emails, Slack link, GWS groups, notifications.
//

import React, { useState, useEffect, useRef } from 'react'

var DEFAULT_API = 'https://api.sprintmode.ai'

// --- Formatting helpers -------------------------------------------------------

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n) {
  if (n == null) return '--'
  return '$' + Number(n).toLocaleString()
}

// --- Role badge ---------------------------------------------------------------

var ROLE_BADGE = {
  super_admin: { bg: 'hsla(0,72%,51%,.12)',   fg: '#dc2626',  label: 'Super Admin' },
  admin:       { bg: 'hsla(215,80%,55%,.12)',  fg: '#2362ea',  label: 'Admin' },
  team:        { bg: 'hsla(0,0%,0%,.07)',      fg: '#555',     label: 'Team' },
  engineer:    { bg: 'hsla(215,80%,55%,.12)',  fg: '#2362ea',  label: 'Engineer' },
  support:     { bg: 'hsla(38,92%,50%,.12)',   fg: '#d97706',  label: 'Support' },
  manager:     { bg: 'hsla(262,52%,47%,.12)',  fg: '#7947d1',  label: 'Manager' },
  member:      { bg: 'hsla(0,0%,0%,.07)',      fg: '#555',     label: 'Member' },
}

function RoleBadge({ role }) {
  var r = ROLE_BADGE[role] || { bg: 'hsla(0,0%,0%,.07)', fg: '#555', label: role || 'Member' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: r.bg, color: r.fg }}>
      {r.label}
    </span>
  )
}

// --- Avatar -------------------------------------------------------------------

function Avatar({ photoUrl, initials, size, editable, onSave }) {
  var sz = size || 56
  var [mode, setMode] = useState(null) // null | 'picker' | 'saving'
  var [urlVal, setUrlVal] = useState('')
  var fileRef = useRef(null)

  async function saveUrl() {
    if (!urlVal.trim()) return
    setMode('saving')
    await onSave(urlVal.trim())
    setMode(null)
    setUrlVal('')
  }

  async function handleFile(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setMode('saving')
    var reader = new FileReader()
    reader.onload = async function(ev) {
      await onSave(ev.target.result)
      setMode(null)
    }
    reader.readAsDataURL(file)
  }

  var circle = (
    <div style={{
      width: sz, height: sz, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'var(--accent-10, hsla(215,80%,55%,.1))',
      color: 'var(--accent, #2362ea)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: sz * 0.36, fontWeight: 800,
    }}>
      {photoUrl
        ? <img src={photoUrl} alt="" style={{ width: sz, height: sz, objectFit: 'cover', display: 'block' }} onError={function(e) { e.target.style.display = 'none' }} />
        : initials
      }
    </div>
  )

  if (!editable) return circle

  return (
    <div style={{ position: 'relative', width: sz, height: sz, flexShrink: 0 }}>
      {circle}
      {mode === null && (
        <button onClick={function() { setMode('picker') }} title="Change photo"
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
          borderRadius: 10, padding: 14, width: 270, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Change photo</div>
          <button onClick={function() { fileRef.current && fileRef.current.click() }}
            style={{ width: '100%', fontSize: 12, padding: '6px 10px', marginBottom: 8, borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg, #f9fafb)', cursor: 'pointer', textAlign: 'left' }}>
            {'\uD83D\uDCC1'} Upload from device
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <div style={{ fontSize: 11, color: 'var(--muted, #6b7280)', marginBottom: 4 }}>Or paste an image URL</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input autoFocus type="url" value={urlVal} onChange={function(e) { setUrlVal(e.target.value) }}
              onKeyDown={function(e) { if (e.key === 'Enter') saveUrl(); if (e.key === 'Escape') setMode(null) }}
              placeholder="https://..."
              style={{ flex: 1, fontSize: 12, padding: '5px 8px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, outline: 'none' }} />
            <button onClick={saveUrl} disabled={!urlVal.trim()}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'var(--accent, #2362ea)', color: '#fff', border: 'none', cursor: 'pointer', opacity: urlVal.trim() ? 1 : 0.5 }}>
              Set
            </button>
          </div>
          <button onClick={function() { setMode(null) }}
            style={{ marginTop: 8, fontSize: 11, color: 'var(--muted, #6b7280)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// --- Editable field -----------------------------------------------------------

function EditField({ label, value, onSave, type, placeholder, disabled }) {
  var [editing, setEditing] = useState(false)
  var [val, setVal] = useState(value || '')
  var [saving, setSaving] = useState(false)

  useEffect(function() { setVal(value || '') }, [value])

  async function save() {
    if (val === (value || '')) { setEditing(false); return }
    setSaving(true)
    await onSave(val)
    setSaving(false)
    setEditing(false)
  }

  var labelEl = (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>
      {label}
    </div>
  )

  if (disabled) return (
    <div>
      {labelEl}
      <div style={{ fontSize: 13, color: 'var(--foreground, #111)', lineHeight: 1.4 }}>{value || '--'}</div>
    </div>
  )

  if (editing) return (
    <div>
      {labelEl}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input autoFocus type={type || 'text'} value={val}
          onChange={function(e) { setVal(e.target.value) }}
          onKeyDown={function(e) { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: 13, padding: '4px 8px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, outline: 'none' }} />
        <button onClick={save} disabled={saving}
          style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: 'var(--accent, #2362ea)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {saving ? '...' : 'Save'}
        </button>
        <button onClick={function() { setEditing(false) }}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', cursor: 'pointer' }}>
          X
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={function() { setEditing(true) }} title="Click to edit"
      style={{ cursor: 'text', padding: '2px 4px', margin: '-2px -4px', borderRadius: 4, transition: 'background .12s' }}
      onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--bg-subtle, #f3f4f6)' }}
      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent' }}>
      {labelEl}
      <div style={{ fontSize: 13, color: val ? 'var(--foreground, #111)' : 'var(--muted, #9ca3af)', fontStyle: val ? 'normal' : 'italic', lineHeight: 1.4 }}>
        {val || (placeholder ? 'Click to add' : '--')}
      </div>
    </div>
  )
}

// --- Notification prefs toggle ------------------------------------------------

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange}
      style={{ width: 36, height: 20, borderRadius: 10,
        background: on ? 'var(--accent, #2362ea)' : 'var(--border, #e5e7eb)',
        border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .15s', padding: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left .15s' }} />
    </button>
  )
}

// --- Card wrapper style -------------------------------------------------------

var CARD_STYLE = {
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--border, #e5e7eb)',
  borderRadius: 'var(--radius, 10px)',
  padding: '18px 22px',
  marginBottom: 14,
}

var SECTION_TITLE = { fontSize: 13, fontWeight: 700, color: 'var(--foreground, #111)', marginBottom: 16 }
var LABEL = { fontSize: 11, fontWeight: 600, color: 'var(--muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3, display: 'block' }
var VAL = { fontSize: 13, color: 'var(--foreground, #111)', lineHeight: 1.4 }

// =============================================================================
// SELF MODE — for any portal's /profile page
// =============================================================================

function SelfProfileCard({ apiBase, backHref }) {
  var base = apiBase || DEFAULT_API
  var [profile, setProfile] = useState(null)
  var [loading, setLoading] = useState(true)
  var [saveMsg, setSaveMsg] = useState(null)
  var [emailNotifs, setEmailNotifs] = useState(true)
  var [appNotifs, setAppNotifs] = useState(true)
  var [slackNotifs, setSlackNotifs] = useState(false)

  useEffect(function() {
    fetch(base + '/api/profile', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(d) { if (d && d.ok && d.profile) setProfile(d.profile) })
      .catch(function() {})
      .finally(function() { setLoading(false) })
    // Load notification prefs
    fetch(base + '/api/notifications/prefs', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(d) {
        if (d && d.ok && d.data) {
          setEmailNotifs(d.data.email_enabled !== false)
          setAppNotifs(d.data.app_enabled !== false)
          setSlackNotifs(d.data.slack_enabled === true)
        }
      })
      .catch(function() {})
  }, [base])

  async function patchProfile(fields) {
    try {
      var r = await fetch(base + '/api/profile', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      var d = await r.json()
      if (d.ok && d.profile) {
        setProfile(d.profile)
        setSaveMsg('Saved')
        setTimeout(function() { setSaveMsg(null) }, 2000)
      }
    } catch {}
  }

  async function patchNotifPrefs(patch) {
    fetch(base + '/api/notifications/prefs', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(function() {})
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <div style={{ width: 24, height: 24, border: '3px solid var(--border, #e5e7eb)', borderTopColor: 'var(--accent, #2362ea)', borderRadius: '50%', animation: 'profilecard-spin 0.8s linear infinite' }} />
      <style>{'@keyframes profilecard-spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )

  if (!profile) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #6b7280)', fontSize: 13 }}>
      Could not load profile.
    </div>
  )

  var p = profile
  var initials = (p.full_name || p.email || '?').split(' ').map(function(w) { return w[0] || '' }).join('').slice(0, 2).toUpperCase()
  var role = p.portal_role || p.role || 'member'

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        {backHref && (
          <a href={backHref} style={{ fontSize: 12, color: 'var(--muted, #6b7280)', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}>
            {'\u2190'} Back
          </a>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground, #111)', margin: 0 }}>Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--muted, #6b7280)', marginTop: 3 }}>Your account details and preferences</p>
      </div>

      {/* Identity card */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar
            photoUrl={p.photo_url}
            initials={initials}
            size={56}
            editable
            onSave={function(v) { return patchProfile({ photo_url: v }) }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--foreground, #111)' }}>
                {p.full_name || '--'}
              </span>
              <RoleBadge role={role} />
              {saveMsg && <span style={{ fontSize: 12, color: 'var(--green, #16a34a)', fontWeight: 600 }}>{'\u2713'} {saveMsg}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted, #6b7280)' }}>
              {p.email}
              {p.company_name && <><span style={{ margin: '0 5px' }}>{'\u00B7'}</span>{p.company_name}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE}>Personal info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <EditField label="Full name" value={p.full_name} onSave={function(v) { return patchProfile({ full_name: v }) }} />
          <EditField label="Title" value={p.title} onSave={function(v) { return patchProfile({ title: v }) }} placeholder="e.g. VP Engineering" />
          <EditField label="Email" value={p.email} disabled />
          <EditField label="Phone" value={p.phone} onSave={function(v) { return patchProfile({ phone: v }) }} type="tel" placeholder="+1 (555) 000-0000" />
          {p.hire_date && (
            <div>
              <span style={LABEL}>Hire date</span>
              <div style={VAL}>{fmtDate(p.hire_date)}</div>
            </div>
          )}
        </div>
      </div>

      {/* All emails (if more than primary) */}
      {p.emails && p.emails.length > 1 && (
        <div style={CARD_STYLE}>
          <div style={SECTION_TITLE}>Email addresses</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.emails.map(function(em, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--foreground, #111)' }}>{em.email}</span>
                  {em.is_primary === 1 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'hsla(215,80%,55%,.1)', color: 'var(--accent, #2362ea)' }}>Primary</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--muted, #9ca3af)' }}>{em.email_type || ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Slack + GWS */}
      {(p.slack_profile_url || (p.gws_groups && p.gws_groups.length > 0)) && (
        <div style={CARD_STYLE}>
          <div style={SECTION_TITLE}>Integrations</div>
          {p.slack_profile_url && (
            <div style={{ marginBottom: 12 }}>
              <span style={LABEL}>Slack</span>
              <a href={p.slack_profile_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--accent, #2362ea)', textDecoration: 'none' }}>
                View Slack profile {'\u2197'}
              </a>
            </div>
          )}
          {p.gws_groups && p.gws_groups.length > 0 && (
            <div>
              <span style={LABEL}>Google Workspace groups</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {p.gws_groups.map(function(g, i) {
                  return (
                    <span key={i} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: 'var(--bg-subtle, #f3f4f6)', color: 'var(--foreground, #111)', border: '1px solid var(--border, #e5e7eb)' }}>
                      {g.email || g.name || g}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Own payroll (team members) */}
      {p.payroll && p.payroll.length > 0 && (
        <div style={CARD_STYLE}>
          <div style={SECTION_TITLE}>Pay history</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.payroll.map(function(row, i) {
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < p.payroll.length - 1 ? '1px solid var(--border, #e5e7eb)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{row.job_title || row.label || '--'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted, #6b7280)' }}>{fmtDate(row.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{fmtMoney(row.amount)} {row.currency || 'USD'}</div>
                    <div style={{ fontSize: 11, color: row.status === 'paid' ? 'var(--green, #16a34a)' : 'var(--muted, #9ca3af)', fontWeight: 600, textTransform: 'uppercase' }}>{row.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notification prefs */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE}>Notifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'In-app notifications', sub: 'Show in the bell icon', val: appNotifs, onChange: function() { var v = !appNotifs; setAppNotifs(v); patchNotifPrefs({ app_enabled: v }) } },
            { label: 'Email notifications', sub: 'Receive by email', val: emailNotifs, onChange: function() { var v = !emailNotifs; setEmailNotifs(v); patchNotifPrefs({ email_enabled: v }) } },
            { label: 'Slack notifications', sub: 'Receive via Slack DM', val: slackNotifs, onChange: function() { var v = !slackNotifs; setSlackNotifs(v); patchNotifPrefs({ slack_enabled: v }) } },
          ].map(function(n, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border, #e5e7eb)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground, #111)' }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>{n.sub}</div>
                </div>
                <Toggle on={n.val} onChange={n.onChange} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Security */}
      <div style={CARD_STYLE}>
        <div style={SECTION_TITLE}>Security</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Sign-in method</div>
            <div style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>Magic link, Google SSO, or Microsoft SSO to {p.email}</div>
          </div>
          {p.portal_last_login && (
            <span style={{ fontSize: 12, color: 'var(--muted, #9ca3af)' }}>
              Last login: {fmtDate(p.portal_last_login)}
            </span>
          )}
        </div>
      </div>

      {/* CRM link (SM team members can see their contact record) */}
      {p.id && p.contact_type === 'team' && (
        <div style={{ ...CARD_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>CRM contact record</div>
            <div style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>View your full contact card</div>
          </div>
          <a href={'/crm/contact/' + p.id} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent, #2362ea)', textDecoration: 'none' }}>
            Open {'\u2192'}
          </a>
        </div>
      )}

      <a href="/api/auth/logout"
        style={{ fontSize: 12, color: 'var(--muted, #9ca3af)', textDecoration: 'none' }}
        onMouseEnter={function(e) { e.target.style.color = '#dc2626' }}
        onMouseLeave={function(e) { e.target.style.color = 'var(--muted, #9ca3af)' }}>
        Sign out
      </a>
    </div>
  )
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * ProfileCard
 * Self-service profile page for any SM portal.
 * @param {object} props
 * @param {'self'} props.variant - Currently only 'self' is supported
 * @param {string} [props.apiBase] - API base URL (default: https://api.sprintmode.ai)
 * @param {string} [props.backHref] - Optional back link href shown above the page title
 */
export function ProfileCard(props) {
  return <SelfProfileCard apiBase={props.apiBase} backHref={props.backHref} />
}
