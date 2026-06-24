import { default as React, ReactNode } from 'react';
export interface LoginProps {
    productName?: string;
    /** @deprecated Use icon+title props instead */
    _logoSrc?: string;
    authBase?: string;
    icon?: ReactNode;
    title?: string;
    byLine?: string;
    iconBg?: string;
    iconColor?: string;
    /** When set, enables the "Create an account" toggle with signup fields.
     *  Value is appended to SSO URLs and magic link POST body (e.g. "signup=true&product=studios"). */
    signupParams?: string;
    /** Controls company name field visibility in signup mode.
     *  'required' (default) — shown and required (B2B portals).
     *  'optional' — shown but can be left blank; user can add company later.
     *  'hidden' — not rendered; no company record created on signup. */
    companyField?: 'required' | 'optional' | 'hidden';
}
declare const Login: React.FC<LoginProps>;
export default Login;
