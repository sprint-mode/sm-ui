// src/bug-panel-standalone.ts
// Standalone entry point for the BugPanel widget.
// Builds into a single IIFE bundle (React + ReactDOM + BugPanel included).
// Injects required CSS tokens so the bundle works on any page without tokens.css.
//
// Usage:
//   <script src="bug-panel.js"></script>
//   <script>SMBugPanel.mount(document.getElementById('bug-root'), { apiBase: '...' })</script>
//
// External toggle (for header buttons):
//   window.dispatchEvent(new Event('sm-bug-toggle'))
//
// Keyboard shortcut: Cmd+B / Ctrl+B (built in)

import { createElement, useState, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BugPanel } from './BugPanel'
import type { BugPanelProps } from './BugPanel'

export interface MountHandle {
  update: (props: BugPanelProps) => void
  unmount: () => void
}

// Token CSS from tokens.css — injected once so the bundle works without portal CSS.
// Uses :root so variables cascade to fixed-positioned panel children.
const TOKEN_CSS = `
:root {
  --bg: hsl(0, 0%, 100%);
  --bg-subtle: hsl(220, 14%, 97%);
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
`

var tokensInjected = false
function injectTokens() {
  if (tokensInjected) return
  // Only inject if --accent is not already defined (portals have tokens.css)
  var test = document.createElement('div')
  test.style.color = 'var(--accent)'
  document.body.appendChild(test)
  var resolved = getComputedStyle(test).color
  document.body.removeChild(test)
  // If --accent resolved to something other than empty/initial, tokens.css is loaded
  if (resolved && resolved !== '' && resolved !== 'rgb(0, 0, 0)') {
    tokensInjected = true
    return
  }
  var style = document.createElement('style')
  style.setAttribute('data-sm-bug-tokens', '')
  style.textContent = TOKEN_CSS
  document.head.appendChild(style)
  tokensInjected = true
}

// Wrapper component: manages visibility via controlled mode, handles Cmd+B and custom events.
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

  return createElement(BugPanel, Object.assign({}, props, {
    visible: visible,
    onClose: function() { setVisible(false) }
  }))
}

function mount(element: HTMLElement, props: BugPanelProps): MountHandle {
  injectTokens()
  const root: Root = createRoot(element)
  let currentProps = props
  root.render(createElement(StandaloneWrapper, currentProps))
  return {
    update(newProps: BugPanelProps) {
      currentProps = newProps
      root.render(createElement(StandaloneWrapper, currentProps))
    },
    unmount() {
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
