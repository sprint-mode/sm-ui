// runtime/preview.js
// TASK-4410: previews off production. A Cloudflare Pages preview is served
// at <label>.<project>.pages.dev (a branch alias or a deploy hash in front of
// the project). Anything a preview does must reach staging, never
// production, whatever SM_API_URL the project's Preview environment carries.
// Production hosts are unchanged: *.sprintmode.ai, custom domains, and the
// bare <project>.pages.dev alias, which is the production deployment.

export var STAGING_API_URL = 'https://staging-api.sprintmode.ai'
export var PRODUCTION_API_URL = 'https://api.sprintmode.ai'

var PREVIEW_HOST = /^[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev$/i

/** True for a Pages preview host (<label>.<project>.pages.dev). */
export function isPreviewHost(hostname) {
  return typeof hostname === 'string' && PREVIEW_HOST.test(hostname)
}

/** The sm-api base for a request to this host: staging on a preview host,
 * otherwise env.SM_API_URL, falling back to production. */
export function resolveApiBase(env, hostname) {
  if (isPreviewHost(hostname)) return STAGING_API_URL
  return (env && env.SM_API_URL) || PRODUCTION_API_URL
}
