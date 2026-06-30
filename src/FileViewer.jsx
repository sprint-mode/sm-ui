import React, { useState, useEffect, useRef } from 'react'

// ── CDN Loaders ────────────────────────────────────────────────────────────
// All heavy libraries load on-demand from CDN to avoid bloating sm-ui bundle.

var PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168'
var XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
var MAMMOTH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.11.0/mammoth.browser.min.js'

var pdfjsLib = null
var xlsxLib = null
var mammothLib = null

function loadPdfjs() {
  if (pdfjsLib) return Promise.resolve(pdfjsLib)
  return new Promise(function(resolve, reject) {
    var importScript = document.createElement('script')
    importScript.type = 'module'
    importScript.textContent = 'import * as pdfjsLib from "' + PDFJS_CDN + '/pdf.min.mjs"; window.__pdfjsLib = pdfjsLib; window.__pdfjsLib.GlobalWorkerOptions.workerSrc = "' + PDFJS_CDN + '/pdf.worker.min.mjs"; window.dispatchEvent(new Event("pdfjs-ready"));'
    document.head.appendChild(importScript)
    function onReady() {
      window.removeEventListener('pdfjs-ready', onReady)
      pdfjsLib = window.__pdfjsLib
      resolve(pdfjsLib)
    }
    window.addEventListener('pdfjs-ready', onReady)
    setTimeout(function() { reject(new Error('PDF.js load timeout')) }, 15000)
  })
}

function loadScript(src, globalName) {
  return new Promise(function(resolve, reject) {
    if (window[globalName]) return resolve(window[globalName])
    var script = document.createElement('script')
    script.src = src
    script.onload = function() {
      if (window[globalName]) resolve(window[globalName])
      else reject(new Error(globalName + ' not found after script load'))
    }
    script.onerror = function() { reject(new Error('Failed to load ' + globalName)) }
    document.head.appendChild(script)
    setTimeout(function() { reject(new Error(globalName + ' load timeout')) }, 15000)
  })
}

function loadXlsx() {
  if (xlsxLib) return Promise.resolve(xlsxLib)
  return loadScript(XLSX_CDN, 'XLSX').then(function(lib) {
    xlsxLib = lib
    return lib
  })
}

function loadMammoth() {
  if (mammothLib) return Promise.resolve(mammothLib)
  return loadScript(MAMMOTH_CDN, 'mammoth').then(function(lib) {
    mammothLib = lib
    return lib
  })
}

// ── File type detection ────────────────────────────────────────────────────

function getExt(filename) {
  if (!filename) return ''
  return (filename.split('.').pop() || '').toLowerCase()
}

var PDF_EXTS = ['pdf']
var IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
var EXCEL_EXTS = ['xlsx', 'xls', 'csv']
var WORD_EXTS = ['docx']
var DOWNLOAD_ONLY_EXTS = ['pptx', 'ppt', 'key', 'numbers', 'pages']

function getFileType(filename) {
  var ext = getExt(filename)
  if (PDF_EXTS.indexOf(ext) >= 0) return 'pdf'
  if (IMAGE_EXTS.indexOf(ext) >= 0) return 'image'
  if (EXCEL_EXTS.indexOf(ext) >= 0) return 'excel'
  if (WORD_EXTS.indexOf(ext) >= 0) return 'word'
  if (DOWNLOAD_ONLY_EXTS.indexOf(ext) >= 0) return 'download'
  return 'download'
}

// ── Shared styles ──────────────────────────────────────────────────────────

var viewerBtnStyle = {
  background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)',
  padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
  color: 'var(--foreground)',
}

var containerStyle = function(maxHeight) {
  return {
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)',
    overflow: 'auto', maxHeight: maxHeight || 800,
    background: '#f5f5f5',
  }
}

// ── PDF Renderer ───────────────────────────────────────────────────────────

function PdfRenderer({ url, maxHeight }) {
  var containerRef = useRef(null)
  var [pdfDoc, setPdfDoc] = useState(null)
  var [numPages, setNumPages] = useState(0)
  var [scale, setScale] = useState(1.2)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)

  useEffect(function() {
    if (!url) return
    setLoading(true)
    setError(null)
    loadPdfjs().then(function(lib) {
      return lib.getDocument({ url: url, withCredentials: true }).promise
    }).then(function(pdf) {
      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
      setLoading(false)
    }).catch(function() {
      setError('Unable to load PDF')
      setLoading(false)
    })
  }, [url])

  useEffect(function() {
    if (!pdfDoc || !containerRef.current) return
    var container = containerRef.current
    container.innerHTML = ''
    var dpr = window.devicePixelRatio || 1

    for (var i = 1; i <= pdfDoc.numPages; i++) {
      (function(pageNum) {
        pdfDoc.getPage(pageNum).then(function(pg) {
          var viewport = pg.getViewport({ scale: scale })
          var canvas = document.createElement('canvas')
          canvas.width = viewport.width * dpr
          canvas.height = viewport.height * dpr
          canvas.style.width = viewport.width + 'px'
          canvas.style.height = viewport.height + 'px'
          canvas.style.display = 'block'
          if (pageNum > 1) canvas.style.marginTop = '8px'
          var context = canvas.getContext('2d')
          context.setTransform(dpr, 0, 0, dpr, 0, 0)
          pg.render({ canvasContext: context, viewport: viewport })
          var existing = container.children
          if (pageNum - 1 >= existing.length) {
            container.appendChild(canvas)
          } else {
            container.insertBefore(canvas, existing[pageNum - 1])
          }
        })
      })(i)
    }
  }, [pdfDoc, scale])

  if (error) return <ViewerError message={error} />
  if (loading) return <ViewerLoading message="Loading document..." />

  return (
    <div>
      <ZoomControls scale={scale} setScale={setScale} pageCount={numPages} />
      <div style={{ ...containerStyle(maxHeight), display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8 }}>
        <div ref={containerRef} />
      </div>
    </div>
  )
}

// ── Image Viewer ───────────────────────────────────────────────────────────

function ImageViewer({ url, filename, maxHeight }) {
  var [scale, setScale] = useState(1)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)
  var [lightbox, setLightbox] = useState(false)

  return (
    <div>
      <ZoomControls scale={scale} setScale={setScale} />
      <div style={{ ...containerStyle(maxHeight), display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16 }}>
        {error ? (
          <ViewerError message="Unable to load image" />
        ) : (
          <>
            {loading && <ViewerLoading message="Loading image..." />}
            <img
              src={url}
              alt={filename || 'Image preview'}
              crossOrigin="use-credentials"
              onLoad={function() { setLoading(false) }}
              onError={function() { setError(true); setLoading(false) }}
              onClick={function() { setLightbox(true) }}
              style={{
                display: loading ? 'none' : 'block',
                maxWidth: '100%',
                transform: 'scale(' + scale + ')',
                transformOrigin: 'top center',
                cursor: 'zoom-in',
                transition: 'transform 0.15s ease',
              }}
            />
          </>
        )}
      </div>

      {lightbox && (
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
            src={url}
            alt={filename || 'Image preview'}
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
            {'\u2715'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Excel Viewer ───────────────────────────────────────────────────────────

function ExcelViewer({ url, filename, maxHeight }) {
  var [sheets, setSheets] = useState(null)
  var [activeSheet, setActiveSheet] = useState(0)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)

  useEffect(function() {
    if (!url) return
    setLoading(true)
    setError(null)

    var ext = getExt(filename)

    Promise.all([
      loadXlsx(),
      fetch(url, { credentials: 'include' }).then(function(r) {
        if (!r.ok) throw new Error('Fetch failed: ' + r.status)
        return ext === 'csv' ? r.text() : r.arrayBuffer()
      }),
    ]).then(function(results) {
      var XLSX = results[0]
      var data = results[1]
      var wb
      if (ext === 'csv') {
        wb = XLSX.read(data, { type: 'string' })
      } else {
        wb = XLSX.read(new Uint8Array(data), { type: 'array' })
      }

      var parsed = wb.SheetNames.map(function(name) {
        var ws = wb.Sheets[name]
        var json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        return { name: name, rows: json }
      })
      setSheets(parsed)
      setLoading(false)
    }).catch(function() {
      setError('Unable to load spreadsheet')
      setLoading(false)
    })
  }, [url, filename])

  if (error) return <ViewerError message={error} />
  if (loading) return <ViewerLoading message="Loading spreadsheet..." />
  if (!sheets || !sheets.length) return <ViewerError message="No data found in spreadsheet" />

  var current = sheets[activeSheet]
  if (!current) return null

  return (
    <div>
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '1px solid var(--border)', overflow: 'auto' }}>
          {sheets.map(function(sheet, i) {
            var active = i === activeSheet
            return (
              <button
                key={sheet.name}
                onClick={function() { setActiveSheet(i) }}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: active ? 600 : 400,
                  border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'none', color: active ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {sheet.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ ...containerStyle(maxHeight), background: 'var(--bg, #fff)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          {current.rows.length > 0 && (
            <thead>
              <tr>
                {current.rows[0].map(function(cell, ci) {
                  return (
                    <th key={ci} style={{
                      padding: '6px 10px', textAlign: 'left', fontWeight: 600,
                      borderBottom: '2px solid var(--border)', background: 'var(--bg-1, #f9fafb)',
                      color: 'var(--foreground)', whiteSpace: 'nowrap', position: 'sticky', top: 0,
                    }}>
                      {cell != null ? String(cell) : ''}
                    </th>
                  )
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {current.rows.slice(1).map(function(row, ri) {
              return (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--bg-1, #f9fafb)' }}>
                  {row.map(function(cell, ci) {
                    return (
                      <td key={ci} style={{
                        padding: '5px 10px', borderBottom: '0.5px solid var(--border)',
                        color: 'var(--foreground)', whiteSpace: 'nowrap',
                      }}>
                        {cell != null ? String(cell) : ''}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {current.rows.length <= 1 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Sheet is empty
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
        {current.rows.length > 1 ? (current.rows.length - 1) + ' row' + (current.rows.length - 1 !== 1 ? 's' : '') : 'No data'}
        {sheets.length > 1 ? ' \u00b7 ' + sheets.length + ' sheets' : ''}
      </div>
    </div>
  )
}

// ── Word Viewer ────────────────────────────────────────────────────────────

function WordViewer({ url, maxHeight }) {
  var [html, setHtml] = useState(null)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)

  useEffect(function() {
    if (!url) return
    setLoading(true)
    setError(null)

    Promise.all([
      loadMammoth(),
      fetch(url, { credentials: 'include' }).then(function(r) {
        if (!r.ok) throw new Error('Fetch failed: ' + r.status)
        return r.arrayBuffer()
      }),
    ]).then(function(results) {
      var mam = results[0]
      var buf = results[1]
      return mam.convertToHtml({ arrayBuffer: buf })
    }).then(function(result) {
      setHtml(result.value)
      setLoading(false)
    }).catch(function() {
      setError('Unable to load document')
      setLoading(false)
    })
  }, [url])

  if (error) return <ViewerError message={error} />
  if (loading) return <ViewerLoading message="Loading document..." />

  return (
    <div style={{
      ...containerStyle(maxHeight),
      background: 'var(--bg, #fff)', padding: '24px 32px',
    }}>
      <div
        className="file-viewer-word"
        dangerouslySetInnerHTML={{ __html: html || '' }}
        style={{
          fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)',
          wordWrap: 'break-word', overflowWrap: 'break-word',
        }}
      />
    </div>
  )
}

// ── Download Fallback ──────────────────────────────────────────────────────

function DownloadFallback({ url, filename }) {
  var ext = getExt(filename)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)',
      background: 'var(--bg-1, #f9fafb)',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>
        {ext === 'pptx' || ext === 'ppt' || ext === 'key' ? '\ud83d\udcca' : '\ud83d\udcc4'}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 4 }}>
        {filename || 'File'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Preview not available for this file type
      </div>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, padding: '8px 20px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm, 6px)',
          color: 'var(--foreground)', textDecoration: 'none', background: 'var(--bg, #fff)',
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </a>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────

function ViewerLoading({ message }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
      {message || 'Loading...'}
    </div>
  )
}

function ViewerError({ message }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
      {message || 'Unable to load file'}
    </div>
  )
}

function ZoomControls({ scale, setScale, pageCount }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', marginBottom: 8 }}>
      {pageCount != null ? (
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
      ) : (
        <span />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={function() { setScale(Math.max(0.5, Math.round((scale - 0.2) * 10) / 10)) }} style={viewerBtnStyle} title="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button onClick={function() { setScale(Math.min(3, Math.round((scale + 0.2) * 10) / 10)) }} style={viewerBtnStyle} title="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── FileViewer (main export) ───────────────────────────────────────────────
// Routes by file extension to the appropriate renderer.
//
// Props:
//   url      - authenticated URL (R2 signed URL or API endpoint)
//   filename - for type detection from extension
//   maxHeight - scrollable container height (default 800)

export function FileViewer({ url, filename, maxHeight }) {
  if (!url) return null

  var type = getFileType(filename)

  if (type === 'pdf')   return <PdfRenderer url={url} maxHeight={maxHeight} />
  if (type === 'image') return <ImageViewer url={url} filename={filename} maxHeight={maxHeight} />
  if (type === 'excel') return <ExcelViewer url={url} filename={filename} maxHeight={maxHeight} />
  if (type === 'word')  return <WordViewer url={url} maxHeight={maxHeight} />
  return <DownloadFallback url={url} filename={filename} />
}

// Export type detection for consumers (e.g., UpdateAttachments expand logic)
export function isViewableFile(filename) {
  var type = getFileType(filename)
  return type !== 'download'
}
