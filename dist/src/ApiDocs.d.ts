import { default as React } from 'react';
export interface ApiParam {
    name: string;
    type?: string;
    description?: string;
    required?: boolean;
}
export interface ApiRoute {
    id?: string;
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    summary?: string;
    description?: string;
    auth?: boolean;
    params?: ApiParam[];
    body?: ApiParam[];
    request?: unknown;
    response?: unknown;
}
export interface ApiSection {
    section: string;
    routes?: ApiRoute[];
}
export interface ApiDocsProps {
    spec?: ApiSection[];
    product?: string;
    title?: string;
    baseUrl?: string;
}
export default function ApiDocs(props: ApiDocsProps): React.DetailedReactHTMLElement<{
    style: {
        maxWidth: string;
        margin: string;
        padding: string;
    };
}, HTMLElement>;
