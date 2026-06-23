import React from 'react'

export interface CmdKItemMeta {
  badge?: string
  badgeColor?: string
  detail?: string
}

export interface CmdKItem {
  label: string
  to: string
  section?: string
  subsection?: string
  keywords?: string
  step?: number
  Icon?: React.ComponentType
  disabled?: boolean
  meta?: CmdKItemMeta
}

export interface NavItem {
  to: string
  label: string
  icon?: string
  Icon?: React.ComponentType | null
  exact?: boolean
  external?: boolean
  disabled?: boolean
  step?: number
  completed?: boolean
  clientOnly?: boolean
  teamOnly?: boolean
  internalBadge?: boolean
}

export interface NavSection {
  key?: string
  label: string
  items: NavItem[]
  sectionIcon?: React.ReactNode
  sectionColor?: string
  product?: string
  flat?: boolean
  type?: string
}

export interface HeaderCta {
  label: string
  onClick: () => void
  variant?: 'outline' | 'filled'
}

export interface SessionData {
  user_id?: string
  name?: string
  email?: string
  role?: string
  photo_url?: string
  portal_role?: string
  company_id?: string
  company_name?: string
  [key: string]: unknown
}

export interface LayoutProps {
  navConfig?: Record<string, { label: string; items: NavItem[] }>
  navSections?: (NavSection & { type?: string; heading?: string })[]
  navBottom?: NavItem[]
  session?: SessionData | null
  children?: React.ReactNode
  logoSrc?: string
  logoAlt?: string
  title?: string
  headerRight?: React.ReactNode
  sidebarBottom?: React.ReactNode
  viewAsEnabled?: boolean
  viewAsApi?: string
  viewAsDetailApi?: string
  headerIcon?: React.ReactNode
  onLogout?: string
  profilePath?: string
  cmdK?: boolean | { placeholder?: string }
  cmdKItems?: CmdKItem[]
  onSearch?: (query: string) => Promise<{ items: CmdKItem[]; total?: number }>
  recentKey?: string
  showCompanyName?: boolean
  byLine?: string
  userMenuExtra?: React.ReactNode
  notificationApiBase?: string
  notificationHref?: string
  headerCta?: HeaderCta
  viewAsAnyRole?: boolean
  bugPanel?: boolean | number
  bugPanelAdmin?: boolean
  bugPanelLabel?: string
}

export function useSession(): SessionData | null
export function useViewAs(): { viewAs: SessionData | null; isViewAs: boolean }
export function useTheme(): { theme: string; setTheme: (t: string) => void }
export function CmdK(props: { items?: CmdKItem[]; placeholder?: string }): JSX.Element
export function PortalSwitcher(props: Record<string, unknown>): JSX.Element
export const ViewAsContext: React.Context<unknown>

export default function Layout(props: LayoutProps): JSX.Element
