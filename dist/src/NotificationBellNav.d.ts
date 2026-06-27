import { default as React } from 'react';
export interface NotificationBellNavProps {
    href?: string;
    apiBase?: string;
    onNavigate?: (href: string) => void;
    countEndpoint?: string;
}
export declare function NotificationBellNav(props: NotificationBellNavProps): React.DetailedReactHTMLElement<{
    href: string;
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    'aria-label': string;
    title: string;
    style: {
        position: "relative";
        width: number;
        height: number;
        border: string;
        borderRadius: number;
        background: string;
        cursor: "pointer";
        display: "flex";
        alignItems: "center";
        justifyContent: "center";
        transition: "border-color .2s";
        flexShrink: number;
        padding: number;
        color: "var(--muted)" | "var(--foreground)";
        textDecoration: string;
    };
}, HTMLElement>;
