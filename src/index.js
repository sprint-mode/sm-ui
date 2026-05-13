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
} from './components.jsx'

// Layout shell with session context
export { default as Layout, useSession } from './Layout.jsx'

// Login page
export { default as Login } from './Login.jsx'

// Icons
export {
  IconGrid, IconCode, IconDoc, IconLock, IconTrend,
  IconUsers, IconUser, IconDollar, IconTerminal, IconGear,
  IconSessions, IconEye, IconLayers, IconStar, IconCheck,
  IconRefresh, IconWarn, IconSpark, IconClick, IconPercent,
  IconCloud, IconExternal, IconFile, IconMsg, IconBill,
  IconPortfolio, IconExpand, IconWrench, IconPlus, IconX,
  IconMail, IconChevron,
  LogoSprintMode, LogoStudios, LogoMode, LogoHub,
  LogoSprintCapital, LogoPrivacyAI,
  ProductIcon,
} from './Icons.jsx'

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
