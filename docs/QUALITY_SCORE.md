# Quality Score

**Last scan:** 2026-09-18
**Overall grade:** D- (prev: D, trending: down)

Scan: `/quality scan --gate=F`, partial scope (domain `layout-shell` only), item TASK-3823,
branch `autopilot/TASK-3823-waffle-accounts-subrows-9b247f`, HEAD `0a33708`, prior scan base
`ea875a4`/`22ab80c` (BUG-3928). Domain detection unchanged from the prior scan (import-graph
inference; no ARCHITECTURE.md/SPEC.md; flat `src/` with no feature/module/workspace markers).
`layout-shell` covers src/Layout.tsx, src/AccountSwitcher.tsx, src/ActingRoleChip.tsx,
src/WhatsNew.tsx, src/Tour.tsx, src/waffle-item-search.ts, and src/shell.css.

TASK-3823's actual diff against the prior scan's base touched exactly two files in this
domain: `src/AccountSwitcher.tsx` (+68/-1: a new `WaffleAccount` interface, a
`fetchWaffleAccounts` fetch hook, and a `waffleSection` render block for the new Waffle
account sub-rows) and the new test file
`src/__tests__/task-3823-waffle-account-subrows.test.jsx` (143 lines, 5 cases, verified
passing 5/5 via `vitest run`). `Layout.tsx`, `ActingRoleChip.tsx`, `WhatsNew.tsx`, `Tour.tsx`,
`waffle-item-search.ts`, and `shell.css` are byte-identical to the prior scan.

Grading formula: A=4, B=3, C=2, D=1, F=0. A domain's overall grade is the mean of its
13 dimension scores, rounded down to a letter (never inflated). The repo overall is the mean
of the domain means, rounded to the nearest third of the 4.0 scale (ties round down): n.0 is
a plain letter, n.33 gets `+`, n.67 gets the next letter up with `-`. `layout-shell`:
10 / 13 = 0.77 (down from 0.92 at the prior scan), which floors to F; the repo (one domain
scanned) rounds 0.77 to the nearest third (0.67), giving D-.

**Why the domain mean moved (0.92 -> 0.77) despite the floored letter staying F both times:**
only Dimension 8 (Git Health) changed, from B to D. This is a **methodology correction, not a
regression caused by TASK-3823's diff.** The prior scan ran against a shallow 4-commit
checkout and explicitly caveated its B grade as resting on too little history to measure
churn or coupling. This scan had the full repository history (517 commits since 2026-05-13)
available, which surfaces three pre-existing churn hotspots (Layout.tsx, AccountSwitcher.tsx,
shell.css) and the `dist/index.js` co-commit coupling pattern that was invisible before. Every
other dimension holds its prior letter grade. No dimension moved in a direction attributable
to TASK-3823's diff.

## Domain Grades

| Domain | Tests | DRY | Boundaries | Docs | Principles | Patterns | Security | Git Health | Testability | Observability | Frontend | Hygiene | CI/CD | Overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| layout-shell | D | F | F | C | F | D | D | D | D | F | D | C | F | F |

## Detailed Findings

### layout-shell

Findings below are tagged **PRE-EXISTING** (present at the prior scan's base, unrelated to
TASK-3823's diff) or **NEW** (introduced by the AccountSwitcher.tsx diff or the new test
file). Every NEW finding is an additional instance inside a dimension whose letter grade was
already at its floor (F or D) — none moved a dimension's letter grade, and no new Security
finding was found.

#### Test Coverage

| Type | File | Line | Issue | Fix | Status |
|------|------|------|-------|-----|--------|
| Coverage | src/ActingRoleChip.tsx | - | No test | Add a render and exit-swap test | PRE-EXISTING |
| Coverage | src/WhatsNew.tsx | - | No test | Add render, dismiss, and storage tests | PRE-EXISTING |
| Coverage | src/Tour.tsx | - | No test | Add step, skip, and navigation tests | PRE-EXISTING |
| Coverage | src/waffle-item-search.ts | - | `createWaffleItemSearch` untested | Add provider tests with mocked fetch | PRE-EXISTING |
| Coverage | src/Layout.tsx, src/AccountSwitcher.tsx | - | Only 2 of 6 domain files tested (33%) | Extend to the files above | PRE-EXISTING |

The new `task-3823-waffle-account-subrows.test.jsx` gives the new Waffle sub-row code solid,
passing coverage (5/5), but it deepens an already-tested file rather than covering a new one,
so the file-coverage ratio and letter grade don't move.

#### Boundary Validation

| Type | File | Line | Issue | Fix | Status |
|------|------|------|-------|-----|--------|
| Response | src/AccountSwitcher.tsx | 210, 229-230, 275, 295, 310 | `r.json()` used without checking `r.ok`; response shapes cast, not validated | Check `r.ok`, validate shape before `setState` | PRE-EXISTING |
| Response | src/AccountSwitcher.tsx | 251-255 | `fetchWaffleAccounts`: no `r.ok` check; the `data.ok`/`data.data` shape is a type assertion, not runtime validation | Validate the payload shape before `setWaffleAccounts` | NEW (same pattern as sibling fetches) |
| Response | src/Layout.tsx | 783-786, 2009-2013 | Untyped/unvalidated payloads | Validate shapes | PRE-EXISTING |
| Storage input | src/Layout.tsx | 350-351 | `getRecent` unvalidated JSON.parse | Validate the array and items | PRE-EXISTING |
| Response | src/ActingRoleChip.tsx | 47-52 | Reloads regardless of response status | Reload only on `r.ok` | PRE-EXISTING |
| Types | src/Layout.tsx | 1536, 1557, 1572, 1584 | Session read via `as any` | Extend `SessionData` | PRE-EXISTING |
| Response | src/waffle-item-search.ts | 51-53 | `/api/bugs` rows unvalidated | Add a guard | PRE-EXISTING |
| Module direction | src/waffle-item-search.ts | 12 | Imports a type from higher-level Layout | Move type to `types.ts` | PRE-EXISTING |

#### Documentation and Complexity

| Type | File | Line | Issue | Fix | Status |
|------|------|------|-------|-----|--------|
| Complexity | src/Layout.tsx | - | 2668 lines | Split into modules | PRE-EXISTING |
| Complexity | src/AccountSwitcher.tsx | - | 690 lines (was 624; +66 from this diff) | Split data hooks from menu rendering | PRE-EXISTING, size updated |
| Complexity | src/Layout.tsx | 1404, 373, 598, 741, 1119 | Component/function-length violations | Extract hooks/subcomponents | PRE-EXISTING |
| Accuracy | README.md | 1, 8, 16, 47 | Package name mismatch (`@sprintmode/ui` vs `@sprint-mode/sm-ui`) | Update install/import examples | PRE-EXISTING |
| Accuracy | src/Layout.tsx | 2004-2005 | Garbled comment; stale `?bug=` doc claim | Rewrite comment | PRE-EXISTING |
| Accuracy | src/Layout.tsx | 1455-1458 | Comment says a removed field is still used | Fix comment | PRE-EXISTING |
| Accuracy | README.md | 60-72 | `navSections`, `nav:'top'`, `releases`/`tourSteps` undocumented | Add a props section | PRE-EXISTING |

New `WaffleAccount` interface / `fetchWaffleAccounts` / `waffleSection` blocks carry accurate,
thorough inline comments (explicit TASK-3823/TASK-3836 references matching the test file's own
docstring) — no new stale or inaccurate documentation introduced. TODO/FIXME/HACK grep on both
changed files: 0 hits, repo-wide count unchanged at 0.

#### Principles Compliance Violations

| Principle | File | Line | Issue | Fix | Status |
|-----------|------|------|-------|-----|--------|
| Single Responsibility | src/Layout.tsx | 1404, 1-1402 | God component/module | Split into hooks/subcomponents | PRE-EXISTING |
| Fail Fast and Loud | src/AccountSwitcher.tsx | 212, 242, 283, 300, 327-330 | Empty/state-only catches | Log with context | PRE-EXISTING |
| Fail Fast and Loud | src/AccountSwitcher.tsx | 258 | `fetchWaffleAccounts().catch(...)` swallows the error silently | Log with endpoint/status context | NEW instance of pre-existing class |
| Fail Fast and Loud | src/Layout.tsx, src/ActingRoleChip.tsx | various | More silent catches | Report through an injectable logger | PRE-EXISTING |
| Depend on Abstractions | src/AccountSwitcher.tsx | 134, 137, 160 | Hardcoded hosts | Take from props/config | PRE-EXISTING |
| Depend on Abstractions | src/AccountSwitcher.tsx | 553 | `waffleSection` hardcodes `https://waffle.sprintmode.ai` directly | Take from a prop/config | NEW instance of pre-existing class |
| Depend on Abstractions | src/Layout.tsx | 72, 1753 | Hardcoded hosts | Take from props/config | PRE-EXISTING |
| Layer separation | src/AccountSwitcher.tsx | 208-331 | Inline fetch/business rules in UI component (range now also covers the new fetch block) | Move to an api/service module | PRE-EXISTING, range extended by new code |
| Layer separation | src/Layout.tsx | various | Inline view-as calls in shell | Extract a view-as client | PRE-EXISTING |
| Open/Closed | src/Layout.tsx | 1010-1020, 1268-1305 | Hardcoded registries | Move to config/registry prop | PRE-EXISTING |
| Minimal Surface Area | src/Layout.tsx | 721, 999, 1004 | Dead exports | Delete/deprecate | PRE-EXISTING |
| Consistency / Correctness | src/Layout.tsx, src/Tour.tsx | various | Nav active-state and tour-done key mismatches (see prior scan) | See prior scan | PRE-EXISTING |

#### DRY Violations

| Files | Lines | What's duplicated | Status |
|-------|-------|-------------------|--------|
| src/Layout.tsx, src/waffle-item-search.ts | Layout 56-81, 2008-2016; waffle-item-search 14-63 | `WaffleSearchRow` type, `/api/bugs` fetch, row-to-CmdKItem mapping | PRE-EXISTING |
| src/WhatsNew.tsx, src/Tour.tsx | 16-17 / 19-20 | Identical `lsGet`/`lsSet` helpers | PRE-EXISTING |
| src/Layout.tsx | multiple | Repeated try/catch localStorage patterns | PRE-EXISTING |
| src/Layout.tsx | 1632-1655 / 1676-1699 | View-as fetch block copied verbatim | PRE-EXISTING |
| src/Layout.tsx | 1098-1111, 1880-1887, 2533 | Three nav-path matchers | PRE-EXISTING |
| src/Layout.tsx, ActingRoleChip.tsx, AccountSwitcher.tsx | various | Four role-key humanizers | PRE-EXISTING |
| src/Layout.tsx | various | Theme toggle button / Cmd+K kbd badge duplication | PRE-EXISTING |
| src/AccountSwitcher.tsx, src/Layout.tsx | various | Portal row button / key icon SVG | PRE-EXISTING |
| src/AccountSwitcher.tsx | 249-259 vs 215-243 | `fetchWaffleAccounts` reimplements the same fetch/then/catch shape as `fetchAccounts`, minus dedupe | NEW |

#### Design Pattern Opportunities

| Location | Issue | Suggested Pattern | Status |
|----------|-------|--------------------|--------|
| src/Layout.tsx:1098-1117, 2528-2540 | Duplicate nav-matching logic | Single strategy | PRE-EXISTING |
| src/AccountSwitcher.tsx:157-181 | Host/base-path selection by conditional chain | Endpoint-resolver function | PRE-EXISTING |
| src/Layout.tsx:1760-1800, ActingRoleChip.tsx:47 | Repeated credentialed POST pattern | Shared auth-client factory | PRE-EXISTING |
| src/AccountSwitcher.tsx:440-568 | `waffleSection` is now a 4th near-identical hand-rolled section (header + toggle + row list) alongside `rolesSection`/`accessSection`/`linkedSection` | Extract a generic `Section({ items, renderRow })` component | NEW (4th repetition tips this into a reportable gap) |

#### Anti-Patterns

| Location | Anti-pattern | Impact | Status |
|----------|-------------|--------|--------|
| src/Layout.tsx | God component/module (2668 lines) | High change risk | PRE-EXISTING |
| src/Layout.tsx:1404 | 1260-line function component | Hard to test in isolation | PRE-EXISTING |
| src/Layout.tsx:748, 1503, 1536 | `window.__SM_SESSION` used as a global store | Hidden coupling | PRE-EXISTING |
| src/Layout.tsx:1176-1201, 2204-2213, 2498-2598 | IIFEs inside JSX | Logic hidden in render | PRE-EXISTING |

#### Security Findings

| Category | File | Line | Issue | Fix | Status |
|----------|------|------|-------|-----|--------|
| Authorization | src/Layout.tsx | 2528-2540 | Route guard doesn't match query-bearing `to` | Strip query before matching | PRE-EXISTING (tracked: TASK-3931) |
| Input Validation | src/Layout.tsx | 439, 452 | No scheme allowlist on navigation targets | Allow only relative/http(s) | PRE-EXISTING (tracked: TASK-3931) |
| Open redirect | src/Layout.tsx, src/AccountSwitcher.tsx | 800; 136-137, 275 | No host allowlist on `custom_domain`/`portal_url` navigation | Allowlist hosts | PRE-EXISTING (tracked: TASK-3931) |
| Session exposure | src/Layout.tsx | 1536, 748 | Full session on writable `window.__SM_SESSION` | Move to module/context state | PRE-EXISTING (tracked: TASK-3931) |
| Latent raw HTML | src/Layout.tsx | 721-733 | Unused raw-SVG-string map | Delete | PRE-EXISTING (tracked: TASK-3931) |
| CSRF | src/ActingRoleChip.tsx, src/Layout.tsx | 47; 1791 | No CSRF token on state-changing POSTs | Add CSRF token, confirm server Origin check | PRE-EXISTING (tracked: TASK-3931) |
| Dependency Risks | package-lock.json | - | `npm audit --production`: 0 vulnerabilities (confirmed); 9 dev-only findings | Run `npm audit fix` for dev toolchain | PRE-EXISTING (tracked: TASK-3931) |

The new `waffleSection` link builds its href from a fixed host string plus
`encodeURIComponent(a.workspace_id)`, a server-controlled value — not an open redirect, no new
security finding introduced by this diff. **carried: TASK-3931** (layout-shell Security D,
open, confirmed — see Top 5 Priorities).

Repo-wide critical, outside this domain's files (graded under CI/CD): `.npmrc.publish` commits
a plaintext GitHub token. Confirmed unchanged (`git diff ea875a4..HEAD -- .npmrc.publish` is
empty); independently traced to commit c60b707, predating the prior scan's base, untouched by
TASK-3823. **carried: BUG-3171** (critical, open — see Top 5 Priorities).

#### Git Health

| Type | Location | Metric | Signal | Status |
|------|----------|--------|--------|--------|
| Churn hotspot | src/Layout.tsx | 116 commits over the repo's full ~128-day life | Severe churn on a single 2668-line file | PRE-EXISTING pattern, newly visible with full history |
| Churn hotspot | src/AccountSwitcher.tsx | 32 commits; TASK-3823 is the latest | Moderate hotspot | PRE-EXISTING pattern; fresh instance this run |
| Churn hotspot | src/shell.css | 25 commits | Moderate hotspot | PRE-EXISTING pattern |
| Temporal coupling | Layout.tsx / AccountSwitcher.tsx / shell.css <-> dist/index.js | 209 `build(dist)` commits, ~1:1 with domain-source commits (confirmed for this diff: be61b14 -> 0a33708) | Committed generated artifact creates hard coupling with every domain file | PRE-EXISTING pattern; 0a33708 is a fresh instance |
| Author concentration | layout-shell (full history) | Aaron Hall 104/~154 commits (~67%) | Below the 80% single-author threshold | Re-measured this run (prior scan saw bot commits only, shallow clone) |

Grade moved B -> D. This is a **methodology correction**: the prior scan explicitly caveated
its B grade as resting on a 4-commit shallow checkout with too little history to measure
churn/coupling. This run had full history (517 commits) and found 3 churn hotspots and a
3-pair cross-domain coupling pattern (via `dist/index.js`), which independently clears the D
band. Not caused by TASK-3823's diff, though its own `0a33708` build commit is a live example
of the pre-existing coupling problem.

#### Testability Issues

| Type | File | Line | Blocker | Fix | Status |
|------|------|------|---------|-----|--------|
| Global state | src/AccountSwitcher.tsx | 153 | Module-level `_linkedCache` persists between tests | Move into context or export a reset | PRE-EXISTING |
| Global state | src/Layout.tsx | 767, 778, 1356, 748, 1503, 1536 | Module-level caches / `window.__SM_SESSION` | Pass via context/props | PRE-EXISTING |
| Hardcoded dep | src/Layout.tsx, src/AccountSwitcher.tsx, src/ActingRoleChip.tsx | multiple, incl. 251 | Direct `fetch`/`window.location`, no injection seam | Inject a client/navigator | PRE-EXISTING class; NEW instance at `fetchWaffleAccounts` (line 251) |
| Non-router location | src/Layout.tsx | 1882 | Reads `window.location` instead of `useLocation` | Use router location | PRE-EXISTING |
| Unexported pure logic | src/Layout.tsx | 1098, 1115 | Nav matching only testable via full render | Export from `nav-active.ts` | PRE-EXISTING |

The new `waffleAccounts`/`waffleLoaded` state is local `useState`, not module-level — it does
not add a new global-state finding.

#### Observability Issues

| Category | File | Line | Issue | Fix | Status |
|----------|------|------|-------|-----|--------|
| Structured logging | layout-shell | - | No logging calls anywhere in the domain | Add a pluggable logger prop | PRE-EXISTING |
| Error context | src/AccountSwitcher.tsx | 212, 242, 283, 300 | Failures swallowed | Report via logger with endpoint/status | PRE-EXISTING |
| Error context | src/AccountSwitcher.tsx | 258 | `fetchWaffleAccounts` catch swallows the failure with no error surfaced | Report via logger | NEW instance of pre-existing class |
| Error context | src/Layout.tsx | 787, 1387, 2015 | Failures swallowed | Report via logger | PRE-EXISTING |
| Metrics | src/Layout.tsx | 1760 | View-as failures surface to UI only | Emit a telemetry event | PRE-EXISTING |

#### Frontend Quality Issues (if applicable)

Subgrades unchanged in band: Design System F, Component Architecture D, Accessibility F,
Performance C, State Management C, Responsive/i18n D. Average 1.00, D.

| Category | File | Line | Issue | Fix | Status |
|----------|------|------|-------|-----|--------|
| Design System | src/Layout.tsx, shell.css, Tour.tsx, WhatsNew.tsx, ActingRoleChip.tsx, AccountSwitcher.tsx | various | Hardcoded colors, inline styles | Use color tokens | PRE-EXISTING |
| Component Architecture | src/AccountSwitcher.tsx | - | File grew 624 -> 690 lines; still mixes data + view | Split into hooks and views | PRE-EXISTING, magnitude updated |
| Accessibility | src/WhatsNew.tsx, Tour.tsx, Layout.tsx | various | Missing dialog roles/focus mgmt/aria-labels | Add ARIA + focus handling | PRE-EXISTING |
| Performance | src/Layout.tsx | various | Unmemoized rebuilds every render | `useMemo` | PRE-EXISTING |
| State Mgmt | src/AccountSwitcher.tsx | 184-195 | Now 12 `useState` pairs (was ~10), incl. a write-only `setWaffleLoaded` at 190 | `useReducer` or a data hook | PRE-EXISTING finding, new instances |
| i18n | layout-shell | many | Hardcoded English strings | Route through an i18n helper | PRE-EXISTING class |
| i18n | src/AccountSwitcher.tsx | 548 | `sectionHeader('waffle', 'Waffle', ...)` hardcodes a new user-facing label | Route through an i18n helper | NEW instance of pre-existing class |

New `waffleSection` block was checked specifically for Design System and Accessibility: it
uses only `var(--*)` tokens (no hardcoded colors) and renders native `<a>` elements with
visible text content — clean on both counts, no new finding there.

#### Repo Hygiene Issues

| Type | File | Why Residual | Action | Status |
|------|------|-------------|--------|--------|
| Orphaned plan | docs/plans/2026-09-05-task-3198-portal-standard.md | Landed work | Archive or delete | PRE-EXISTING |
| Orphaned plan | docs/plans/2026-09-05-task-3222-runtime.md | Landed work | Archive or delete | PRE-EXISTING |
| Orphaned plan | docs/plans/2026-09-06-task-3229-door-props.md | Landed work | Archive or delete | PRE-EXISTING |
| Orphaned plan | docs/plans/2026-09-17-bug-3928-navitem-query-active.md | BUG-3928 (commit 22ab80c, PR #388) is now merged/ancestor of HEAD | Archive or delete | NEW (became orphaned only because history advanced past the prior scan) |
| Dead module | src/waffle-item-search.ts | Not imported anywhere | Delete or export and reuse | PRE-EXISTING |
| Dead code | src/Layout.tsx:721, 999, 1004 | Unused map/promise/export | Delete/deprecate | PRE-EXISTING |
| Build artifact | dist/index.js | Committed; ~10k lines churn per source fix | Build on publish or gitignore | PRE-EXISTING (reconfirmed by 0a33708 this run) |
| Committed secret file | .npmrc.publish | Plaintext token, ungitignored | Revoke, delete, gitignore | PRE-EXISTING (graded under CI/CD; tracked: BUG-3171) |

`docs/plans/2026-09-18-task-3823-waffle-accounts-subrows.md` (this task's own plan) is not
flagged as orphaned — it is the active branch's own plan, matching how BUG-3928's plan wasn't
flagged before it landed.

#### CI/CD & Deployment Issues

Repo-wide grade F (automatic: hardcoded credential), unchanged from the prior scan. Confirmed
`.npmrc.publish` byte-identical across `ea875a4..HEAD` and independently traced to commit
c60b707 (predating the prior scan's base by weeks); not referenced by `publish.yml` (which
authenticates via `secrets.GITHUB_TOKEN`) but still a live, exposed, unrotated credential.
Without it, this dimension would grade ~C (2 undocumented secrets exceeds the B threshold of
"at most 1"). **carried: BUG-3171.**

One item resolved from "unconfirmed" to confirmed this run: `gh api` branch protection
confirms `ci-gate` IS a required status check (PR gate stage is solid).

| Stage | File | Issue | Action |
|-------|------|-------|--------|
| Secrets | .npmrc.publish | Plaintext GitHub token committed since c60b707, unchanged through ea875a4..HEAD, not gitignored | Revoke/rotate now, delete file, gitignore `.npmrc*`, purge from history if required |
| Secrets | .github/workflows/sm-workflow-drift.yml | `SM_WORKFLOW_READ_TOKEN`, `KIT_EVENTS_SECRET_KIT` undocumented | Add a README Secrets section |
| Secrets | .github/workflows/sm-pr-sweep.yml | `KIT_EVENTS_SECRET_KIT` undocumented | Same |
| 1 (PR gate) | branch protection (main) | Confirmed `ci-gate` is a required check | Resolved, no action |
| 1 (PR gate) | ci.yml | `ci-gate` passes when a job is skipped | Pass only on success, or document |
| 2 (Build) | publish.yml:92-93 | `git tag -f` + `git push --force` rewrite release tags | Fail if the tag already exists |
| 2 (Build) | *.yml | Actions pinned to `@v4`, not SHAs | Pin to commit SHAs |
| 2 (Build) | publish.yml | Every green main run publishes; package.json (1.3.0) lags tags (v1.3.6) | Add a paths filter |
| 5 (Rollback) | README.md | No rollback/deprecate section | Document `npm deprecate` and pinning |

## Tech Debt

| Type | Count | Prev |
|---|---|---|
| TODO | 0 | 0 |
| FIXME | 0 | 0 |
| HACK | 0 | 0 |

Repo-wide count over ts/tsx/js/jsx/mjs/css, excluding node_modules, .venv, vendor, target,
.git, dist, and build. Re-verified this run; unchanged.

## Top 5 Refactoring Priorities

1. repo-wide: revoke and remove the GitHub token committed in `.npmrc.publish` (pre-existing at base ea875a4, confirmed unchanged) — **carried: BUG-3171** (impact: high)
2. layout-shell: Security D — query-bearing nav-item route guard, navigation allowlisting, CSRF, session exposure (pre-existing at base, unrelated to TASK-3823's diff) — **carried: TASK-3931** (impact: high)
3. layout-shell: split the 2668-line Layout.tsx god module into per-feature modules and hooks (impact: high)
4. layout-shell: extract a generic `Section({ items, renderRow })` component — `waffleSection` is now the 4th near-identical hand-rolled menu section in AccountSwitcher.tsx (impact: medium)
5. layout-shell: add a pluggable error logger; stop swallowing fetch failures in AccountSwitcher (including the new `fetchWaffleAccounts`) and Layout (impact: medium)

## History

| Date | Overall | Trend |
|---|---|---|
| 2026-09-17 | D | - (first measurement, layout-shell only) |
| 2026-09-18 | D- | down (Git Health B->D methodology correction from full git history; not a TASK-3823 regression — see prose above) |
