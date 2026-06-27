import { default as React } from 'react';
export interface PortalUpdatesV2Props {
    api: (path: string, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    subdomain?: string;
    title?: string;
    subtitle?: string;
    shortcutKey?: string;
    userContactId?: string;
    onNavigate?: (path: string) => void;
}
export declare function PortalUpdatesV2({ api, subdomain, title, subtitle: _subtitle, shortcutKey, userContactId, onNavigate }: PortalUpdatesV2Props): React.JSX.Element;
