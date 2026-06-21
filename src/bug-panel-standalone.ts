// src/bug-panel-standalone.ts
// Standalone entry point for the BugPanel widget.
// Builds into a single IIFE bundle (React + ReactDOM + BugPanel included).
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
