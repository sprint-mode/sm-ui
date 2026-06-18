import React from 'react'

export function Card({ children, className, style, accent }) {
  var cls = 'sm-card' + (className ? ' ' + className : '')
  var s = accent ? Object.assign({}, style || {}, { borderColor: accent, borderWidth: 2 }) : style
  return <div className={cls} style={s}>{children}</div>
}

export function CardBody({ children, style }) {
  return <div className="sm-card-body" style={style}>{children}</div>
}

export function Pill({ children, color, style }) {
  var cls = 'sm-pill sm-pill-' + (color || 'gray')
  return <span className={cls} style={style}>{children}</span>
}

export function Badge({ children, color, style }) {
  var cls = 'sm-badge sm-badge-' + (color || 'gray')
  return <span className={cls} style={style}>{children}</span>
}

export function Button({ children, variant, size, onClick, disabled, style, href, type }) {
  var cls = 'sm-btn'
  if (variant === 'primary') cls += ' sm-btn-primary'
  else if (variant === 'danger') cls += ' sm-btn-danger'
  else cls += ' sm-btn-secondary'
  if (size === 'sm') cls += ' sm-btn-sm'
  if (size === 'lg') cls += ' sm-btn-lg'

  if (href) return <a href={href} className={cls} style={style}>{children}</a>
  return <button className={cls} onClick={onClick} disabled={disabled} style={style} type={type || 'button'}>{children}</button>
}

export function StatCard({ label, value, sub, valueColor, valueSize }) {
  return (
    <div className="sm-stat">
      <div className="sm-stat-label">{label}</div>
      <div className="sm-stat-value" style={{ color: valueColor, fontSize: valueSize }}>{value}</div>
      {sub && <div className="sm-stat-sub">{sub}</div>}
    </div>
  )
}

export function Stats({ children }) {
  return <div className="sm-stats">{children}</div>
}

export function Progress({ value, color }) {
  return (
    <div className="sm-progress">
      <div className="sm-progress-fill" style={{ width: (value || 0) + '%', background: color || 'var(--accent)' }} />
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="sm-tabs">
      {tabs.map(function(tab) {
        return (
          <button
            key={tab.key}
            className={'sm-tab' + (active === tab.key ? ' active' : '')}
            onClick={function() { onChange(tab.key) }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function PageHeader({ breadcrumb, breadcrumbProduct, title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && (
        <div className="sm-bc">
          {breadcrumbProduct && <span className="sm-bc-product">{breadcrumbProduct}</span>}
          {breadcrumbProduct && ' / '}
          {breadcrumb}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="portal-page-title">{title}</h1>
          {subtitle && <p className="portal-page-sub">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Table({ headers, rows, empty, onRowClick, sortable }) {
  // Sorting — auto-enabled when headers are objects with .key/.label
  var hasObjectHeaders = headers && headers.length > 0 && typeof headers[0] === 'object'
  var enableSort = sortable !== false && hasObjectHeaders
  var _sort = React.useState({ col: null, dir: 'asc' })
  var sort = _sort[0]; var setSort = _sort[1]

  if (!rows || rows.length === 0) {
    return empty || <Empty title="No data" message="Nothing to show yet." />
  }

  function handleSort(col) {
    setSort(function(prev) {
      return { col: col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  var sorted = rows
  if (enableSort && sort.col !== null) {
    sorted = rows.slice().sort(function(a, b) {
      var av = a.sortValues ? a.sortValues[sort.col] : a.cells[sort.col]
      var bv = b.sortValues ? b.sortValues[sort.col] : b.cells[sort.col]
      if (typeof av === 'object' && av !== null && av.props) av = av.props.children || ''
      if (typeof bv === 'object' && bv !== null && bv.props) bv = bv.props.children || ''
      var na = parseFloat(String(av).replace(/[^0-9.-]/g, ''))
      var nb = parseFloat(String(bv).replace(/[^0-9.-]/g, ''))
      if (!isNaN(na) && !isNaN(nb)) return sort.dir === 'asc' ? na - nb : nb - na
      var sa = String(av || '').toLowerCase()
      var sb = String(bv || '').toLowerCase()
      if (sa < sb) return sort.dir === 'asc' ? -1 : 1
      if (sa > sb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
  }

  return (
    <table className="sm-table">
      <thead>
        <tr>
          {headers.map(function(h, i) {
            if (!enableSort) return <th key={i}>{typeof h === 'object' ? h.label : h}</th>
            var label = h.label || h
            var align = h.align || 'left'
            var arrow = sort.col === i ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''
            return <th key={i} onClick={function() { handleSort(i) }} style={{ cursor: 'pointer', userSelect: 'none', textAlign: align, whiteSpace: 'nowrap' }}>{label}{arrow}</th>
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map(function(row, ri) {
          return (
            <tr key={row.key || ri} onClick={onRowClick ? function() { onRowClick(row, ri) } : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {row.cells.map(function(cell, ci) {
                var align = enableSort && headers[ci] && headers[ci].align ? headers[ci].align : undefined
                return <td key={ci} style={align ? { textAlign: align } : undefined}>{cell}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function Empty({ icon, title, message }) {
  return (
    <div className="sm-empty">
      {icon && <div className="sm-empty-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
    </div>
  )
}

export function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
}

export function ScoreRing({ score, label }) {
  var offset = 314 - (314 * (score || 0) / 100)
  return (
    <div className="sm-score-ring">
      <svg viewBox="0 0 120 120">
        <circle className="track" cx="60" cy="60" r="50" />
        <circle className="fill" cx="60" cy="60" r="50" strokeDasharray="314" strokeDashoffset={offset} />
      </svg>
      <div className="sm-score-number">
        <span className="num">{score || 0}</span>
        <span className="lbl">{label || 'Score'}</span>
      </div>
    </div>
  )
}

// ── Explainer Drawer ─────────────────────────────────────────────────────────
// Info icon that opens a slide-down drawer. Inline next to any heading.
// Usage: <Explainer title="Section">{...content...}</Explainer>

export function Explainer({ children, title }) {
  var ref = React.useRef(null)
  var state = React.useState(false)
  var isOpen = state[0]
  var setOpen = state[1]

  React.useEffect(function() {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return function() { document.removeEventListener('keydown', onKey) }
  }, [isOpen])

  React.useEffect(function() {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return function() { document.body.style.overflow = '' }
  }, [isOpen])

  return React.createElement(React.Fragment, null,
    React.createElement('button', {
      className: 'sm-explainer-icon',
      onClick: function() { setOpen(true) },
      'aria-label': 'Show guide' + (title ? ' for ' + title : ''),
      title: title ? title + ' Guide' : 'Guide',
    },
      React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
        React.createElement('path', { d: 'M12 16v-4' }),
        React.createElement('path', { d: 'M12 8h.01' })
      )
    ),

    React.createElement('div', {
      className: 'sm-explainer-backdrop' + (isOpen ? ' sm-explainer-open' : ''),
      onClick: function(e) { if (e.target === e.currentTarget) setOpen(false) },
    },
      React.createElement('div', {
        ref: ref,
        className: 'sm-explainer-drawer' + (isOpen ? ' sm-explainer-open' : ''),
      },
        React.createElement('div', { className: 'sm-explainer-header' },
          title ? React.createElement('h3', { className: 'sm-explainer-title' }, title) : null,
          React.createElement('button', {
            className: 'sm-explainer-close',
            onClick: function() { setOpen(false) },
            'aria-label': 'Close',
          }, '\u2715')
        ),
        React.createElement('div', { className: 'sm-explainer-body' }, children)
      )
    )
  )
}

// ── Column width persistence (module-level, survives unmount/remount) ────────
var _dtWidthStore = {}

export function DataTable(props) {
  var headers = props.headers || []
  var rows = props.rows || []
  var columnPicker = props.columnPicker || false
  var storageKey = props.storageKey || null
  var onRowClick = props.onRowClick || null
  var empty = props.empty || null
  var enableSort = props.sortable !== false

  // Column visibility
  var _vis = React.useState(function() {
    var m = {}; headers.forEach(function(h) { m[h.key] = true }); return m
  })
  var colVis = _vis[0]; var setColVis = _vis[1]

  // Column order
  var _order = React.useState(function() { return headers.map(function(h) { return h.key }) })
  var colOrder = _order[0]; var setColOrder = _order[1]

  // Sorting
  var _sort = React.useState({ col: null, dir: 'asc' })
  var sort = _sort[0]; var setSort = _sort[1]

  // Column widths — init from module store if storageKey present
  var _widths = React.useState(function() {
    return (storageKey && _dtWidthStore[storageKey]) || {}
  })
  var colWidths = _widths[0]; var setColWidths = _widths[1]

  // Column picker dropdown
  var _pickerOpen = React.useState(false)
  var pickerOpen = _pickerOpen[0]; var setPickerOpen = _pickerOpen[1]
  var pickerRef = React.useRef(null)

  // Drag state
  var dragKey = React.useRef(null)
  var resizing = React.useRef(false)

  // Close picker on outside click
  React.useEffect(function() {
    if (!pickerOpen) return
    var onDoc = function(e) { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return function() { document.removeEventListener('mousedown', onDoc) }
  }, [pickerOpen])

  // Build visible headers in order
  var headerMap = {}
  headers.forEach(function(h) { headerMap[h.key] = h })
  var visibleHeaders = colOrder.filter(function(k) { return colVis[k] && headerMap[k] }).map(function(k) { return headerMap[k] })

  // Map original header index for each visible header so cells align correctly
  var cellIndexMap = visibleHeaders.map(function(h) {
    return headers.indexOf(h)
  })

  // Sort rows
  var sorted = rows
  if (enableSort && sort.col !== null) {
    sorted = rows.slice().sort(function(a, b) {
      var origIdx = cellIndexMap[sort.col]
      var av = a.sortValues ? a.sortValues[origIdx] : a.cells[origIdx]
      var bv = b.sortValues ? b.sortValues[origIdx] : b.cells[origIdx]
      if (typeof av === 'object' && av !== null && av.props) av = av.props.children || ''
      if (typeof bv === 'object' && bv !== null && bv.props) bv = bv.props.children || ''
      var na = parseFloat(String(av).replace(/[^0-9.-]/g, ''))
      var nb = parseFloat(String(bv).replace(/[^0-9.-]/g, ''))
      if (!isNaN(na) && !isNaN(nb)) return sort.dir === 'asc' ? na - nb : nb - na
      var sa = String(av || '').toLowerCase()
      var sb = String(bv || '').toLowerCase()
      if (sa < sb) return sort.dir === 'asc' ? -1 : 1
      if (sa > sb) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
  }

  // No data
  if (!rows || rows.length === 0) {
    return empty || React.createElement(Empty, { title: 'No data', message: 'Nothing to show yet.' })
  }

  function widthOf(key) { return colWidths[key] || (headerMap[key] && headerMap[key].width) || 150 }

  function handleSort(idx) {
    if (resizing.current) return
    setSort(function(prev) {
      return { col: idx, dir: prev.col === idx && prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  function onDrop(targetKey) {
    var from = dragKey.current; dragKey.current = null
    if (!from || from === targetKey) return
    var order = colOrder.slice()
    var fi = order.indexOf(from)
    var ti = order.indexOf(targetKey)
    if (fi < 0 || ti < 0) return
    order.splice(ti, 0, order.splice(fi, 1)[0])
    setColOrder(order)
  }

  function startResize(key) {
    return function(e) {
      e.preventDefault(); e.stopPropagation()
      resizing.current = true
      var sx = e.clientX
      var sw = widthOf(key)
      var mv = function(ev) {
        setColWidths(function(p) {
          var next = Object.assign({}, p)
          next[key] = Math.max(60, sw + (ev.clientX - sx))
          return next
        })
      }
      var up = function() {
        window.removeEventListener('mousemove', mv)
        window.removeEventListener('mouseup', up)
        setTimeout(function() { resizing.current = false }, 0)
        if (storageKey) {
          setColWidths(function(p) { _dtWidthStore[storageKey] = p; return p })
        }
      }
      window.addEventListener('mousemove', mv)
      window.addEventListener('mouseup', up)
    }
  }

  var resizeStyle = { position: 'absolute', top: 0, right: 0, width: 7, height: '100%', cursor: 'col-resize', userSelect: 'none' }

  return React.createElement('div', { style: { position: 'relative' } },
    columnPicker && React.createElement('div', { ref: pickerRef, style: { position: 'absolute', top: -32, right: 0, zIndex: 10 } },
      React.createElement('button', {
        type: 'button',
        onClick: function() { setPickerOpen(function(o) { return !o }) },
        style: { fontSize: 11, padding: '3px 8px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', cursor: 'pointer' }
      }, 'Columns'),
      pickerOpen && React.createElement('div', {
        style: { position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 200, maxHeight: 300, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.14)', padding: 6, zIndex: 200 }
      }, headers.map(function(h) {
        return React.createElement('label', { key: h.key, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', borderRadius: 4 } },
          React.createElement('input', { type: 'checkbox', checked: !!colVis[h.key], onChange: function() { setColVis(function(p) { var n = Object.assign({}, p); n[h.key] = !p[h.key]; return n }) } }),
          React.createElement('span', null, h.label)
        )
      }))
    ),
    React.createElement('div', { style: { overflowX: 'auto', overflowY: 'auto', maxHeight: '72vh' } },
      React.createElement('table', { style: { borderCollapse: 'collapse', tableLayout: 'fixed', width: 'max-content', minWidth: '100%' } },
        React.createElement('colgroup', null, visibleHeaders.map(function(h) {
          return React.createElement('col', { key: h.key, style: { width: widthOf(h.key) } })
        })),
        React.createElement('thead', null,
          React.createElement('tr', null, visibleHeaders.map(function(h, i) {
            var arrow = sort.col === i ? (sort.dir === 'asc' ? ' \u2191' : ' \u2193') : ''
            var isNumeric = h.numeric
            return React.createElement('th', {
              key: h.key,
              draggable: true,
              onDragStart: function(e) { if (resizing.current) { e.preventDefault(); return } dragKey.current = h.key },
              onDragOver: function(e) { e.preventDefault() },
              onDrop: function() { onDrop(h.key) },
              onClick: enableSort ? function() { handleSort(i) } : undefined,
              style: { position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-subtle)', cursor: enableSort ? 'pointer' : 'grab', userSelect: 'none', whiteSpace: 'nowrap', textAlign: isNumeric ? 'right' : 'left', paddingRight: isNumeric ? 12 : undefined, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }
            },
              h.label + arrow,
              React.createElement('span', {
                draggable: false,
                onClick: function(e) { e.stopPropagation() },
                onMouseDown: startResize(h.key),
                style: resizeStyle
              })
            )
          }))
        ),
        React.createElement('tbody', null,
          sorted.map(function(row, ri) {
            return React.createElement('tr', {
              key: row.key || ri,
              onClick: onRowClick ? function() { onRowClick(row, ri) } : undefined,
              style: Object.assign({}, onRowClick ? { cursor: 'pointer' } : {})
            }, visibleHeaders.map(function(h, ci) {
              var origIdx = cellIndexMap[ci]
              var cell = row.cells[origIdx]
              var isNumeric = h.numeric
              var cellStr = String(cell == null ? '' : cell)
              var numVal = isNumeric ? parseFloat(cellStr.replace(/[^0-9.-]/g, '')) : NaN
              var isMoney = isNumeric && !isNaN(numVal)
              return React.createElement('td', {
                key: h.key,
                style: {
                  fontSize: 12,
                  padding: '12px',
                  borderBottom: '1px solid var(--border)',
                  textAlign: isNumeric ? 'right' : 'left',
                  paddingRight: isNumeric ? 12 : undefined,
                  fontFamily: isMoney ? 'var(--font-mono)' : undefined,
                  fontWeight: isMoney ? 600 : 400,
                  color: isMoney ? (numVal < 0 ? 'var(--red)' : 'var(--foreground)') : 'var(--foreground)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }, cell == null ? '\u2014' : cell)
            }))
          })
        )
      )
    )
  )
}

export function MultiSelect(props) {
  var label = props.label || ''
  var options = props.options || []
  var selected = props.selected || []
  var onChange = props.onChange || function() {}
  var width = props.width || 'auto'
  var placeholder = props.placeholder || 'Search...'
  var className = props.className || ''

  var _open = React.useState(false)
  var open = _open[0]; var setOpen = _open[1]
  var _q = React.useState('')
  var q = _q[0]; var setQ = _q[1]
  var ref = React.useRef(null)

  React.useEffect(function() {
    var onDoc = function(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return function() { document.removeEventListener('mousedown', onDoc) }
  }, [])

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(function(x) { return x !== id }) : selected.concat([id]))
  }

  var filtered = q ? options.filter(function(o) { return (o.name || '').toLowerCase().indexOf(q.toLowerCase()) >= 0 }) : options
  var btnWidth = typeof width === 'number' ? width : undefined
  var dropWidth = typeof width === 'number' ? Math.max(width, 230) : 230

  return React.createElement('div', { ref: ref, className: className, style: { position: 'relative', display: 'inline-block' } },
    React.createElement('button', {
      type: 'button',
      onClick: function() { setOpen(function(o) { return !o }) },
      className: 'btn',
      style: { fontSize: 12, padding: '4px 10px', width: btnWidth, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }
    },
      React.createElement('span', {
        style: { color: selected.length ? 'var(--foreground)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
      }, label + (selected.length ? ' (' + selected.length + ')' : '')),
      React.createElement('span', {
        style: { display: 'inline-block', width: 0, height: 0, marginLeft: 2, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--muted)' }
      })
    ),
    open && React.createElement('div', {
      style: { position: 'absolute', top: '100%', left: 0, zIndex: 200, marginTop: 4, width: dropWidth, maxHeight: 300, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.14)', padding: 6 }
    },
      React.createElement('input', {
        autoFocus: true, value: q, onChange: function(e) { setQ(e.target.value) }, placeholder: placeholder,
        style: { width: '100%', fontSize: 12, padding: '5px 8px', marginBottom: 6, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--foreground)', boxSizing: 'border-box' }
      }),
      selected.length > 0 && React.createElement('div', {
        onClick: function() { onChange([]) },
        style: { fontSize: 11, color: 'var(--accent)', cursor: 'pointer', padding: '2px 6px 6px' }
      }, 'Clear selection'),
      filtered.map(function(o) {
        return React.createElement('label', { key: o.id, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', borderRadius: 4 } },
          React.createElement('input', { type: 'checkbox', checked: selected.includes(o.id), onChange: function() { toggle(o.id) } }),
          React.createElement('span', { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, o.name)
        )
      }),
      !filtered.length && React.createElement('div', {
        style: { fontSize: 12, color: 'var(--muted)', padding: 6 }
      }, 'No matches')
    )
  )
}
