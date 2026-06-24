import { default as React } from 'react';
export interface PortalUpdatesV2Props {
    api: (path: string, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    showBugs?: boolean;
    showSupport?: boolean;
    isAdmin?: boolean;
    userContactId?: string;
    subdomain?: string;
    title?: string;
    subtitle?: string;
    onNavigate?: (path: string) => void;
}
export declare function PortalUpdatesV2({ api, showBugs, showSupport, isAdmin, userContactId, subdomain, title, subtitle, onNavigate }: PortalUpdatesV2Props): React.JSX.Element;
