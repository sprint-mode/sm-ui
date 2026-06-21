// src/bug-panel-standalone.ts
// Standalone entry point for the BugPanel widget.
// Truly self-contained: bundles React, ReactDOM, BugPanel, CSS tokens, and font loading.
//
// Usage:
//   <script src="bug-panel.js"></script>
//   <script>SMBugPanel.mount(document.getElementById('bug-root'), { apiBase: '...' })</script>
//
// External toggle: window.dispatchEvent(new Event('sm-bug-toggle'))
// Keyboard shortcut: Cmd+B / Ctrl+B (built in)

import { createElement, useState, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BugPanel } from './BugPanel'
import type { BugPanelProps } from './BugPanel'

export interface MountHandle {
  update: (props: BugPanelProps) => void
  unmount: () => void
}

// ── Token CSS from tokens.css ──────────────────────────────────────────────
// Injected once so the bundle works on pages without portal CSS.
const TOKEN_CSS = `
:root {
  --bg: hsl(0, 0%, 100%);
  --bg-subtle: hsl(220, 14%, 97%);
  --bg-card: hsl(0, 0%, 100%);
  --foreground: hsl(0, 0%, 9%);
  --muted: hsl(220, 9%, 40%);
  --border: hsl(214, 32%, 91%);
  --accent: hsl(221, 83%, 53%);
  --accent-10: hsla(221, 83%, 53%, 0.1);
  --blue: hsl(221, 83%, 53%);
  --green: hsl(142, 71%, 45%);
  --green-light: hsl(142, 71%, 95%);
  --red: hsl(0, 84%, 60%);
  --red-light: hsl(0, 84%, 96%);
  --amber: hsl(38, 92%, 50%);
  --amber-light: hsl(38, 92%, 95%);
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --font: 'Geist', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}
/* Move chat FAB left when bug panel is open */
body[data-bug-panel-open] .sm-chat-fab {
  right: 500px !important;
  transition: right 0.25s ease;
}
`

var injected = false
function injectDeps() {
  if (injected) return
  injected = true

  // Always inject tokens — values match tokens.css so no harm on portals
  var style = document.createElement('style')
  style.setAttribute('data-sm-bug-tokens', '')
  style.textContent = TOKEN_CSS
  document.head.appendChild(style)

  // Always inject chat FAB shift rule
  // (included in TOKEN_CSS above, but ensure it's present even if another
  //  stylesheet later overrides the :root block)

  // Load Geist font if not already loaded
  if (!document.querySelector('link[href*="Geist"]')) {
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap'
    document.head.appendChild(link)
  }
}

// ── Wrapper component ──────────────────────────────────────────────────────
// Manages visibility via controlled mode. Handles Cmd+B and sm-bug-toggle event.
// Sets body[data-bug-panel-open] so external elements (chat FAB) can respond.
function StandaloneWrapper(props: BugPanelProps) {
  var _visible = useState(false); var visible = _visible[0]; var setVisible = _visible[1]

  useEffect(function() {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setVisible(function(v) { return !v })
      }
    }
    function onToggle() {
      setVisible(function(v) { return !v })
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('sm-bug-toggle', onToggle)
    return function() {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('sm-bug-toggle', onToggle)
    }
  }, [])

  // Sync body attribute for external CSS (chat FAB shift)
  useEffect(function() {
    if (visible) {
      document.body.setAttribute('data-bug-panel-open', '')
    } else {
      document.body.removeAttribute('data-bug-panel-open')
    }
  }, [visible])

  return createElement(BugPanel, Object.assign({}, props, {
    visible: visible,
    onClose: function() { setVisible(false) }
  }))
}

function mount(element: HTMLElement, props: BugPanelProps): MountHandle {
  injectDeps()
  var root: Root = createRoot(element)
  var currentProps = props
  root.render(createElement(StandaloneWrapper, currentProps))
  return {
    update: function(newProps: BugPanelProps) {
      currentProps = newProps
      root.render(createElement(StandaloneWrapper, currentProps))
    },
    unmount: function() {
      document.body.removeAttribute('data-bug-panel-open')
      root.unmount()
    }
  }
}

// Expose on window for script-tag usage
declare global {
  interface Window {
    SMBugPanel: { mount: typeof mount }
  }
}

window.SMBugPanel = { mount }
