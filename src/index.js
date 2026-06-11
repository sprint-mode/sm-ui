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
} from './components.jsx'

// Layout shell with session context + view-as system + cmd+k + theme
export { default as Layout, useSession, ViewAsContext, useViewAs, CmdK, useTheme, PortalSwitcher } from './Layout.jsx'

// Login page
export { default as Login } from './Login.jsx'

// API Documentation page
export { default as ApiDocs } from './ApiDocs.jsx'

// Icons
export {
  IconGrid, IconCode, IconDoc, IconContract, IconLock, IconTrend,
  IconUsers, IconUser, IconDollar, IconTerminal, IconGear,
  IconSessions, IconEye, IconLayers, IconStar, IconCheck,
  IconRefresh, IconWarn, IconSpark, IconClick, IconPercent,
  IconCloud, IconInfoCircle, IconExternal, IconFile, IconMsg, IconBill,
  IconPortfolio, IconExpand, IconWrench, IconPlus, IconX,
  IconMail, IconChevron,
  IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight,
  IconChevronRight, IconChevronDown, IconRocket, IconTarget,
  IconFolder, IconClipboard, IconPalette, IconEdit, IconReceipt,
  IconSearch, IconPlay, IconUserPlus, IconMonitor, IconMoon, IconSun,
  IconPipeline, IconSend, IconShield, IconGridPlus, IconLink, IconPackage,
  IconQuestion, IconPaperclip, IconChevronUp, IconHeadset,
  IconAddressBook, IconChartHistogram, IconReportMoney, IconMoneybag,
  IconActivityHeartbeat, IconMessageCircle, IconGlobe, IconDevWindow,
  LogoSprintMode, LogoStudios, LogoMode, LogoHub,
  LogoSprintCapital, LogoPrivacyAI,
  ProductIcon, LogoDevPortal, LogoSignal, LogoAPI, LogoCollect,
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

export { NotificationBell } from './NotificationBell.jsx'
export { ProfileCard } from './ProfileCard.jsx'
export { usePortalConfig, PortalConfigProvider } from './usePortalConfig.jsx'
