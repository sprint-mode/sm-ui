import React, { useState, useEffect, createContext, useContext } from 'react'

var PortalConfigContext = createContext(null)

/**
 * usePortalConfig — returns the portal_configs row for the current portal.
 * Returns { config, loading, error }.
 */
export function usePortalConfig() {
  return useContext(PortalConfigContext) || { config: null, loading: true, error: null }
}

/**
 * PortalConfigProvider — wraps app to provide portal config context.
 * Props:
 *   subdomain: string — the portal's subdomain (e.g. 'studios')
 *   apiBase: string — SM API base URL (default: 'https://api.sprintmode.ai')
 */
export function PortalConfigProvider({ subdomain, apiBase, children }) {
  var [config, setConfig] = useState(null)
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)

  useEffect(function() {
    if (!subdomain) { setLoading(false); return }
    var base = apiBase || 'https://api.sprintmode.ai'
    fetch(base + '/api/portal/config?subdomain=' + encodeURIComponent(subdomain), {
      credentials: 'include'
    })
      .then(function(r) { return r.json() })
      .then(function(d) {
        if (d.ok && d.config) {
          setConfig(d.config)
        } else {
          setError(d.error || 'Failed to load portal config')
        }
        setLoading(false)
      })
      .catch(function(err) {
        setError(err.message)
        setLoading(false)
      })
  }, [subdomain, apiBase])

  return (
    <PortalConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </PortalConfigContext.Provider>
  )
}
