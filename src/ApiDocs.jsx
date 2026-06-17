// @nomadahq/sm-ui — ApiDocs component
// Standardized API documentation page for product portals.
// Usage: import { ApiDocs } from '@nomadahq/sm-ui'
//        <ApiDocs spec={myApiSpec} product="mode" />

import React, { useState, useMemo, useRef, _useEffect } from 'react'

var METHOD_COLORS = {
  GET: { bg: 'rgba(16,185,129,0.12)', fg: '#10b981', border: 'rgba(16,185,129,0.25)' },
  POST: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  PATCH: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  PUT: { bg: 'rgba(168,85,247,0.12)', fg: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  DELETE: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}

function MethodBadge({ method }) {
  var c = METHOD_COLORS[method] || METHOD_COLORS.GET
  return React.createElement('span', {
    style: {
      display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
      fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.5px',
      background: c.bg, color: c.fg, border: '1px solid ' + c.border, minWidth: '52px', textAlign: 'center'
    }
  }, method)
}

function ParamTable({ params }) {
  if (!params || !params.length) return null
  return React.createElement('table', {
    style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '8px' }
  },
    React.createElement('thead', null,
      React.createElement('tr', { style: { borderBottom: '1px solid var(--border, #e5e7eb)' } },
        React.createElement('th', { style: { textAlign: 'left', padding: '6px 8px', fontWeight: 600 } }, 'Param'),
        React.createElement('th', { style: { textAlign: 'left', padding: '6px 8px', fontWeight: 600 } }, 'Type'),
        React.createElement('th', { style: { textAlign: 'left', padding: '6px 8px', fontWeight: 600 } }, 'Description')
      )
    ),
    React.createElement('tbody', null,
      params.map(function (p, i) {
        return React.createElement('tr', {
          key: i,
          style: { borderBottom: '1px solid var(--border, #e5e7eb)' }
        },
          React.createElement('td', { style: { padding: '6px 8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--accent, #2362ea)' } },
            p.name, !p.required ? React.createElement('span', { style: { color: 'var(--fg-muted, #9ca3af)', fontSize: '11px', marginLeft: '4px' } }, '?') : null
          ),
          React.createElement('td', { style: { padding: '6px 8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--fg-muted, #9ca3af)' } }, p.type || 'string'),
          React.createElement('td', { style: { padding: '6px 8px', color: 'var(--fg-secondary, #6b7280)' } }, p.description || '')
        )
      })
    )
  )
}

function CodeBlock({ code, title }) {
  if (!code) return null
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO: tracked
  var ref = useRef(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO: tracked
  var _copied = useState(false)
  return React.createElement('div', { style: { marginTop: '8px' } },
    title ? React.createElement('div', {
      style: { fontSize: '11px', fontWeight: 600, color: 'var(--fg-muted, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }
    }, title) : null,
    React.createElement('div', { style: { position: 'relative' } },
      React.createElement('pre', {
        ref: ref,
        style: {
          background: 'var(--bg-code, #f4f5f7)', borderRadius: '6px', padding: '12px 16px',
          fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.6,
          overflowX: 'auto', border: '1px solid var(--border, #e5e7eb)', margin: 0,
          color: 'var(--fg, #171717)'
        }
      }, typeof code === 'string' ? code : JSON.stringify(code, null, 2))
    )
  )
}

function RouteCard({ route }) {
  var expanded = useState(false)
  var isOpen = expanded[0]
  var setOpen = expanded[1]

  return React.createElement('div', {
    id: route.id || slugify(route.method + '-' + route.path),
    style: {
      border: '1px solid var(--border, #e5e7eb)', borderRadius: '8px', marginBottom: '8px',
      background: 'var(--bg, #fff)', overflow: 'hidden'
    }
  },
    React.createElement('button', {
      onClick: function () { setOpen(!isOpen) },
      style: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'var(--font, inherit)', fontSize: '14px'
      }
    },
      React.createElement(MethodBadge, { method: route.method }),
      React.createElement('code', {
        style: { fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', fontWeight: 500, color: 'var(--fg, #171717)' }
      }, route.path),
      route.auth === false ? React.createElement('span', {
        style: { fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 600 }
      }, 'PUBLIC') : null,
      React.createElement('span', {
        style: { marginLeft: 'auto', color: 'var(--fg-muted, #9ca3af)', fontSize: '13px', flex: '1', textAlign: 'right', paddingRight: '8px' }
      }, route.summary || ''),
      React.createElement('span', {
        style: { color: 'var(--fg-muted, #9ca3af)', fontSize: '12px', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }
      }, '\u25B6')
    ),
    isOpen ? React.createElement('div', {
      style: { padding: '0 16px 16px', borderTop: '1px solid var(--border, #e5e7eb)' }
    },
      route.description ? React.createElement('p', { style: { margin: '12px 0 0', fontSize: '13px', color: 'var(--fg-secondary, #6b7280)', lineHeight: 1.5 } }, route.description) : null,
      route.params ? React.createElement('div', { style: { marginTop: '12px' } },
        React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, marginBottom: '4px' } }, 'Parameters'),
        React.createElement(ParamTable, { params: route.params })
      ) : null,
      route.body ? React.createElement('div', { style: { marginTop: '12px' } },
        React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, marginBottom: '4px' } }, 'Request Body'),
        React.createElement(ParamTable, { params: route.body })
      ) : null,
      route.request ? React.createElement(CodeBlock, { code: route.request, title: 'Request Example' }) : null,
      route.response ? React.createElement(CodeBlock, { code: route.response, title: 'Response' }) : null
    ) : null
  )
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * ApiDocs — Standardized API documentation component for product portals.
 *
 * @param {Object} props
 * @param {Array} props.spec - API spec: [{ section: 'Auth', routes: [{ method, path, summary, description, params, body, request, response, auth }] }]
 * @param {string} [props.product] - Product name for theming (e.g. 'mode', 'studios')
 * @param {string} [props.title] - Page title (default: 'API Reference')
 * @param {string} [props.baseUrl] - Base URL shown in docs (default: 'https://api.sprintmode.ai')
 */
export default function ApiDocs(props) {
  var spec = props.spec || []
  var title = props.title || 'API Reference'
  var baseUrl = props.baseUrl || 'https://api.sprintmode.ai'
  var search = useState('')
  var query = search[0]
  var setQuery = search[1]
  var _activeSection = useState(null)

  var totalRoutes = useMemo(function () {
    return spec.reduce(function (n, s) { return n + (s.routes || []).length }, 0)
  }, [spec])

  var filtered = useMemo(function () {
    if (!query) return spec
    var q = query.toLowerCase()
    return spec.map(function (section) {
      var routes = (section.routes || []).filter(function (r) {
        return (r.path || '').toLowerCase().indexOf(q) !== -1 ||
          (r.summary || '').toLowerCase().indexOf(q) !== -1 ||
          (r.method || '').toLowerCase().indexOf(q) !== -1 ||
          (r.description || '').toLowerCase().indexOf(q) !== -1
      })
      return routes.length ? { section: section.section, routes: routes } : null
    }).filter(Boolean)
  }, [spec, query])

  return React.createElement('div', { style: { maxWidth: '960px', margin: '0 auto', padding: '24px 16px' } },
    // Header
    React.createElement('div', { style: { marginBottom: '24px' } },
      React.createElement('h1', { style: { fontSize: '22px', fontWeight: 800, margin: '0 0 4px' } }, title),
      React.createElement('p', { style: { fontSize: '13px', color: 'var(--fg-muted, #9ca3af)', margin: 0 } },
        totalRoutes + ' endpoints — Base URL: ',
        React.createElement('code', { style: { fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--accent, #2362ea)' } }, baseUrl)
      )
    ),
    // Search
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('input', {
        type: 'text', placeholder: 'Search endpoints...', value: query,
        onChange: function (e) { setQuery(e.target.value) },
        style: {
          width: '100%', padding: '10px 14px', border: '1px solid var(--border, #e5e7eb)',
          borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font, inherit)',
          background: 'var(--bg, #fff)', color: 'var(--fg, #171717)', outline: 'none',
          boxSizing: 'border-box'
        }
      })
    ),
    // Sections
    filtered.map(function (section) {
      return React.createElement('div', { key: section.section, style: { marginBottom: '24px' } },
        React.createElement('h2', {
          id: slugify(section.section),
          style: { fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--fg, #171717)' }
        }, section.section),
        (section.routes || []).map(function (route, i) {
          return React.createElement(RouteCard, { key: i, route: route })
        })
      )
    }),
    filtered.length === 0 ? React.createElement('p', {
      style: { textAlign: 'center', padding: '40px', color: 'var(--fg-muted, #9ca3af)' }
    }, 'No endpoints match "' + query + '"') : null
  )
}
