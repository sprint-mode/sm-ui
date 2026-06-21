// src/PortalSupportWidget.tsx
// Typed re-export — delegates to PortalSupportWidget.jsx implementation.

import React from 'react'
// @ts-ignore — .jsx source file, types declared below
import { PortalSupportWidget as _Impl } from './PortalSupportWidget.jsx'

export interface PortalSupportWidgetProps {
  subdomain: string
  apiBase?: string
  brandColor?: string
}

export const PortalSupportWidget: React.FC<PortalSupportWidgetProps> = _Impl
