# BUG-3928 -- sm-ui NavItem: query-aware active state for search-string-differentiated routes

## Identity

- Waffle item: BUG-3928 (`bug_1aac28fa3d8b3693`), status `in_progress`, Readiness `Ready`, operating mode `rails`.
- Allowed repository: `sprint-mode/sm-ui` (origin `https://github.com/sprint-mode/sm-ui.git`).
- Item binding: `sha256:fc83f624ae7696b913002de550f36827acc8aa3684412f097027a19642ed7ea6`.
- Waffle source revision: `updated_at` `2026-09-17 17:31:13`
- Binding method: `item_binding()` in the kit's `libexec/wf-ready.py` (the function `wf ready` uses) over the stored Why, Scope, Done when, Constraints, Out of scope, Context and Execution metadata sections plus the revision above.
- Design binding: none. `/design` returned `not_required` because the stored Scope already fixes the approach: split the `?search` part out of `item.to` and compare it with `location.search`. `/design` reported the item binding `sha256:df11481fcb53cbe97882bd26833f9a4d414ff19eb959fe9e289bc8b25c4741a0`, which differs from the `wf ready` binding above. No design artifact exists, so no design hash is bound. The `wf ready` value is authoritative for readiness.
- Planning base: `origin/main` at `ea875a488d9736fdac57008586a3522906288a95`. The latest release tag is `v1.3.5`.
- Feature branch: `autopilot/bug-3928-navitem-query-active`. Target branch: `main` (`landing_branches=main` in `.sm-workflow.conf`).
- Autopilot run: `fire-bug-3928-20260917t173024z-42b0b8`.
- Decision owner: Aaron Hall (`ct_d47be523b3efbea5`).
- Created 2026-09-17. Waffle is authoritative. This plan supports BUG-3928 only and neither authorizes nor adds work.

## Goal, scope, constraints, non-goals (as stored)

- Goal: a sidebar nav item whose `to` carries a query string (for example `/table?lens=stacks`) is active only when both `location.pathname` and `location.search` match. The section that contains the matching item expands for that item only.
- Stored scope: `src/Layout.tsx`, the sidebar section component, has two defects:
  (1) the `hasActive` computation; (2) the `NavLink` `className`/`end={item.exact}` active state.
- Constraints: the change must be backward compatible. `to` and `exact` keep their meaning. Any new prop must be optional, with the old behavior as the default. No breaking TypeScript change to `NavItem`.
- Out of scope: sm-waffle `App.jsx` (BUG-3909), the kitchen_nav "Table" active-everywhere issue, and other packages that consume sm-ui.

### Interpretations (recorded, policy-backed)

1. **Component name.** The Scope names `NavGroupSection (~line 1097)`. In `src/Layout.tsx` at base `ea875a4` that component is `function SidebarSection(...)` at line 1093. Its `hasActive` is at lines 1117-1120 and its `NavLink` at lines 1215-1231, which match the stored line references. This plan treats `SidebarSection` as the stored target. The source is the stored line numbers and the quoted code, which match exactly.
2. **No new prop.** The Scope states that "no new props are required", so `NavItem` (line 93) stays unchanged and the search part is derived from `item.to`. `dist/src/Layout.d.ts` is therefore expected to stay byte-identical.
3. **Rail-flyout NavLink (line 2454) is in scope.** The rail flyout (`railFlyout.items.map`, line 2454) renders the same `NavItem` objects that `SidebarSection` passes through `onRailEnter`, using the same `end={item.exact}` pattern. When the sidebar rail is collapsed, it is the only rendering of those items. Done-when AC1 requires that navigating to `/table?lens=stacks` marks only that item as active in the published version, with no exception for rail-collapsed mode. The fix is in the stored Scope file and uses the same helper. Source: stored Done when AC1, plus the `/design` phase note that named line 2454.
4. **Same-family instances recorded but not changed** (not required by any stored Done when criterion and not named by Scope):
   - `sectionHasActiveRoute` (line 1859), which picks the initial open state of `defaultCollapsed` sections in `navSections` mode.
   - The top-nav `NavLink`s (lines 2214, 2236, 2266), which apply only when `nav="top"`.
   - The bottom-nav `NavLink` (line 2366), which renders `navBottom` rather than section items.

   These stay as they are. The completion report must name them as a follow-up `/ticket` candidate. If execution finds that AC1 or AC2 cannot be proven without changing one of them, execution stops (see Stop conditions).

## Repository evidence

- Package `@sprint-mode/sm-ui` has `package.json` version `1.3.0`, which trails the latest tag `v1.3.5`. `publishConfig.registry` is GitHub Packages.
- Scripts: `lint` = `eslint src/`; `type-check` = `tsc --noEmit && tsc --noEmit -p tsconfig.type-tests.json`; `test` = `vitest run`; `build` = `vite build --config vite.config.build.ts && node scripts/fix-dts-paths.js && git diff --exit-code -- dist`.
- **`dist/` is committed.** `npm run build` fails when the rebuilt `dist/` differs from the index. Rebuilt output must therefore be staged and committed with the source change. The Layout code is bundled into `dist/index.js`, which is the only file containing `ps-section-items`.
- Tests: `vitest.config.js` uses jsdom, setup file `src/__tests__/setup.js`, and includes only `src/__tests__/**/*.test.{js,jsx}`. New tests must therefore be `.test.jsx`. The render pattern to reuse is `src/__tests__/task-3229-door-props.test.jsx` (`MemoryRouter` + `Layout` default export + stubbed `fetch`).
- Theme: active appearance comes only from the `.active` class (`src/shell.css` lines 33-45). Themes change token values through `data-theme` on `<html>` (`src/dark-mode.ts`). Proving that the class set is identical with `data-theme="light"` and `data-theme="dark"` therefore proves both themes.
- Rail mode: `localStorage['sm-sidebar-rail'] === '1'` starts the sidebar collapsed (line 1439). `openRailFlyout` is at line 1453.
- CI (`.github/workflows/ci.yml`): the jobs are `lint`, `type-check`, `build`, `test` and `ci-gate`, on Node 20 with `npm ci`.
- **Release mechanism** (`.github/workflows/publish.yml`): the workflow runs on `workflow_run` of CI `completed` on `main` with conclusion `success`. It builds, then resolves the version. It uses `package.json` only when that is strictly ahead of the latest `v*` tag; otherwise it bumps the patch from the latest tag. It then tags `v<version>` and runs `npm publish` to GitHub Packages. A version bump in this PR is therefore **not** needed. The landing merge commit publishes `v1.3.6`, or the next patch after whatever tag is newest at landing. This plan does not edit `package.json`. There is no CHANGELOG in the repository.
- Base `ea875a4` CI run `35055904730` (push) completed with conclusion success.
- Local state at planning: `node_modules/` is absent (it is gitignored). The local Node is v26 and CI uses 20. `wf doctor --machine` reports that GitHub Packages npm auth is missing. That does not matter here, because no dependency comes from `@sprint-mode`/GitHub Packages.

## Acceptance matrix

| ID | Stored Done when criterion | Tasks | Evidence |
|---|---|---|---|
| AC1 | A new `@sprint-mode/sm-ui` version is published where navigating to `/table?lens=stacks` marks only the item with `to="/table?lens=stacks"` as active, and items with other `?lens=` values show as inactive, in both light and dark themes | T1, T2, T3, T4 | In-repo: new tests in `src/__tests__/bug-3928-navitem-query-active.test.jsx` covering the expanded sidebar and the rail flyout under `data-theme` light and dark. Post-landing (owned by `/merge`/`/check-deploy`, not `/execute`): a successful `Publish` run for the merge SHA and a `v1.3.6` (or next) tag pointing at it, read back with `gh run list --repo sprint-mode/sm-ui --workflow publish.yml` and `gh api repos/sprint-mode/sm-ui/git/ref/tags/v<version>`, plus `dist/index.js` at that tag containing the query-aware matcher. |
| AC2 | `hasActive` opens the section on the exact matching item, not on all items in the section simultaneously | T1, T2 | A test where a collapsed section containing `?lens=` items expands after navigation to `/table?lens=stacks` (post-mount effect), and does not expand on navigation to `/table?lens=other-unlisted`. |
| AC3 | No regression for plain-pathname items where `exact: true` still matches by pathname alone | T1, T2 | Tests covering an `exact: true` plain item (active on `/client`, inactive on `/client/x`, and active on `/client?foo=1` because the query is ignored for plain items), and a non-exact plain item (active on its sub-paths). The existing suite stays green. |
| AC4 | `npm run build` and the package test suite pass with zero new failures | T0, T3 | `npm run build` exits 0 after `dist/` is committed. `npm test` exits 0. The pre-change baseline failure count is recorded in T0; the final count is at most that baseline and every new test passes. `npm run lint` and `npm run type-check` exit 0, as CI requires. |

Every task maps to at least one ID above. No task pursues an outcome outside BUG-3928.

## Planned mutation paths

| Repository-relative path | Operation | Pair |
|---|---|---|
| `node_modules` | `create` | `-` |
| `src/Layout.tsx` | `modify` | `-` |
| `src/__tests__/bug-3928-navitem-query-active.test.jsx` | `create` | `-` |
| `dist/index.js` | `modify` | `-` |

`node_modules` is gitignored install output from T0 and is never committed. The plan file itself is committed by `/plan` before `/execute` and is not an execution mutation.

## Tasks

### T0 -- Install dependencies and record the baseline (setup for AC4)

- Files: `node_modules` (create; gitignored).
- Commands: `npm ci`. Then `npm run lint`, `npm run type-check`, `npm test`, and `npm run build`. Record each exit code and the vitest pass/fail counts as the baseline.
- Expected: all four exit 0 on unchanged `ea875a4`. Then `GIT_OPTIONAL_LOCKS=0 git status --porcelain=v1 --untracked-files=all` must be empty, which shows the lockfile and `dist/` are unchanged.
- If `npm run build` on the unchanged base leaves a `dist/` diff (for example because the local Node v26 output differs from CI's Node 20), stop: the committed-`dist` gate could not be proven. Report `blocked`.
- Commit boundary: none.

### T1 -- RED: failing tests for query-aware matching (AC1, AC2, AC3)

- Files: `src/__tests__/bug-3928-navitem-query-active.test.jsx` (create).
- Render `Layout` inside `MemoryRouter initialEntries={[...]}`, following the `task-3229-door-props.test.jsx` pattern: default export, stubbed `fetch`, and session props as that file uses them. Supply `navSections` with one section of three items (`/table?lens=boxes`, `/table?lens=stacks`, `/table?lens=waffles`) and one section of plain items (`{ to: '/client', exact: true }` and a non-exact `{ to: '/reports' }`).
- Cases:
  1. At `/table?lens=stacks`, exactly one `.ps-item.active` exists in the lens section and it is the "stacks" link. Run under both `document.documentElement.setAttribute('data-theme','light')` and `'dark'`. (AC1)
  2. At `/table?lens=other`, no lens item is active. (AC1)
  3. Rail mode (`localStorage.setItem('sm-sidebar-rail','1')`): hovering the lens section header opens `.rail-flyout`, and exactly the "stacks" link inside it is `.active`. (AC1)
  4. A lens section that starts collapsed expands after in-router navigation to `/table?lens=stacks`, and stays collapsed after navigation to `/table?lens=other`. The post-mount `hasActive` effect is driven through a navigation, for example a `useNavigate` test helper rendered as a Layout child. (AC2)
  5. The plain `exact: true` item is active at `/client` and at `/client?foo=1`, and inactive at `/client/x`. The non-exact `/reports` item is active at `/reports/2026`. (AC3)
- RED: `npx vitest run src/__tests__/bug-3928-navitem-query-active.test.jsx` fails cases 1, 3 and 4, because all lens items are active or `hasActive` is false. Cases 2 and 5 may already pass: 5 is the no-regression guard, and 2 fails only if the pathname-only match marks everything active, which it does today. Record the actual failing assertions.
- The executor adjusts selectors to the real DOM (`.ps-section`, `.ps-section-items`, `.ps-item`, `.rail-flyout`) after inspection. No production code changes in T1.
- Commit boundary: none. T1 and T2 are committed together as one reviewable fix commit, so that no committed state has a red suite.

### T2 -- GREEN: query-aware matcher in `src/Layout.tsx` (AC1, AC2, AC3)

- Files: `src/Layout.tsx` (modify).
- Smallest change:
  - Add one module-level, **non-exported** pure helper near `SidebarSection`. It takes a `NavItem` and a `{ pathname, search }` location and returns whether the item is active.
    - If `item.to` has no `?`, the helper keeps today's rule exactly: `exact ? pathname === to : pathname.startsWith(to)`. The query string is ignored.
    - If `item.to` has a `?`, the path part must match under the same exact/prefix rule, and the item's search params must match `location.search`. Compare with `URLSearchParams`, requiring every param in `item.to` to be present with an equal value in `location.search`, so parameter order does not matter. Record in the commit body whether extra params are tolerated.
  - `SidebarSection` `hasActive` (line 1119): use the helper with `location` from the existing `useLocation()`.
  - `SidebarSection` `NavLink` (line 1215): keep `to={item.to}` and `end={item.exact}`. In the existing `className` function, compute active as `p.isActive` when `item.to` has no `?`, and as the helper result when it has one. `NavLink`'s `aria-current` still follows `p.isActive`. If jsdom or axe shows the wrong `aria-current` on a query item, stop and report rather than widening scope.
  - Rail flyout `NavLink` (line 2454): apply the same `className` rule, using the `location` already in scope in `Layout` (line 1484).
  - Do not change `NavItem`, `NavSection`, `LayoutProps`, `sectionHasActiveRoute`, the top-nav `NavLink`s or the bottom-nav `NavLink`.
- Verify: `npx vitest run src/__tests__/bug-3928-navitem-query-active.test.jsx` passes all cases. Then `npm test`, `npm run lint` and `npm run type-check` exit 0.
- Commit boundary: one commit with `src/Layout.tsx` and the new test, message `fix(layout): query-aware NavItem active state (BUG-3928)`.

### T3 -- Rebuild and commit `dist/` (AC1, AC4)

- Files: `dist/index.js` (modify, generated).
- Commands: run `npm run build`. It exits 1 on the first run because `dist/index.js` changed. Inspect `GIT_OPTIONAL_LOCKS=0 git diff --stat -- dist`: only `dist/index.js` may change. Then `git add dist/index.js` and run `npm run build` again, which must exit 0.
- If any other `dist/` path changes (for example `dist/src/Layout.d.ts`), stop: that means an unplanned type-surface change. Revert that path's build output with `git checkout -- <path>` and report.
- Commit boundary: one commit with `dist/index.js`, message `build(dist): rebuild for query-aware NavItem active state (BUG-3928)`.

### T4 -- Final gate and handoff evidence (AC1, AC2, AC3, AC4)

- Commands, from a clean tree: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. All must exit 0. `GIT_OPTIONAL_LOCKS=0 git status --porcelain=v1 --untracked-files=all` must be empty.
- Evidence to hand off:
  - Test counts compared with the T0 baseline.
  - The new test names.
  - The two commit SHAs.
  - The `git diff --stat ea875a4..HEAD`, limited to the three committed mutation paths plus this plan.
  - The recorded family instances from Interpretation 4, as a follow-up `/ticket` candidate.
  - A statement that publication (AC1) happens through `publish.yml` after landing, with no `package.json` bump required.
- Commit boundary: none.

## Impacts

- Security: none. The change is client-side presentation logic, with no auth, data or network change.
- Data and migrations: none.
- Compatibility: items without `?` in `to` behave exactly as before. `NavItem` and `LayoutProps` typings do not change. Consumers that already pass `?lens=` items (sm-waffle BUG-3909) get correct highlighting after they bump the package.
- Operations: the release comes from the `Publish` workflow on the landing commit. Rollback is a revert PR through `/merge`, which publishes the next patch with the old behavior.
- Documentation: the README needs no change, because no new prop or API is added.

## Risks and failure handling

- The committed `dist/` could be non-reproducible across Node versions (local v26 against CI 20). T0 detects this before any change. CI's `build` job re-proves it on Node 20.
- Using `NavLink`'s `p.isActive` for plain items keeps router semantics identical (AC3). The helper is used only for query items.
- The `hasActive` effect skips the first mount (`_mounted` ref), so AC2 is proven through a post-mount navigation, not an initial render.
- The same defect family exists outside the stored scope (Interpretation 4). It is recorded, not changed.

## Execution controls

| Control | Value | Rationale |
|---|---|---|
| `max_wall_clock_minutes` | 60 | One file, one test file, one generated bundle. The caller ceiling is 90. |
| `max_turns` | 80 | Install, RED, GREEN, rebuild and gates fit comfortably. The caller ceiling is 120. |
| `budget` | 800000 tokens | `src/Layout.tsx` is 2642 lines and `dist/index.js` is large, so reads are sliced. The caller ceiling is 1500000. |
| `retry_ceiling_per_gate` | 2 | Each of lint, type-check, test and build may be re-run at most twice after a fix. The caller ceiling is 2. |

### Stop conditions (return `blocked`, do not improvise)

- Scope drift: a needed change outside the Planned mutation paths, a change to `NavItem`/`LayoutProps` typings, or a need to touch `sectionHasActiveRoute`, the top-nav or bottom-nav links to satisfy AC1 or AC2. Route that delta through `/ticket`.
- Waffle drift: the BUG-3928 binding recomputed with `wf-ready.py` `item_binding` differs from this plan, the item is closed, deferred or not Ready, or a written HOLD appears.
- Design drift: a material decision surfaces that the stored Scope does not settle.
- Branch state: the tree is dirty before T0, HEAD is not `autopilot/bug-3928-navitem-query-active`, or HEAD is detached or on `main`.
- Repeated failure: any gate still fails after 2 retries, or the T0 baseline is not green or not reproducible.
- Unavailable authorization or identity: any readiness input is `unavailable` or `failed`.
- Exhausted controls: any value in the table above is reached.
- `/execute` never pushes, opens a PR, reviews, merges, enters the merge queue, publishes or deploys. `/review-pr` and `/merge` follow successful execution. Publication evidence for AC1 is collected after landing.

## Execution readiness inputs

All proofs are read-only. Git reads run as `env GIT_CONFIG_NOSYSTEM=1 GIT_OPTIONAL_LOCKS=0 GIT_PAGER=cat /usr/bin/git --no-optional-locks ...`. No proof fetches, installs, stashes, commits, pushes or edits configuration.

| Key | Exact command or read | Passing evidence | Unavailable / failed |
|---|---|---|---|
| `item_binding` | MCP `getWorkItem BUG-3928`, then `item_binding()` from `~/.sm-workflow/libexec/wf-ready.py` on `{display_id, description, updated_at}` | Equals `sha256:fc83f624ae7696b913002de550f36827acc8aa3684412f097027a19642ed7ea6`; status open or `in_progress`; Readiness `Ready`; no HOLD comment | MCP error: unavailable. Mismatch or state change: failed |
| `plan_binding` | `wf ready prepare BUG-3928 --plan docs/plans/2026-09-17-bug-3928-navitem-query-active.md`; `git log -1 --format=%H -- docs/plans/2026-09-17-bug-3928-navitem-query-active.md` | `wf ready` accepts the single binding and revision lines; the plan is committed on the feature branch | Parse refusal: failed. Missing file: unavailable |
| `repository` | `git remote get-url origin` | `https://github.com/sprint-mode/sm-ui.git`, equal to the Allowed repository `sprint-mode/sm-ui` in allowed org `sprint-mode` | Other value: failed |
| `feature_branch` | `git symbolic-ref --short HEAD` | `autopilot/bug-3928-navitem-query-active` | Detached: unavailable. Other branch: failed |
| `target_branch` | `grep '^landing_branches=' .sm-workflow.conf` | `landing_branches=main` | Missing: unavailable |
| `base_sha` | `git ls-remote origin refs/heads/main` gives T. Then `git cat-file --batch-all-objects --batch-check='%(objectname) %(objecttype)'` must list `T commit`, and `git rev-list --missing=print T ^HEAD` must print nothing | T present locally as a commit; zero commits in T not in HEAD; no `?` line | T not local, nonzero exit or `?` line: unavailable. Positive count: failed (the caller synchronizes before `/execute`) |
| `working_tree` | `git --no-optional-locks status --porcelain=v1 --untracked-files=all`. Then `pwd -P` as root R. For each mutation path: `test -e`/`test -L`/`test -f`/`test -w` on the target, and for each ancestor from R to the immediate parent: `test -d`, `! test -L`, `test -x` (plus `test -w` on the parent), with `realpath` confirming containment in R | Empty status. `src/Layout.tsx` and `dist/index.js` are existing non-symlink writable regular files. `src/__tests__/bug-3928-navitem-query-active.test.jsx` and `node_modules` have no entry and no symlink. `src/__tests__`, `src`, `dist` and R are searchable non-symlink directories, the immediate parents are writable, and all are inside R | Unreadable: unavailable. Any other result: failed |
| `git_metadata` | `git rev-parse --git-dir --git-common-dir --git-path objects --git-path refs --git-path index --git-path COMMIT_EDITMSG --git-path logs/HEAD --git-path refs/heads/autopilot/bug-3928-navitem-query-active --git-path logs/refs/heads/autopilot/bug-3928-navitem-query-active`, then `realpath` of the objects dir O, `find O -maxdepth 1 -iname '[0-9a-f][0-9a-f]'`, and `test -d -a -w -a -x` / `! test -L` on each | Git dir, common dir, refs, O and every fanout entry are writable and searchable directories. The index is writable. The loose-ref parent and both reflog parents are writable; existing reflog files are writable. `COMMIT_EDITMSG` is absent, or is a writable non-symlink regular file | Missing or unreadable path, or detached HEAD: unavailable. Non-writable path or invalid fanout (including a dangling symlink): failed |
| `github_identity` | `gh api user --jq .login` | A non-empty login L | Error: unavailable |
| `waffle_identity` | `wf doctor --machine` (Waffle lines) and MCP `getWorkItem BUG-3928` | `PASS Waffle human OAuth` and `PASS Waffle agent profile`; item readable | Otherwise: unavailable |
| `push_capability` | `git config --get-all credential.https://github.com.helper` then `gh api repos/sprint-mode/sm-ui --jq .permissions.push` | The helper is `gh auth git-credential`, so the transport actor is the gh login L, and the push permission for L is `true` | Different or unknown helper, or unverifiable actor: unavailable. `false`: failed |
| `commands` | `node --version`; `npm --version`; `npm pkg get scripts.lint scripts.type-check scripts.test scripts.build` | Node >= 20; npm present; the four scripts exist exactly as listed in Repository evidence. `npm ci`, `npx vitest` and `npm run {lint,type-check,test,build}` are then runnable | Missing binary or script: unavailable |
| `dependencies` | `test -f package-lock.json`; `npm ping --registry https://registry.npmjs.org/` | Lockfile present; public registry reachable (no GitHub Packages dependency needed); no dependency added by this plan | Registry unreachable: unavailable |
| `target_ci` | `gh run list --repo sprint-mode/sm-ui --workflow ci.yml --commit T --json databaseId,status,conclusion,event`, then `gh run view <id> --repo sprint-mode/sm-ui --json jobs --jq '.jobs[] \| select(.name=="ci-gate") \| [.status,.conclusion]'` | Job `ci-gate` is `completed`/`success` on exact T (at planning: run `35055904730` on `ea875a4`, run-level success) | Unreadable or incomplete: unavailable. Missing, skipped or non-success `ci-gate`: failed |

## Evidence required before `/review-pr` and `/merge`

- The T0 baseline and T4 final gate outputs (lint, type-check, test counts, build exit 0).
- The new test file and the names of its passing cases for AC1 (light and dark, sidebar and rail flyout), AC2 and AC3.
- The two commit SHAs on `autopilot/bug-3928-navitem-query-active`. The diff is limited to `src/Layout.tsx`, the new test and `dist/index.js`, plus this plan.
- The list of recorded same-family instances (Interpretation 4).
- A post-landing AC1 publication check owned by `/merge` and `/check-deploy`: the `Publish` run for the merge SHA succeeded and tag `v1.3.6` (or next) exists.
