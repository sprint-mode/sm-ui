import { default as React } from 'react';
export interface NoAccessScreenProps {
    portalSubdomain: string;
    portalName?: string;
    portalBrandColor?: string;
    portalIconKey?: string;
    email?: string;
}
export declare function NoAccessScreen(props: NoAccessScreenProps): React.DetailedReactHTMLElement<{
    style: {
        display: "flex";
        alignItems: "center";
        justifyContent: "center";
        minHeight: string;
        fontFamily: "var(--font, 'Geist', system-ui, sans-serif)";
        padding: number;
        background: string;
    };
}, HTMLElement>;
