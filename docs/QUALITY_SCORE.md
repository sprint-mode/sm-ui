# Quality Score

**Last scan:** 2026-09-17
**Overall grade:** D (prev: none, trending: - first measurement)

Scan: `/quality scan --gate=F`, partial scope (domain `layout-shell` only), item BUG-3928,
branch `autopilot/bug-3928-navitem-query-active`, base `ea875a4`. Domains were found by
import-graph inference: the repo has no ARCHITECTURE.md or SPEC.md, and `src/` is flat with
no feature, module, or workspace markers. Other domains the inference found were not scanned
this run: `updates-inbox` (PortalUpdates, PortalUpdatesV2, UpdateAttachments, InboxRow,
inbox-page-standalone, FileViewer, DocumentDetail), `site` (site.ts, SiteHeader,
site-helpers), `auth-login` (Login, auth.ts), `access-gating` (PageGate, NoAccessScreen,
AdminEmptyState), and `portal-tooling` (bin/, runtime/). Shared infrastructure (api.ts,
Icons, components.tsx, dark-mode.ts, usePortalConfig.tsx, index.ts) is not a domain.

`layout-shell` covers src/Layout.tsx, src/AccountSwitcher.tsx, src/ActingRoleChip.tsx,
src/WhatsNew.tsx, src/Tour.tsx, src/waffle-item-search.ts, and src/shell.css.

Grading formula: A=4, B=3, C=2, D=1, F=0. A domain's overall grade is the mean of its
dimension scores, rounded down to a letter. The repo's overall grade is the mean of the
domain overalls, rounded to the nearest third (ties round down): n.33 gives the letter plus
`+`, and n.67 gives the next letter up with `-`. `layout-shell`: 12 / 13 = 0.92, so the
domain is F, and the repo (one domain scanned) rounds to 1.00, which is D.

Evidence limits: the checkout is shallow (4 commits, 2026-09-16..17), so Git Health rests on
very little history. The two related test files (bug-3928-navitem-query-active,
cmdk-item-search) pass, 13 of 13. eslint on the domain files reports 0 errors and 87
warnings, mostly `no-explicit-any`.

## Domain Grades

| Domain | Tests | DRY | Boundaries | Docs | Principles | Patterns | Security | Git Health | Testability | Observability | Frontend | Hygiene | CI/CD | Overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| layout-shell | D | F | F | C | F | D | D | B | D | F | D | C | F | F |

## Detailed Findings

### layout-shell

#### Test Coverage

| Type | File | Line | Issue | Fix |
|------|------|------|-------|-----|
| Coverage | src/ActingRoleChip.tsx | - | No test imports or exercises it | Add a render and exit-swap test |
| Coverage | src/WhatsNew.tsx | - | No test | Add render, dismiss, and storage tests |
| Coverage | src/Tour.tsx | - | No test | Add step, skip, and navigation tests |
| Coverage | src/waffle-item-search.ts | - | `createWaffleItemSearch` untested (cmdk-item-search.test.jsx covers only `mapBugsToCmdKItems` in Layout) | Add provider tests with mocked fetch |
| Coverage | src/Layout.tsx, src/AccountSwitcher.tsx | - | Covered by 7 test files (bug-3928, view-as-lens, user-menu-lens, account-switcher-menu-spec, task-3229-door-props, page-gate, cmdk-item-search). Only 2 of 6 source files are tested (33%). | Keep, and extend to the files above |

#### Boundary Validation

| Type | File | Line | Issue | Fix |
|------|------|------|-------|-----|
| Response | src/AccountSwitcher.tsx | 194-196, 213-215, 243, 263, 278 | `r.json()` is used without checking `r.ok`, and response shapes are cast, not validated | Check `r.ok` and validate the shape before `setState` |
| Response | src/Layout.tsx | 783-786 | `/api/my-portals` payload trusted as `PortalEntry[]` | Validate the shape; drop malformed entries |
| Response | src/Layout.tsx | 2009-2013 | `d.data` rows go to `mapBugsToCmdKItems` without a row shape check | Validate each row has a string `id` |
| Storage input | src/Layout.tsx | 350-351 | `getRecent` JSON-parses localStorage and returns it as `CmdKItem[]`, no validation | Validate the array and each item's `label`/`to` |
| Response | src/ActingRoleChip.tsx | 47-52 | Reloads whatever the exit-swap-role response status | Reload only on `r.ok`; otherwise show an error |
| Response | src/Layout.tsx | 1644-1646, 1707-1726 | View-as feed is typed `any`; elements are not validated | Add a type-guard parser |
| Input | src/Layout.tsx | 1030-1039 | `parsePerms` casts `any` with no shape check | Add a guard |
| Types | src/Layout.tsx | 1536, 1557, 1572, 1584 | Session read via `as any` | Extend the `SessionData` type |
| Response | src/waffle-item-search.ts | 51-53 | `/api/bugs` rows are not validated | Add a guard |
| Module direction | src/waffle-item-search.ts | 12 | Low-level module imports a type from the high-level Layout | Move `CmdKItem` to a `types.ts` |

#### Documentation and Complexity

| Type | File | Line | Issue | Fix |
|------|------|------|-------|-----|
| Complexity | src/Layout.tsx | - | 2668 lines | Split into CmdK, PortalPicker, HeaderUserMenu, SidebarSection, theme, and view-as modules |
| Complexity | src/AccountSwitcher.tsx | - | 624 lines | Split data hooks from the menu rendering |
| Complexity | src/Layout.tsx | 1404 | `Layout` component body is about 1260 lines | Extract hooks (view-as, nav collapse, route guard) and subcomponents |
| Complexity | src/Layout.tsx | 373, 598, 741, 1119 | `CmdK` (~220 lines), `HeaderUserMenu` (~140), `PortalPicker` (~260), `SidebarSection` (~150) are all over 50 lines | Extract row renderers and effects |
| Complexity | src/AccountSwitcher.tsx | 143 | `AccountSwitcher` is about 480 lines | Extract `useLinkedAccounts` / `useIdentity` hooks |
| Accuracy | README.md | 1, 8, 16, 47 | Documents the package as `@sprintmode/ui`, but package.json names it `@sprint-mode/sm-ui` | Update the name in install and import examples |
| Accuracy | src/Layout.tsx | 2004-2005 | Comment is garbled ("results / Results link to ..."), and `waffle-item-search.ts:9-10` documents a `?bug=` default the in-Layout provider does not use | Rewrite the comment; state which provider each host gets |
| Accuracy | src/Layout.tsx | 1455-1458 | Comment says `bugPanelAdmin` was removed, but it is still computed and used | Fix the comment |
| Accuracy | README.md | 60-72 | Layout docs cover only `navConfig`; `navSections`, query-aware items (BUG-3928), `nav:'top'`, and `releases`/`tourSteps` are undocumented | Add a props section |

#### Principles Compliance Violations

| Principle | File | Line | Issue | Fix |
|-----------|------|------|-------|-----|
| Single Responsibility | src/Layout.tsx | 1404 | One component owns session fetch, view-as lens, route guard, nav collapse, theme, cmdk, and bug panel | Split into hooks and subcomponents |
| Single Responsibility | src/Layout.tsx | 1-1402 | Module also exports CmdK, PortalSwitcher, useTheme, useDeployRefresh, and permission helpers | Move each to its own module; re-export from index.ts |
| Fail Fast and Loud | src/AccountSwitcher.tsx | 197, 227, 251, 268 | Empty or state-only catches swallow network errors | Log with context and show an error state |
| Fail Fast and Loud | src/Layout.tsx | 787, 1387 | `.catch(function() {})` on my-portals and version.json | Log with context |
| Fail Fast and Loud | src/ActingRoleChip.tsx | 53 | Catch only resets busy; no error surfaced | Show an error to the user |
| Depend on Abstractions | src/Layout.tsx | 72, 1753 | Hardcoded `https://waffle.sprintmode.ai` and `https://api.sprintmode.ai` | Take them from props or config |
| Layer separation | src/AccountSwitcher.tsx | 193-299 | Inline fetch and business rules inside the UI component | Move to an api/service module |
| Layer separation | src/Layout.tsx | 1635, 1679, 1760, 1791 | Inline view-as API calls in the shell component | Extract a view-as client |
| Fail Fast and Loud | src/Layout.tsx | 358, 1800, 2015 | Further silent catches | Report through an injectable logger |
| Depend on Abstractions | src/AccountSwitcher.tsx | 121, 147, 237 | Hardcoded hosts; `/api/auth/switch-account` ignores `apiBase` and the X-SM-Product header (TASK-3229 door contract) | Route through `apiBase` and `authHeaders()` |
| Open/Closed | src/Layout.tsx | 1010-1020, 1268-1305 | Product color and default-nav registries hardcoded in the shared shell | Move into portal config or a registry prop |
| Minimal Surface Area | src/Layout.tsx | 721, 999, 1004 | Unused `_ICON_KEY_SVG_PATHS` and `_portalFetch`; no-op `PortalSwitcher` export | Delete; deprecate the export |
| Consistency | src/Layout.tsx | 2240, 2262, 2292, 2392 | Top-nav and navBottom NavLinks still use plain `p.isActive` (the BUG-3928 matcher is not applied; tracked by BUG-3930); top nav also omits `end` | Use `navItemIsActive` and pass `end={item.exact}` |
| Correctness | src/Layout.tsx, src/Tour.tsx | 1447; 49, 64 | Layout reads `<key>_tour_done` but Tour writes `<key>_done`, so tour-done is never true (present at base) | Export one key helper from Tour.tsx |
| Correctness (new in ea875a4..HEAD) | src/Layout.tsx | 1099-1102 | `isNavItemActive`: an item with a missing or empty `to` counts as active on every path (`startsWith('')`), so its section auto-opens. Non-exact query items use raw `startsWith` without the segment boundary, so `/table?lens=x` is also active at `/tables?lens=x`. | Return false when `!item.to`; match `pathname === path` or `startsWith(path + '/')` |

#### DRY Violations

| Files | Lines | What's duplicated |
|-------|-------|-------------------|
| src/Layout.tsx, src/waffle-item-search.ts | Layout 56-81, 2008-2016; waffle-item-search 14-63 | `WaffleSearchRow` type, the `/api/bugs` search fetch, and row-to-CmdKItem mapping exist twice, with different `to` targets |
| src/WhatsNew.tsx, src/Tour.tsx | WhatsNew 16-17; Tour 19-20 | Identical `lsGet`/`lsSet` safe-localStorage helpers |
| src/Layout.tsx | 262-271, 351-358, 1447, 1465-1470, 1861-1893 | Repeated try/catch localStorage access patterns instead of one helper |
| src/Layout.tsx | 1632-1655 / 1676-1699 | View-as fetch with 5s deadline and one-retry block, copied verbatim |
| src/Layout.tsx | 1098-1111, 1880-1887, 2533 | Three nav-path matchers; `sectionHasActiveRoute` is not query-aware and reads `window.location` |
| src/Layout.tsx, src/ActingRoleChip.tsx, src/AccountSwitcher.tsx | 640, 2066 / 38-40 / 127-135 | Four role-key humanizers |
| src/Layout.tsx | 2154-2170 / 2406-2417; 2222-2228 / 2338-2344 | Theme toggle button; Cmd+K portal kbd badge |
| src/AccountSwitcher.tsx, src/Layout.tsx | 482-500 / 532-547; 695-708 | Portal row button; key icon SVG |

#### Design Pattern Opportunities

| Location | Issue | Suggested Pattern |
|----------|-------|-------------------|
| src/Layout.tsx:1098-1117, 2528-2540 | Nav matching logic exists twice (sidebar active state vs route guard), and they disagree on query strings | Single nav-matcher strategy used by both |
| src/AccountSwitcher.tsx:150-168 | Host/base path selection by conditionals | Small endpoint-resolver function or config object |
| src/Layout.tsx:1760-1800, src/ActingRoleChip.tsx:47 | Repeated credentialed POST with `X-SM-Product` header | Shared auth-client factory |

#### Anti-Patterns

| Location | Anti-pattern | Impact |
|----------|-------------|--------|
| src/Layout.tsx | God component/module (2668 lines, about 10 responsibilities) | High change risk; every nav fix touches the whole shell |
| src/Layout.tsx:1404 | 1260-line function component | Hard to test in isolation; heavy re-render surface |
| src/Layout.tsx:748, 1503, 1536 | `window.__SM_SESSION` used as a global store | Hidden coupling; any script can read or overwrite it |
| src/Layout.tsx:1176-1201, 2204-2213, 2498-2598 | IIFEs inside JSX | Logic hidden in render; hard to test |

#### Security Findings

| Category | File | Line | Issue | Fix |
|----------|------|------|-------|-----|
| Authorization | src/Layout.tsx | 2528-2540 | The client route guard matches `navItem.to` against the pathname only. A nav item whose `to` has a query (`/table?lens=x`) never matches, so its `permKey` is never enforced on direct navigation. Present at base ea875a4; not introduced by ea875a4..HEAD (the BUG-3928 diff changed only sidebar active state). Related: BUG-3930. | Strip the query before matching, reusing the BUG-3928 matcher; the server must still enforce access |
| Input Validation | src/Layout.tsx | 439, 452 | `window.location.href = sel.to` with `to` from host `onSearch` results or localStorage recents; no scheme allowlist, so a `javascript:` target would run. Present at base. | Allow only relative paths and http(s) URLs |
| Open redirect | src/Layout.tsx, src/AccountSwitcher.tsx | 800; 118-124, 246 | Navigates to `custom_domain` / `portal_url` from API payloads with no host allowlist. Present at base. | Check against `*.sprintmode.ai` plus the configured custom-domain list |
| Session exposure | src/Layout.tsx | 1536, 748 | The full session (email, permissions) sits on writable `window.__SM_SESSION`, and PortalPicker reads portals from it. Present at base. | Keep in module or context state |
| Latent raw HTML | src/Layout.tsx | 721-733 | Unused raw-SVG-string map invites future `innerHTML` use (not a live gap). Present at base. | Delete |
| CSRF | src/ActingRoleChip.tsx, src/Layout.tsx | 47; 1791 | Cookie-authenticated state-changing POSTs with no body or content type (simple requests, no preflight) and no CSRF token; protection depends entirely on server Origin checks. Present at base. | Send a CSRF token or JSON content type, and confirm the server checks Origin |
| Dependency Risks | package-lock.json | - | `npm audit`: 0 production vulnerabilities; 9 dev-only (2 moderate, 7 high). Present at base (the diff does not touch package files). | Run `npm audit fix` for the dev toolchain |

Repo-wide critical, outside this domain's files (graded under CI/CD): `.npmrc.publish`
commits a plaintext GitHub token (`ghp_...`, value not reproduced here). The file was added in
ea875a4 (present at base) and is unchanged by ea875a4..HEAD.

#### Git Health

| Type | Location | Metric | Signal |
|------|----------|--------|--------|
| Temporal coupling | src/Layout.tsx <-> dist/index.js | 1/1 source change needed a 10k-line dist rebuild | Committed build artifact doubles every change |
| Limited history | layout-shell | Shallow checkout (4 commits in 2 days) | Too little history to measure churn or coupling; graded without penalty, per the young-repo rule |
| Author concentration | layout-shell | Visible commits are all by automation bots (sprint-mode-agents, sprint-mode-automation) | Human ownership isn't visible in history; re-measure on a full clone |

#### Testability Issues

| Type | File | Line | Blocker | Fix |
|------|------|------|---------|-----|
| Global state | src/AccountSwitcher.tsx | 140 | Module-level `_linkedCache` persists between tests | Move into context, or export a reset for tests |
| Global state | src/Layout.tsx | 767, 778 | Module-level `_portalCache` | Same as above |
| Global state | src/Layout.tsx | 1356 | `_BUILT_WITH` read at import from the `__BUILD_ID__` global | Take it as a hook parameter |
| Hardcoded dep | src/Layout.tsx, src/AccountSwitcher.tsx, src/ActingRoleChip.tsx | 783, 1635, 1760, 2009; 47, 52 | Direct `fetch` and `window.location` calls, no injection seam | Inject a client and a navigator; take an `onExit` prop |
| Global state | src/Layout.tsx | 748, 1503, 1536 | `window.__SM_SESSION` | Pass via context or props |
| Non-router location | src/Layout.tsx | 1882 | Reads `window.location` instead of `useLocation` | Use router location |
| Unexported pure logic | src/Layout.tsx | 1098, 1115 | Nav matching is testable only through a full Layout render | Export from a `nav-active.ts` module |

#### Observability Issues

| Category | File | Line | Issue | Fix |
|----------|------|------|-------|-----|
| Structured logging | layout-shell | - | No logging calls anywhere in the domain | Add a pluggable `onError`/logger prop and report failures through it |
| Error context | src/AccountSwitcher.tsx | 197, 227, 251, 268 | Failures are swallowed | Report through the logger with the endpoint and status |
| Error context | src/Layout.tsx | 787, 1387, 2015 | Failures are swallowed | Same as above |
| Metrics | src/Layout.tsx | 1760 | View-as failures surface only to the UI (1776, 1781) | Also emit a telemetry event |

#### Frontend Quality Issues (if applicable)

Subgrades: Design System F, Component Architecture D, Accessibility F, Performance C, State
Management C, Responsive and i18n D. Average 1.00, which is D.

| Category | File | Line | Issue | Fix |
|----------|------|------|-------|-----|
| Design System | src/Layout.tsx | 339-348 | `BADGE_COLORS` hardcodes 16 rgba/hex values | Use color tokens |
| Design System | src/shell.css | 51, 56, 65, 108, 145, 187, 279 | Hardcoded `#fff` and rgba shadows/overlays | Add shadow and overlay tokens |
| Design System | src/Tour.tsx, src/WhatsNew.tsx, src/ActingRoleChip.tsx | Tour 73, 80; WhatsNew 44; Chip 59-72 | Inline styles with hardcoded rgba and pixel values | Move to shell.css classes with tokens |
| Component Architecture | src/Layout.tsx | 1404 | 1260-line component | Split into presentational and container parts |
| Component Architecture | src/AccountSwitcher.tsx | 143 | 480-line component mixing data and view | Split into hooks and views |
| Accessibility | src/WhatsNew.tsx | 43-50 | Clickable overlay `div`s; modal has no `role="dialog"`, `aria-modal`, Escape handling, or focus management | Use a dialog element or add the ARIA attributes and focus trap |
| Accessibility | src/Tour.tsx | 84 | Tour card has no dialog role or focus management | Add `role="dialog"`, a label, and focus handling |
| Accessibility | src/Layout.tsx | 2486 | Hamburger button has no accessible name | Add `aria-label` and `aria-expanded` |
| Accessibility | src/Layout.tsx | 2494 | Overlay `div` with onClick and no role | Add `aria-hidden` and handle Escape |
| Design System | src/Layout.tsx | 873-877, 911, 956, 970-972, 2316 | Hardcoded colors and the Geist font in PortalPicker and the CTA | Use `var(--*)` tokens |
| Design System | src/AccountSwitcher.tsx | 369, 465 | `#ba7517`, hsl literals | Use tokens |
| Accessibility | src/Layout.tsx | 549-554 | CmdK has no `role=dialog` / `aria-modal`; input unlabeled | Add ARIA and an input label |
| Accessibility | src/Layout.tsx | 885, 2222, 2338 | Clickable div/kbd with no role or keyboard support | Use `<button>` |
| Accessibility | src/Layout.tsx | 658, 1172, 2250 | Toggles lack `aria-expanded` / `aria-haspopup` | Add them |
| Accessibility | src/Layout.tsx | 2098 | View-as search input unlabeled | Add `aria-label` |
| Performance | src/Layout.tsx | 423-425 | Palette merge arrays and Set rebuilt every render | `useMemo` |
| Performance | src/Layout.tsx | 1906-1960, 1613, 1833 | Sections rebuilt every render; `allUsers` gets a new array each render, so the listener re-subscribes every render | `useMemo` |
| Performance | src/Layout.tsx | 416, 445 | localStorage parsed every render; keydown listener rebinds on every highlight change | Memoize; use a ref |
| Responsive | src/shell.css, src/Layout.tsx | 179; 551, 675 | Single ad-hoc 900px breakpoint; fixed widths 520 and 220 | Define a breakpoint scale |
| State Mgmt | src/Layout.tsx | 1404 | Many useState slices plus inline fetches in one component | Extract hooks |
| State Mgmt | src/AccountSwitcher.tsx | 170-180 | 10 useState pairs | `useReducer` or a data hook |
| i18n | layout-shell | many | Hardcoded user-facing English strings ("What's new", "Got it", "Skip", "Acting: ", "View as failed ...") | Route through an i18n helper, or accept labels as props |

#### Repo Hygiene Issues

| Type | File | Why Residual | Action |
|------|------|-------------|--------|
| Orphaned plan | docs/plans/2026-09-05-task-3198-portal-standard.md | Plan for earlier, already-landed work | Archive or delete |
| Orphaned plan | docs/plans/2026-09-05-task-3222-runtime.md | Plan for earlier, already-landed work | Archive or delete |
| Orphaned plan | docs/plans/2026-09-06-task-3229-door-props.md | TASK-3229 landed (its props are in the Layout and AccountSwitcher code at base) | Archive or delete |
| Dead module | src/waffle-item-search.ts | Not imported or exported anywhere; Layout has its own copy | Delete, or export it and reuse it in Layout |
| Dead code | src/Layout.tsx:721, 999, 1004 | Unused map, unused promise var, no-op export | Delete / deprecate |
| Build artifact | dist/index.js | Committed; about 10k lines of churn per source fix (co-changes with Layout.tsx) | Build on publish, or gitignore it |
| Committed secret file | .npmrc.publish | Unused by the pipeline (publish.yml uses GITHUB_TOKEN) and not gitignored | Revoke the token, delete the file, add `.npmrc*` to .gitignore |

#### CI/CD & Deployment Issues

Repo-wide grade F (automatic: hardcoded credential). This is a library published to GitHub
Packages with promotion off, so Stages 3-5 (deploy) do not apply. Without the credential, the
pipeline would grade about B-/C.

| Stage | File | Issue | Action |
|-------|------|-------|--------|
| Secrets | .npmrc.publish | Plaintext GitHub token for npm.pkg.github.com is committed (added in ea875a4, so present at base). Automatic F. | Revoke the token now, delete the file, gitignore `.npmrc*`, and purge from history if policy requires |
| Secrets | .github/workflows/sm-workflow-drift.yml | `SM_WORKFLOW_READ_TOKEN` and `KIT_EVENTS_SECRET_KIT` are not documented | Add a README Secrets section with purpose and owner |
| Secrets | .github/workflows/sm-pr-sweep.yml | `KIT_EVENTS_SECRET_KIT` is not documented | Same README section |
| 1 (PR gate) | branch rules (main) | Could not confirm `ci-gate` is a required check | Confirm with `gh api repos/sprint-mode/sm-ui/rulesets` |
| 1 (PR gate) | .github/workflows/ci.yml | `ci-gate` also passes when a job is `skipped` | Pass only on `success`, or document why skipped is allowed |
| 2 (Build) | .github/workflows/publish.yml | `git tag -f` and `git push --force` rewrite release tags | Fail if the tag already exists |
| 2 (Build) | .github/workflows/*.yml | Actions pinned to major tags (`@v4`), and runners use `ubuntu-latest` | Pin actions to commit SHAs |
| 2 (Build) | .github/workflows/publish.yml | Every green main run publishes a patch release, and package.json (1.3.0) lags behind the tags | Add a paths filter; document that tags are the version source |
| 5 (Rollback) | README.md | No release, deprecate, or rollback section | Document `npm deprecate` and pinning consumers to the previous tag |

## Tech Debt

| Type | Count | Prev |
|---|---|---|
| TODO | 0 | - |
| FIXME | 0 | - |
| HACK | 0 | - |

Repo-wide count over ts/tsx/js/jsx/mjs/css, excluding node_modules, .venv, vendor, target,
.git, dist, and build.

## Top 5 Refactoring Priorities

1. repo-wide: revoke and remove the GitHub token committed in `.npmrc.publish` (present at base ea875a4) (impact: high)
2. layout-shell: Security D. Make the route guard honor query-bearing nav items (Layout.tsx:2528-2540; see BUG-3930), and allowlist navigation targets (Layout.tsx:439, 452, 800) (impact: high)
3. layout-shell: split the 2668-line Layout.tsx god module into per-feature modules and hooks (impact: high)
4. layout-shell: fix the two `isNavItemActive` edge cases this run introduced (empty `to`, missing segment boundary; Layout.tsx:1099-1102), and add tests for ActingRoleChip, WhatsNew, Tour, and createWaffleItemSearch (impact: medium)
5. layout-shell: add a pluggable error logger, and stop swallowing fetch failures in AccountSwitcher and Layout (impact: medium)

## History

| Date | Overall | Trend |
|---|---|---|
| 2026-09-17 | D | - (first measurement, layout-shell only) |
