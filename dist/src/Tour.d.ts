import { default as React } from 'react';
export interface TourStep {
    path: string;
    selector: string;
    title: string;
    body: string;
}
interface TourProps {
    steps: TourStep[];
    storageKey: string;
    autoStart?: boolean;
}
export declare function Tour({ steps, storageKey, autoStart }: TourProps): React.JSX.Element | null;
export declare function triggerTour(storageKey: string): void;
export {};
