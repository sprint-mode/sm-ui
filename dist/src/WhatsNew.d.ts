import { default as React } from 'react';
export interface WhatsNewRelease {
    id: string;
    title: string;
    items: string[];
}
interface WhatsNewProps {
    releases: WhatsNewRelease[];
    storageKey: string;
    onTour?: () => void;
    tourDone?: boolean;
}
export declare function WhatsNew({ releases, storageKey, onTour, tourDone }: WhatsNewProps): React.JSX.Element | null;
export {};
