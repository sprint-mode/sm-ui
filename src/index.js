// @sprintmode/ui — Main export barrel
// Components, Layout, Icons, Login, and API helpers

// Components
export {
  Card,
  CardBody,
  Pill,
  Badge,
  Button,
  StatCard,
  Stats,
  Progress,
  Tabs,
  PageHeader,
  Table,
  Empty,
  Spinner,
  ScoreRing,
  Explainer,
  DataTable,
  MultiSelect,
} from './components.jsx'

// Layout shell with session context + view-as system + cmd+k + theme
export { default as Layout, useSession, ViewAsContext, useViewAs, CmdK, useTheme, PortalSwitcher } from './Layout.jsx'

// Login page
export { default as Login } from './Login.jsx'

// API Documentation page
export { default as ApiDocs } from './ApiDocs.jsx'

// Icons
export * from './Icons.jsx'

// Client-side API helpers
export {
  getSession as fetchSession,
  clearSession,
  api,
  formatCurrency,
  formatDate,
  formatRelative,
  escapeHtml,
} from './api.js'

// NOTE: Worker-side auth helpers are at '@sprintmode/ui/auth'
// import { verifyJWT, signJWT, requireAuth, generateToken } from '@sprintmode/ui/auth'

// NOTE: CSS imports are at '@sprintmode/ui/css'
// import '@sprintmode/ui/css'

export { NotificationBell } from './NotificationBell.jsx'
export { ProfileCard } from './ProfileCard.jsx'
export { usePortalConfig, PortalConfigProvider } from './usePortalConfig.jsx'

export { UpdateAttachments } from './UpdateAttachments.jsx'
export { PortalUpdates } from './PortalUpdates.jsx'

export { BugPanel, BugPanelHeaderButton } from './BugPanel.jsx'
