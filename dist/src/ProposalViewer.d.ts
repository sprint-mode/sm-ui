import { default as React } from 'react';
/**
 * ProposalViewer — shared component for rendering proposals in client portals.
 * Used by sm-studios, sm-mode, sm-signal, and any future portal with proposals.
 *
 * Handles:
 * - CSS injection from content_html (design system classes)
 * - Section rendering with Geist Mono labels
 * - IntersectionObserver scroll tracking
 * - Acceptance section (signature type → next-steps explanation)
 * - Accept/Decline with decline-requires-comment
 * - Comments thread with reply
 *
 * Portal-specific concerns (API calls, DocuSeal, session) stay in each portal.
 * Pass callbacks and data via props.
 */
export interface ProposalViewerSection {
    key: string;
    title: string;
    type: string;
    content: string;
}
export interface ProposalViewerComment {
    id: string;
    author_name?: string;
    author_type?: string;
    body: string;
    created_at?: string;
}
export interface ProposalViewerProps {
    /** The proposal object — needs content_html, status, signature_required, signature_status */
    proposal: {
        content_html?: string | null;
        status?: string;
        signature_required?: boolean | number;
        signature_status?: string;
        [key: string]: any;
    };
    /** Parsed content_sections array */
    sections: ProposalViewerSection[];
    /** Comments array */
    comments?: ProposalViewerComment[];
    /** Called when a section scrolls into view. Non-fatal if omitted. */
    onTrackSection?: (sectionKey: string) => void;
    /** Called when user clicks Accept. Omit to hide Accept button. */
    onAccept?: () => Promise<void> | void;
    /** Called when user clicks Decline with reason. Omit to hide Decline button. */
    onDecline?: (reason: string) => Promise<void> | void;
    /** Called when user posts a comment. Omit to hide reply box. */
    onPostComment?: (body: string) => Promise<void> | void;
    /** Optional: render prop for DocuSeal signature embed (portal-specific) */
    renderSignature?: () => React.ReactNode;
    /** Whether the proposal has already been decided (accepted/declined) */
    decided?: string | false;
    /** Called after accept/decline to update parent state */
    onDecided?: (decision: string) => void;
    /** Back button handler */
    onBack?: () => void;
    /** Accent color override (defaults to portal CSS var) */
    accent?: string;
}
export declare function ProposalViewer({ proposal, sections, comments, onTrackSection, onAccept, onDecline, onPostComment, renderSignature, decided: decidedProp, onDecided, onBack, }: ProposalViewerProps): React.JSX.Element;
