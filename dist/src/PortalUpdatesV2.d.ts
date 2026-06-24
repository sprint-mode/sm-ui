import { default as React } from 'react';
export interface PortalUpdatesV2Props {
    api: (path: string, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    showBugs?: boolean;
    subdomain?: string;
    title?: string;
    subtitle?: string;
}
export declare function PortalUpdatesV2({ api, showBugs, subdomain, title, subtitle }: PortalUpdatesV2Props): React.JSX.Element;
