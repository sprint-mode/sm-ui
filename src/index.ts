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
} from './components.tsx'

// Layout shell with session context + view-as system + cmd+k + theme
export { default as Layout, useSession, ViewAsContext, useViewAs, CmdK, useTheme, PortalSwitcher } from './Layout.tsx'

// Login page
export { default as Login } from './Login.tsx'

// API Documentation page
export { default as ApiDocs } from './ApiDocs.tsx'

// Icons (kept as .jsx — auto-generated SVG, not converted)
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
} from './api.ts'

// NOTE: Worker-side auth helpers are at '@sprintmode/ui/auth'
// import { verifyJWT, signJWT, requireAuth, generateToken } from '@sprintmode/ui/auth'

// NOTE: CSS imports are at '@sprintmode/ui/css'
// import '@sprintmode/ui/css'

// NotificationBell (dropdown) removed — replaced by NotificationBellNav (click-to-navigate)
export { NotificationBellNav } from './NotificationBellNav.tsx'
export { ProfileCard } from './ProfileCard.tsx'
export { usePortalConfig, PortalConfigProvider } from './usePortalConfig.tsx'

export { UpdateAttachments } from './UpdateAttachments.tsx'
export { PortalUpdates } from './PortalUpdates.tsx'

export { BugPanel, BugPanelHeaderButton } from './BugPanel.tsx'

export { AvatarUpload } from './AvatarUpload.tsx'

export { PortalSupportWidget } from './PortalSupportWidget.tsx'

export { NotificationPrefs } from './NotificationPrefs.tsx'
