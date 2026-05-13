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

export function Table({ headers, rows, empty, onRowClick }) {
  if (!rows || rows.length === 0) {
    return empty || <Empty title="No data" message="Nothing to show yet." />
  }
  return (
    <table className="sm-table">
      <thead>
        <tr>{headers.map(function(h, i) { return <th key={i}>{h}</th> })}</tr>
      </thead>
      <tbody>
        {rows.map(function(row, ri) {
          return (
            <tr key={ri} onClick={onRowClick ? function() { onRowClick(row, ri) } : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {row.cells.map(function(cell, ci) { return <td key={ci}>{cell}</td> })}
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
