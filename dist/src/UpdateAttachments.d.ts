import { default as React } from 'react';
export type AttachmentType = 'image' | 'file' | 'drive' | 'link';
export interface Attachment {
    id: string;
    type: AttachmentType;
    filename?: string;
    name?: string;
    url?: string;
    viewUrl?: string;
    r2Key?: string;
    size?: number;
    mime?: string;
    title?: string;
}
export interface UpdateAttachmentsProps {
    attachments?: Attachment[] | string | null;
    getSignedUrl?: ((updateId: string, attId: string) => Promise<{
        url?: string;
        data?: {
            url?: string;
        };
    }>) | null;
    updateId?: string;
    compact?: boolean;
}
export declare function UpdateAttachments({ attachments, getSignedUrl, updateId, compact }: UpdateAttachmentsProps): React.JSX.Element | null;
