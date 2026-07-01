import { default as React } from 'react';
export interface ProfileCardProps {
    /** Currently only 'self' is supported */
    variant?: 'self';
    /** API base URL (default: https://api.sprintmode.ai) */
    apiBase?: string;
    /** Optional back link href shown above the page title */
    backHref?: string;
}
export interface ProfileData {
    id?: string;
    full_name?: string;
    email?: string;
    title?: string;
    phone?: string;
    photo_url?: string | null;
    company_name?: string;
    portal_role?: string;
    role?: string;
    hire_date?: string;
    portal_last_login?: string;
    contact_type?: string;
    role_label?: string;
    slack_profile_url?: string;
    gws_groups?: (string | {
        email?: string;
        name?: string;
    })[];
    emails?: {
        email: string;
        is_primary?: number;
        email_type?: string;
    }[];
    payroll?: {
        job_title?: string;
        label?: string;
        date?: string;
        amount?: number;
        currency?: string;
        status?: string;
    }[];
}
export declare function ProfileCard(props: ProfileCardProps): React.JSX.Element;
