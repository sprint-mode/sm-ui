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
// Pull-down info drawer. Desktop: centered handle. Mobile: "i" button.
// Usage: <Explainer title="Section Name">{...content...}</Explainer>

export function Explainer({ children, title }) {
  var ref = React.useRef(null)
  var open = React.useState(false)
  var isOpen = open[0]
  var setOpen = open[1]

  // Close on Escape
  React.useEffect(function() {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return function() { document.removeEventListener('keydown', onKey) }
  }, [isOpen])

  // Lock body scroll when open
  React.useEffect(function() {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return function() { document.body.style.overflow = '' }
  }, [isOpen])

  return React.createElement(React.Fragment, null,
    // Desktop: centered pull-tab
    React.createElement('div', { className: 'sm-explainer-trigger' },
      React.createElement('button', {
        className: 'sm-explainer-handle',
        onClick: function() { setOpen(true) },
        'aria-label': 'Show explainer for ' + (title || 'this section'),
      },
        React.createElement('span', { className: 'sm-explainer-handle-icon' }, '▾'),
        React.createElement('span', { className: 'sm-explainer-handle-label' }, title ? title + ' Guide' : 'Guide')
      ),
      // Mobile: compact info button
      React.createElement('button', {
        className: 'sm-explainer-info-btn',
        onClick: function() { setOpen(true) },
        'aria-label': 'Info',
      }, 'ⓘ')
    ),

    // Backdrop + Drawer
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
          }, '✕')
        ),
        React.createElement('div', { className: 'sm-explainer-body' }, children)
      )
    )
  )
}
