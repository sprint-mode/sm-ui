import { default as React } from 'react';
export interface InboxItem {
    id: string;
    title: string;
    body?: string | null;
    update_type?: string | null;
    notification_type?: string | null;
    audience?: string | null;
    comm_type?: string | null;
    action_url?: string | null;
    action_label?: string | null;
    published_at?: string | null;
    created_at?: string | null;
    read_at?: string | null;
    dismissed_at?: string | null;
    author_name?: string | null;
    attachments?: unknown;
    source_system?: string | null;
    priority?: string | null;
}
export interface CategoryPill {
    label: string;
    bg: string;
    color: string;
}
interface InboxRowProps {
    item: InboxItem;
    onRead?: (id: string) => void;
    onNavigate?: (url: string) => void;
    onClick?: () => void;
    category?: CategoryPill;
    expanded?: boolean;
    expandedContent?: React.ReactNode;
}
export declare function InboxRow({ item, onRead, onNavigate, onClick, category, expanded, expandedContent }: InboxRowProps): React.JSX.Element;
export default InboxRow;
