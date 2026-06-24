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
}
declare const Login: React.FC<LoginProps>;
export default Login;
