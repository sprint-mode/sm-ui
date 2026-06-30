import React, { useState } from 'react'
import { Badge } from './components.tsx'
import { FileViewer } from './FileViewer.jsx'

// ── TermCards extraction logic ──────────────────────────────────────────────
// Consolidated from sm-studios/Contracts.jsx and sm-admin/ContractDetail.tsx.
// Parses AI-generated html_content with h2/h3 headers and <strong>Key:</strong> Value pairs.

function extractSections(html) {
  var headers = []
  var re = /<h[23][^>]*>(.*?)<\/h[23]>/gi
  var m
  while ((m = re.exec(html)) !== null) {
    headers.push({ title: m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim(), pos: m.index })
  }
  if (headers.length >= 2) {
    return headers.map(function(h, i) {
      var start = h.pos
      var end = headers[i + 1] ? headers[i + 1].pos : html.length
      var chunk = html.slice(start, end).replace(/<h[23][^>]*>.*?<\/h[23]>/i, '')
      return { title: h.title, rows: extractRows(chunk), prose: extractProse(chunk) }
    })
  }
  var text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return []
  return [{ title: 'Extracted terms', rows: [], prose: text.slice(0, 800) }]
}

function extractRows(chunk) {
  var rows = []
  var kvRe = /<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>:?\s*(.*?)(?=<(?:strong|b|p|br|li|td|div|\/div)|$)/gi
  var m
  while ((m = kvRe.exec(chunk)) !== null) {
    var key = m[1].replace(/<[^>]+>/g, '').trim().replace(/:$/, '')
    var value = m[2].replace(/<[^>]+>/g, '').trim()
    if (key && value && key.length < 60) rows.push({ key: key, value: value })
  }
  var tdRe = /<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gi
  while ((m = tdRe.exec(chunk)) !== null) {
    var tKey = m[1].replace(/<[^>]+>/g, '').trim()
    var tVal = m[2].replace(/<[^>]+>/g, '').trim()
    if (tKey && tVal && tKey.length < 60 && !rows.some(function(r) { return r.key === tKey })) {
      rows.push({ key: tKey, value: tVal })
    }
  }
  var liRe = /<li[^>]*>(.*?)<\/li>/gi
  while ((m = liRe.exec(chunk)) !== null) {
    var text = m[1].replace(/<[^>]+>/g, '').trim()
    var colonIdx = text.indexOf(':')
    if (colonIdx > 0 && colonIdx < 50) rows.push({ key: text.slice(0, colonIdx).trim(), value: text.slice(colonIdx + 1).trim() })
  }
  if (rows.length === 0) {
    var plainText = chunk.replace(/<\/div>\s*<div[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').trim()
    var lines = plainText.split(/\n+/)
    lines.forEach(function(line) {
      var ci = line.indexOf(':')
      if (ci > 0 && ci < 50) {
        var pk = line.slice(0, ci).trim()
        var pv = line.slice(ci + 1).trim()
        if (pk && pv && pk.length < 60) rows.push({ key: pk, value: pv })
      }
    })
  }
  return rows.slice(0, 20)
}

function extractProse(chunk) {
  if (extractRows(chunk).length > 0) return ''
  return chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)
}

// ── TermCard ────────────────────────────────────────────────────────────────

function TermCard({ title, rows, prose }) {
  if (!rows.length && !prose) return null
  return (
    <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--muted)', marginBottom: rows.length ? 10 : 6 }}>
        {title}
      </div>
      {rows.map(function(r, i) {
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 13, borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
            <span style={{ color: 'var(--muted)' }}>{r.key}</span>
            <span style={{ fontWeight: 500, color: 'var(--foreground)', textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
          </div>
        )
      })}
      {prose && <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6 }}>{prose}</div>}
    </div>
  )
}

// ── TermCards container ─────────────────────────────────────────────────────

export function TermCards({ html, filterKeys }) {
  if (!html || html.startsWith('%PDF') || html.startsWith('JVBERi')) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 13 }}>Document terms are being processed. Download the PDF for the full agreement.</div>
      </div>
    )
  }
  var sections = extractSections(html)
  if (!sections.length) {
    return (
      <div style={{ padding: 16, background: 'var(--bg-1)', borderRadius: 8, maxHeight: 400, overflowY: 'auto', fontSize: 13, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: html }} />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sections.map(function(sec, i) {
        // Filter entire sections whose title matches a filterKey (e.g., "Resources & Rates")
        if (filterKeys && filterKeys.some(function(k) { return sec.title.toLowerCase().includes(k.toLowerCase()) })) {
          return null
        }
        var rows = filterKeys ? sec.rows.filter(function(r) {
          return !filterKeys.some(function(k) { return r.key.toLowerCase().includes(k.toLowerCase()) })
        }) : sec.rows
        return <TermCard key={i} title={sec.title} rows={rows} prose={sec.prose} />
      })}
    </div>
  )
}

// ── PipelineBar ─────────────────────────────────────────────────────────────
// Progression: Created > Sent > Viewed > Signed

var PIPELINE_STAGES = [
  { key: 'draft', label: 'Created' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'completed', label: 'Signed' },
]

export function PipelineBar({ status, dates }) {
  var stageIdx = Math.max(PIPELINE_STAGES.findIndex(function(s) { return s.key === status }), 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      {PIPELINE_STAGES.map(function(stage, i) {
        var active = i <= stageIdx
        var isLast = i === PIPELINE_STAGES.length - 1
        var dateKey = stage.key === 'draft' ? 'created_at' : stage.key === 'sent' ? 'sent_at' : stage.key === 'viewed' ? 'viewed_at' : 'completed_at'
        var dateVal = dates && dates[dateKey]

        return (
          <React.Fragment key={stage.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: active ? 'var(--accent-10, hsla(221,83%,53%,.1))' : 'var(--bg-1)',
                border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--muted)',
              }}>
                {active ? '\u2713' : i + 1}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: active ? 'var(--accent)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                {stage.label}
              </span>
              {dateVal && (
                <span style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {fmtDate(dateVal)}
                </span>
              )}
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: 2, minWidth: 20, background: i < stageIdx ? 'var(--accent)' : 'var(--border)', marginBottom: dateVal ? 28 : 16, opacity: i < stageIdx ? 0.4 : 1 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── PasswordWidget ──────────────────────────────────────────────────────────
// Masked dots with eyeball toggle + copy button

function PasswordWidget({ password }) {
  var [visible, setVisible] = useState(false)
  var [copied, setCopied] = useState(false)

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(password).then(function() {
        setCopied(true)
        setTimeout(function() { setCopied(false) }, 2000)
      })
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--foreground)', letterSpacing: visible ? '0' : '2px', minWidth: 80 }}>
        {visible ? password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
      </span>
      <button onClick={function() { setVisible(!visible) }} title={visible ? 'Hide password' : 'Show password'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--muted)' }}>
        {visible ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
      <button onClick={handleCopy} title="Copy password" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: copied ? 'var(--accent)' : 'var(--muted)' }}>
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        )}
      </button>
    </div>
  )
}

// ── DocumentDetail ──────────────────────────────────────────────────────────
// Universal 5-section document detail component.
// Used by: sm-studios, sm-investors, sm-admin, File Manager.

export function DocumentDetail({ document: doc, relatedDocs, onDownload, showProgression, filterKeys }) {
  if (!doc) return null

  var docType = doc.contract_type || doc.doc_type || 'other'
  var docName = doc.contract_number || doc.pandadoc_document_name || doc.name || docTypeLabel(docType)
  var hasHtml = doc.html_content && !doc.html_content.startsWith('%PDF') && !doc.html_content.startsWith('JVBERi')
  var pdfUrl = doc.pdf_url || doc.url || null
  // Only show progression bar for signing-flow documents (contracts), not tax/entity docs
  var SIGNING_FLOW_TYPES = ['msa', 'sales_order', 'sow', 'amendment', 'nda', 'subscription_agreement', 'llc_amendment', 'investor_agreement', 'executive_services_agreement', 'fund_side_letter', 'fund_subscription']
  var isSigningFlow = SIGNING_FLOW_TYPES.indexOf(docType) >= 0
  var shouldShowProgression = showProgression === true || (showProgression !== false && isSigningFlow && doc.status)
  var hasPassword = !!doc.doc_password

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 1. Progression bar (signing-flow contracts only) */}
      {shouldShowProgression && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 8px)', padding: '16px 20px' }}>
          <PipelineBar
            status={doc.status}
            dates={{
              created_at: doc.created_at,
              sent_at: doc.sent_at,
              viewed_at: doc.viewed_at,
              completed_at: doc.completed_at,
            }}
          />
        </div>
      )}

      {/* 2. Metadata grid */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 8px)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{docName}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-1)', color: 'var(--muted)', textTransform: 'uppercase' }}>
                {docTypeLabel(docType)}
              </span>
            </div>
          </div>
          {doc.status && (
            <Badge color={doc.status === 'completed' ? 'green' : doc.requires_action ? 'amber' : 'gray'}>
              {doc.status === 'completed' ? 'Signed' : doc.requires_action ? 'Awaiting signature' : doc.status}
            </Badge>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {metaFields(doc, docType).map(function(f) {
            return (
              <div key={f.label} style={{ background: 'var(--bg-1)', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4, fontWeight: 500 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{f.value}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Extracted terms */}
      {hasHtml && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 8px)', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 14 }}>Extracted terms</div>
          <TermCards html={doc.html_content} filterKeys={filterKeys} />
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-1)', borderRadius: 6, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
            Terms extracted from signed document. Download the PDF for the full legally binding version.
          </div>
        </div>
      )}

      {/* 4. Document viewer + download */}
      {pdfUrl && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 8px)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)' }}>Document</div>
            {hasPassword ? (
              <a
                href={onDownload ? undefined : (pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 'download=1')}
                onClick={onDownload ? function(e) { e.preventDefault(); onDownload(doc, true) } : undefined}
                download target="_blank" rel="noopener noreferrer"
                style={downloadBtnStyle}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Download encrypted
              </a>
            ) : (
              <a
                href={onDownload ? undefined : pdfUrl}
                onClick={onDownload ? function(e) { e.preventDefault(); onDownload(doc, false) } : undefined}
                download target="_blank" rel="noopener noreferrer"
                style={downloadBtnStyle}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </a>
            )}
          </div>
          {hasPassword && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Document password (needed to open the PDF):</div>
              <PasswordWidget password={doc.doc_password} />
            </div>
          )}
          <FileViewer url={pdfUrl} filename={fileNameFromUrl(pdfUrl) || (docName + '.pdf')} />
        </div>
      )}

      {/* 5. Related agreements */}
      {relatedDocs && relatedDocs.length > 0 && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 8px)', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 14 }}>Related agreements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {relatedDocs.map(function(rd) {
              var rdType = rd.contract_type || rd.doc_type || 'other'
              var rdName = rd.contract_number || rd.pandadoc_document_name || rd.name || docTypeLabel(rdType)
              var isCurrent = rd.id === doc.id
              return (
                <div key={rd.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 6,
                  background: isCurrent ? 'var(--accent-10, hsla(221,83%,53%,.1))' : 'var(--bg-1)',
                  border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isCurrent ? 'var(--accent-10, hsla(221,83%,53%,.08))' : 'var(--bg-2, var(--bg))', color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {docTypeLabel(rdType)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? 'var(--accent)' : 'var(--foreground)' }}>{rdName}</span>
                  {rd.status && (
                    <Badge color={rd.status === 'completed' ? 'green' : 'gray'} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {rd.status === 'completed' ? 'Signed' : rd.status}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileNameFromUrl(url) {
  if (!url) return null
  try {
    var path = new URL(url, 'https://x').pathname
    var last = path.split('/').pop()
    if (last && last.indexOf('.') > 0) return decodeURIComponent(last)
  } catch (_e) { /* ignore */ }
  return null
}

function fmtDate(d) {
  if (!d) return '\u2014'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch (_e) { return d }
}

export function docTypeLabel(t) {
  if (!t) return 'Document'
  var m = {
    msa: 'MSA', sales_order: 'Sales Order', amendment: 'Amendment', nda: 'NDA',
    subscription_agreement: 'Purchase Agreement', llc_amendment: 'LLC Amendment',
    investor_agreement: 'Grant Agreement', k1: 'K-1',
    pupa: 'Purchase Agreement', miaga: 'Grant Agreement',
    amended_llc: 'LLC Amendment', legal: 'Legal', tax: 'Tax',
    statement: 'Statement', quarterly_report: 'Quarterly Report',
    '1065': '1065', state_return: 'State Return', adjusting_je: 'Adjusting JE',
    fund_side_letter: 'Side Letter', fund_subscription: 'Subscription',
    capital_call: 'Capital Call', capital_account: 'Capital Account',
    fund_financials: 'Financials',
    executive_services_agreement: 'Executive Services',
    incumbency_certificate: 'Incumbency', ein_letter: 'EIN Letter',
  }
  return m[t] || t.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase() })
}

function metaFields(doc, docType) {
  var fields = []

  // Common fields
  if (doc.start_date) fields.push({ label: 'Start date', value: fmtDate(doc.start_date) })
  if (doc.end_date) fields.push({ label: 'End date', value: fmtDate(doc.end_date) })
  fields.push({ label: 'Type', value: docTypeLabel(docType) })
  if (doc.completed_at) fields.push({ label: 'Signed on', value: fmtDate(doc.completed_at) })

  // Type-specific fields
  if (docType === 'sales_order' || docType === 'msa') {
    if (doc.auto_renewal) fields.push({ label: 'Renewal', value: 'Auto-renews' })
    if (doc.notice_period_days) fields.push({ label: 'Notice period', value: doc.notice_period_days + ' days' })
    if (doc.payment_terms) fields.push({ label: 'Payment terms', value: doc.payment_terms })
  }

  if (docType === 'k1') {
    if (doc.year) fields.push({ label: 'Tax year', value: doc.year })
  }

  if (docType === 'subscription_agreement') {
    if (doc.share_class) fields.push({ label: 'Share class', value: doc.share_class })
  }

  // Entity docs
  if (doc.source_entity) fields.push({ label: 'Entity', value: doc.source_entity })
  if (doc.target_entity) fields.push({ label: 'Target', value: doc.target_entity })
  if (doc.year && docType !== 'k1') fields.push({ label: 'Year', value: doc.year })

  return fields
}

var downloadBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 12, padding: '6px 14px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)',
  color: 'var(--foreground)', textDecoration: 'none', background: 'none',
  cursor: 'pointer',
}
