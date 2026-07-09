import { default as React } from 'react';
export interface AccountSwitcherProps {
    /** API base URL (empty string for same-origin) */
    apiBase?: string;
    /** SSO provider to use for "Add Account" (google or microsoft) */
    ssoProvider?: 'google' | 'microsoft';
}
export declare function AccountSwitcher(props: AccountSwitcherProps): React.FunctionComponentElement<React.FragmentProps> | null;
