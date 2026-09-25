export declare const STAGING_API_URL: string
export declare const PRODUCTION_API_URL: string
/** True for a Pages preview host (<label>.<project>.pages.dev). */
export function isPreviewHost(hostname: string): boolean
/** The sm-api base for a request to this host: staging on a preview host,
 * otherwise env.SM_API_URL, falling back to production. */
export function resolveApiBase(env: { SM_API_URL?: string } | undefined, hostname: string): string
