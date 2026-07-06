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
}
interface InboxRowProps {
    item: InboxItem;
    onRead?: (id: string) => void;
    onNavigate?: (url: string) => void;
}
export declare function InboxRow({ item, onRead, onNavigate }: InboxRowProps): React.JSX.Element;
export default InboxRow;
