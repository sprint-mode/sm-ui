import { default as React } from 'react';
export interface AvatarUploadProps {
    /** 'contact' for contact photos, 'company' for company logos */
    entityType: 'contact' | 'company';
    /** The contact or company ID */
    entityId: string;
    /** Current photo/logo URL */
    currentUrl?: string | null;
    /** Fallback initials when no image */
    initials?: string;
    /** photo_source or logo_source value */
    source?: string | null;
    /** API base URL (default: https://api.sprintmode.ai) */
    apiBase?: string;
    /** Called with new URL after upload, or null after delete */
    onUpdate?: (url: string | null) => void;
    /** Avatar size in px (default: 56) */
    size?: number;
}
export declare function AvatarUpload({ entityType, entityId, currentUrl, initials, source, apiBase, onUpdate, size }: AvatarUploadProps): React.JSX.Element;
