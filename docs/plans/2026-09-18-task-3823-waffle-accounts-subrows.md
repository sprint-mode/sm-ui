# TASK-3823 -- sm-ui user menu: Waffle account sub-rows

## Identity

- Waffle item: TASK-3823 (`bug_385759ae6e0a6a51`), status `in_progress`, Readiness `Ready`, operating mode `rails`.
- Allowed repository: `sprint-mode/sm-ui` (origin `https://github.com/sprint-mode/sm-ui.git`, org `sprint-mode`).
- Item binding: `sha256:39e4dde7f617dedc104a127fcc3b916108ca463bee7fecb8e729a6de1c90b95e`.
- Waffle source revision: `updated_at` `2026-09-18 06:58:41`
- Binding method: `item_binding()` in the kit's `libexec/wf-ready.py`, computed over the stored `display_id`, the `Why`/`Scope`/`Done when`/`Constraints`/`Out of scope`/`Context`/`Execution metadata` sections, and the revision above.
- Design binding: none. `/design` returned `not_required` for this item, re-confirmed independently against the live repository this run: `AccountSwitcher.tsx` already implements the `sectionHeader()`/`expandedSection` collapse pattern (`accessSection`, lines 471-503) that a fourth "Waffle" section fits directly, `GET /api/auth/waffle-accounts` (TASK-3836) is live and role-filtered server-side, and the mock's visual nesting under a linked identity is a presentation choice per Aaron's ruling -- actual placement is "below the existing identity block" using the current session's own accounts. No material decision remains unresolved; no design artifact exists; no design hash is bound.
- Planning base: `origin/main` at `22ab80c3f51605051c8899f6a5ecce28e7bb81d1` (`git ls-remote origin refs/heads/main` matches; `git rev-parse HEAD` on this checkout also matches). Latest release tag: `v1.3.6`. `package.json` version at planning: `1.3.0` (trails the tag, as it always does between releases -- see Repository evidence).
- Feature branch: `autopilot/TASK-3823-waffle-accounts-subrows-9b247f`. Target branch: `main` (`landing_branches=main` in `.sm-workflow.conf`).
- Autopilot run: `fire-task-3823-20260918t065656z-9b247f`.
- Decision owner: Aaron Hall (`ct_d47be523b3efbea5`).
- Created 2026-09-18. Waffle is authoritative. This plan supports TASK-3823 only and neither authorizes nor adds work.

## Goal, scope, constraints, non-goals (as stored)

- Goal: the sm-ui user menu (`AccountSwitcher`) renders one sub-row per Waffle account under the existing identity block, for any identity holding a waffle customer role, matching approved mock screen 2 (`sm-jockey/_briefs/mocks/sm-control-5/waffle-panel-module/`).
- Stored scope: below the existing identity block, render one sub-row per Waffle account from `GET /api/auth/waffle-accounts` (TASK-3836, landed) where the identity holds a waffle customer role (`super_owner`, `owner`, `manager`, `member` per IDENTITY-CANON §4). Each sub-row links to `https://waffle.sprintmode.ai` as that identity on that account. Sub-rows render for any identity with at least one waffle customer role, regardless of whether waffle-panel is installed on the current portal. Publish the updated sm-ui package. Post `"sm-ui published <version>"` as a comment on FEAT-3814 (`bug_b4045a3a37313a1a`).
- Constraints: draw exclusively from `GET /api/auth/waffle-accounts` (no `/api/auth/linked-accounts`, no sm-api change -- ruling (b) final, Aaron 2026-09-18). Sub-rows are the signed-in session's accounts only. Only identities holding a waffle customer role get Waffle sub-rows (already enforced server-side by the endpoint). No `Layout.tsx` changes, no keybinding, no panel slot (TASK-3952). Do not touch `src/__tests__/waffle-panel-no-cross-portal.test.jsx`.
- Out of scope: the `layout.panel` slot and `Mod+.` keybinding (TASK-3952); the `@sprint-mode/waffle-panel` package (TASK-3822, published); the sm-ui proxy allowlist fix (TASK-3821, landed); installing waffle-panel on Switchpoint; any sm-api change.
- Confirmed implementation pattern (carried in the item's own Context/Constraints and independently re-verified below): mirror `AccountSwitcher.tsx`'s existing `fetchAccounts()`-style proxy fetch convention for the new endpoint, and mirror its existing `sectionHeader()`/`accessSection` rendering pattern for a collapsible "Waffle" section with sub-rows; sub-row links are plain `<a href>` to `https://waffle.sprintmode.ai?account=<workspace_id>`.

### Interpretations (recorded, policy-backed)

1. **Endpoint and shape.** `GET /api/auth/waffle-accounts` is not present anywhere in this repository (`grep -ri waffle-accounts` over `src/` returns nothing) -- it is an sm-api route (TASK-3836) that `AccountSwitcher.tsx` does not yet call. This plan adds the fetch; it is the only network surface this plan introduces. The item's own Constraint/Context text abbreviates the response shape as `workspace_id`/`name`/`is_current`, but this run's own re-verified design finding (treated as settled fact for planning: "GET /api/auth/waffle-accounts ... returns {workspace_id, name, role, is_current}") and the mock's own row content ("Homey / Owner") both require a `role` field to render the humanized role text -- there is no other field anywhere in scope that could supply it. This plan treats the shape as `{ workspace_id, name, role, is_current }`, four fields, consistent with the endpoint's shipped contract (TASK-3836) and the previous independently-approved plan for this same item.
2. **Render gate is the endpoint response, not a client-side role check.** The endpoint's `role` field is always one of the canonical waffle customer roles by construction (server-side filtered, per the stored Constraint and TASK-3836's shipped contract). `AccountSwitcher.tsx`'s existing sections already gate purely on non-empty arrays (`accessPortals.length > 0`, `myRoles.length > 0`) -- there is no independent client-side role check anywhere in the file. This plan follows the same rule: the section renders when the fetched account list is non-empty, exactly like `accessSection`. If an identity holds no waffle customer role, the endpoint is expected to return an empty list, so no extra client-side filtering is required or introduced.
3. **No account is excluded by `is_current`.** `accessSection` deliberately excludes the current product's own portal (`p.subdomain !== product`) because "Portal access" means *other* access. Nothing in the stored Scope or Constraints says to exclude the current Waffle account from these sub-rows -- Scope says "one sub-row per Waffle account", not "other Waffle accounts". `is_current` is carried into the local interface for completeness and potential future use, but no row is filtered on it. T1 re-confirms this against the mock before locking test assertions.
4. **Section position and header copy are read from the mock, not assumed.** The item's Context paraphrases the mock as a "Waffle -- 3 accounts" header with rows like "Homey / Owner" and "Sprint Mode > Switchpoint / Member", but `AccountSwitcher.tsx`'s existing `sectionHeader()` helper renders a fixed shape (`LABEL(count)` optionally followed by `· subtitle`) that every other section reuses verbatim -- there is no section in the file that renders "X -- N accounts" as literal text. Reusing `sectionHeader()` unchanged (the stored, confirmed pattern) is the default; T1 is a bounded discovery step against the actual mock asset to confirm the exact header copy, section order relative to Roles/Portal access/Linked accounts, and sub-row layout (icon or not) before the RED test is written, because `AccountSwitcher.tsx` supplies no brand/logo fields for Waffle accounts (`workspace_id`/`name`/`role`/`is_current` only -- no `logo_mark_url`/`brand_color` the way `PortalInfo` has). If the mock is unreadable from the execution checkout (as it was during this planning session, sandboxed to the sm-ui repository only), T1 falls back to the stored Context description verbatim and records the fallback as a recognized limitation, per the Stop conditions.
5. **Sub-row link is a plain anchor, not `handlePortalClick`.** `accessSection` and the linked-account drill-in both route clicks through `handlePortalClick`, which POSTs `/api/auth/switch-account` before navigating -- that flow authenticates a *different* linked sign-in into the current session. Waffle sub-rows do not switch the sm-ui session; they open the external Waffle app as the current identity on a specific account. The stored, confirmed pattern is a plain `<a href="https://waffle.sprintmode.ai?account=<workspace_id>">`, which this plan uses verbatim; no `onClick`/session-switch logic is added.

## Repository evidence

- Package `@sprint-mode/sm-ui`, `package.json` version `1.3.0`, trails the latest tag `v1.3.6`. `publishConfig.registry` is GitHub Packages.
- Scripts: `lint` = `eslint src/`; `type-check` = `tsc --noEmit && tsc --noEmit -p tsconfig.type-tests.json`; `test` = `vitest run`; `build` = `vite build --config vite.config.build.ts && node scripts/fix-dts-paths.js && git diff --exit-code -- dist`.
- **`dist/` is committed.** `npm run build` fails if the rebuilt `dist/` differs from the index. `AccountSwitcher.tsx` bundles into `dist/index.js`; its exported surface (`AccountSwitcher`, `AccountSwitcherProps`) has its own declaration file `dist/src/AccountSwitcher.d.ts`.
- Tests: `vitest.config.js` -- jsdom environment, `include: ['src/__tests__/**/*.test.{js,jsx}']`. The render pattern to reuse is `src/__tests__/account-switcher-menu-spec.test.jsx`'s `renderSwitcherWith()` helper (mocks `window.fetch` by URL substring, renders `AccountSwitcher` directly with `product`/`session` props).
- `src/AccountSwitcher.tsx` (current, 625 lines) already defines `fetchAccounts()` (lines 200-228, fetches `apiBase + '/api/auth/linked-accounts'`), `sectionHeader(key, label, count, subtitle?)` (lines 317-340), and `accessSection` (lines 471-503, the direct pattern to mirror: `sectionHeader` + an expandable list of `<button>` rows with `portalIcon(p)` + name + right-aligned role). It exports only `AccountSwitcher` and `AccountSwitcherProps`; `PortalInfo` and `LinkedAccount` are file-local, non-exported interfaces -- the same pattern this plan follows for a new file-local `WaffleAccount` interface.
- `src/__tests__/waffle-panel-no-cross-portal.test.jsx` (BUG-2220 lock) reads only `src/Layout.tsx`; it does not import or reference `AccountSwitcher.tsx` in any way. This plan's only source change (`AccountSwitcher.tsx`) cannot trip that test, confirmed by inspection, not assumption. This plan does not modify that test file.
- No `@sprint-mode/waffle-panel` dependency and no `waffle-accounts` string exist anywhere in this repository (`node_modules/@sprint-mode` absent; full-repo grep returns nothing) -- this plan is sm-ui-only, consistent with "Any sm-api changes" being out of scope.
- CI (`.github/workflows/ci.yml`): jobs `lint`, `type-check`, `build`, `test`, gated by `ci-gate` (`needs: [lint, type-check, build, test]`), on Node 20 with `npm ci`. Base commit `22ab80c3f51605051c8899f6a5ecce28e7bb81d1` has a `push` CI run (`35256958355`) with `ci-gate` `completed`/`success` (re-confirmed this run via `gh run view`).
- **Release mechanism** (`.github/workflows/publish.yml`): runs on `workflow_run` of CI `completed` on `main` with conclusion `success`. It builds, resolves the publish version (uses `package.json` only when strictly ahead of the latest `v*` tag, otherwise auto-bumps the patch from the latest tag), tags `v<version>`, and runs `npm publish` to GitHub Packages. **This plan does not bump `package.json`.** The landing merge publishes `v1.3.7` (next patch after `v1.3.6`), unless a later merge lands first and advances the tag -- the exact published version is read, not assumed, at comment time (T6).
- Precedent for the Done-when publish comment: TASK-3822 posted `"package published 1.0.0"` on this same anchor item, FEAT-3814, citing the publish workflow run URL and the git tag as evidence. T6 mirrors that evidence shape for sm-ui.
- Local state at planning: `node_modules/` absent (gitignored). Local Node is v26.7.0; CI uses 20. `package-lock.json` present. `git config --get-all credential.https://github.com.helper` is `!/opt/homebrew/bin/gh auth git-credential`; `gh api user --jq .login` is `amh-gh`; `gh api repos/sprint-mode/sm-ui --jq .permissions.push` is `true`.

## Acceptance matrix

| ID | Stored Done when criterion | Tasks | Evidence |
|---|---|---|---|
| AC1 | The user menu shows one line per Waffle account under the linked identity for any identity that holds a waffle customer role, matching mock screen 2 | T0, T1, T2, T3, T4, T5 | New tests in `src/__tests__/task-3823-waffle-account-subrows.test.jsx`: the Waffle section renders with one row per account returned by a mocked `/api/auth/waffle-accounts`, each row shows the account name and humanized role and links to `https://waffle.sprintmode.ai?account=<workspace_id>`; the section is absent when the endpoint returns an empty list; section header copy/order/layout match T1's confirmed mock reading. `npm test`, `npm run lint`, `npm run type-check`, `npm run build` all exit 0. |
| AC2 | sm-ui is published and `"sm-ui published <version>"` is posted on FEAT-3814 (`bug_b4045a3a37313a1a`) | T6 (post-landing; **not** an `/execute` task) | A successful `Publish` run for the merge SHA, a `v<version>` tag pointing at it, and the exact Waffle comment posted on `bug_b4045a3a37313a1a`, in the shape TASK-3822 used on the same anchor item. This is release-and-comment evidence collected after landing (owned by `/merge`/`/ship`, driven by the orchestrator), not code `/execute` produces. |

Every task maps to at least one ID above. No task pursues an outcome outside TASK-3823. `/execute` performs T0-T5; T6 is documented here for full Done-when coverage but is explicitly out of `/execute`'s authority (see Stop conditions).

### Repeated-defect-family planning

Not applicable. This is a single new-feature addition (one endpoint, one new section in one file), not a defect repair, and there is no second evidenced occurrence of a shared failure pattern to sweep.

## Planned mutation paths

| Repository-relative path | Operation | Pair |
|---|---|---|
| `node_modules` | `create` | `-` |
| `src/AccountSwitcher.tsx` | `modify` | `-` |
| `src/__tests__/task-3823-waffle-account-subrows.test.jsx` | `create` | `-` |
| `dist/index.js` | `modify` | `-` |

`node_modules` is gitignored install output from T0 and is never committed. The plan file itself is committed by `/plan` before `/execute` and is not an execution mutation. `dist/src/AccountSwitcher.d.ts` is expected to stay byte-identical (no new/changed exported symbol -- see Interpretation 1 and Risks); if the build changes it, that is a stop condition, not a silent extra mutation.

## Tasks

### T0 -- Install dependencies and record the baseline (setup for AC1)

- Files: `node_modules` (create; gitignored).
- Commands: `npm ci`. Then `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. Record each exit code and the vitest pass/fail counts as the baseline.
- Expected: all four exit 0 on unchanged `22ab80c3f5`. Then `GIT_OPTIONAL_LOCKS=0 git status --porcelain=v1 --untracked-files=all` is empty (the lockfile and `dist/` are unchanged after an unchanged-tree build).
- If `npm run build` on the unchanged base leaves a `dist/` diff (Node v26 local vs. CI's Node 20), stop: report `blocked` -- the committed-`dist` gate could not be proven reproducible.
- Commit boundary: none.

### T1 -- Discovery: confirm mock screen 2's visual contract (AC1)

- Files: none (read-only discovery).
- Read the approved mock at `sm-jockey/_briefs/mocks/sm-control-5/waffle-panel-module/` (screen 2) from wherever the execution checkout can reach it. Confirm and record: (a) the exact Waffle section header copy and whether it uses `sectionHeader()`'s existing `LABEL(count)`/`· subtitle` shape or literal different text; (b) the section's position relative to "Roles on X", "Portal access", and "Linked accounts"; (c) whether sub-rows show an icon (and if so, since `WaffleAccount` carries no logo/brand fields, confirm the fallback is the same no-logo circle-with-initial branch `portalIcon()` already uses for portals with no `logo_mark_url`); (d) the exact row text order (name then role, as in "Homey / Owner"); (e) whether every returned account renders or `is_current` changes anything (Interpretation 3).
- If the mock asset cannot be read from the execution checkout, fall back to the stored Context paraphrase verbatim ("Waffle -- 3 accounts" header, "Homey / Owner" / "Sprint Mode > Switchpoint / Member" rows) and record the fallback explicitly as a limitation in the handoff evidence (T5) -- do not block solely on an unreadable mock when the stored Context already describes the target shape, but do not invent visual details the Context does not give either.
- Expected outcome: a short, written record (in the execution transcript / commit body, not a new file) of the confirmed or fallback header copy, position, icon treatment, and row layout, used to write T2's assertions precisely instead of guessing.
- Commit boundary: none.

### T2 -- RED: failing tests for the Waffle sub-rows section (AC1)

- Files: `src/__tests__/task-3823-waffle-account-subrows.test.jsx` (create).
- Follow `account-switcher-menu-spec.test.jsx`'s `renderSwitcherWith()` pattern: mock `window.fetch` by URL substring, add a case for `/api/auth/waffle-accounts` returning `{ ok: true, data: { accounts: [...] } }` with objects shaped `{ workspace_id, name, role, is_current }`, render `AccountSwitcher` directly with `product`/`session` props.
- Cases (exact copy/order/layout from T1's confirmed reading; the working assumption if T1 falls back is the stored Context example):
  1. With three accounts (for example `homey` / `owner`, `switchpoint` / `member`, one more), the Waffle section header renders and, once expanded, shows exactly one row per account, each showing the account name and a humanized role (`owner` → `Owner`, `member` → `Member`, matching the existing `titleCase()` helper's output, since `WaffleAccount` has no `role_display_name` field to prefer).
  2. Each row is an `<a>` element with `href="https://waffle.sprintmode.ai?account=" + workspace_id` for that row's `workspace_id` -- not a `<button>`, and no `switch-account` POST fires on click (unlike `accessSection`/linked-account rows).
  3. When `/api/auth/waffle-accounts` returns an empty `accounts` array, the Waffle section does not render at all (mirrors `accessSection`'s `accessPortals.length > 0` gate).
  4. Section collapses by default and expands on header click, consistent with every other section (mirrors test (5) in `account-switcher-menu-spec.test.jsx`).
  5. The existing sections (`Roles on X`, `Portal access`, `Linked accounts`) and their existing passing tests are unaffected -- run the full existing `account-switcher-menu-spec.test.jsx` file alongside the new one.
- RED: `npx vitest run src/__tests__/task-3823-waffle-account-subrows.test.jsx` fails every new case, because `AccountSwitcher.tsx` never calls `/api/auth/waffle-accounts` and renders no Waffle section today. Record the actual failing assertions.
- No production code changes in T2.
- Commit boundary: none. T2 and T3 are committed together as one reviewable fix commit, so no committed state has a red suite.

### T3 -- GREEN: Waffle sub-rows in `src/AccountSwitcher.tsx` (AC1)

- Files: `src/AccountSwitcher.tsx` (modify).
- Smallest change, mirroring the file's own established conventions exactly (Interpretations 1-5):
  - Add a file-local, non-exported `WaffleAccount` interface: `{ workspace_id: string; name: string; role: string; is_current: boolean }` -- the shape TASK-3836 ships, nothing more.
  - Add `waffleAccounts`/`setWaffleAccounts` and a loaded flag via `useState`, next to the existing `accounts`/`loaded` state (no reuse of `_linkedCache` -- a separate module-level cache keyed the same way as `_linkedCache`, or no cache at all if the existing pattern does not cleanly extend, is an implementation choice for T3 to make and record; either is a smallest-change option that does not alter `fetchAccounts()`'s own behavior).
  - Add `fetchWaffleAccounts()`, mirroring `fetchAccounts()`'s shape: `fetch(apiBase + '/api/auth/waffle-accounts', { credentials: 'include', headers: authHeaders() })`, parses `{ ok, data: { accounts } }`, and sets state. Call it from the existing effect (or a new one) alongside `fetchAccounts()`/`fetchMe()`.
  - Add a `waffleSection`, built the same way `accessSection` is built: `sectionHeader('waffle', <confirmed label>, waffleAccounts.length[, <confirmed subtitle if any>])`, gated on `waffleAccounts.length > 0`, with rows over `waffleAccounts` instead of `accessPortals`.
  - Each row is `React.createElement('a', { key: a.workspace_id, href: 'https://waffle.sprintmode.ai?account=' + encodeURIComponent(a.workspace_id), ...similar layout styles to accessSection's row... }, <name>, <humanized role via titleCase(a.role)>)` -- no `onClick`, no `handlePortalClick` (Interpretation 5). Reuse the existing row layout (flex, padding, hover styles) for visual consistency; do not introduce new CSS.
  - Insert `waffleSection` into the returned `React.Fragment` at the position T1 confirmed (default: immediately after `accessSection`, before `linkedSection`, if T1 found no contrary evidence).
  - Do not change `AccountSwitcherProps`, `PortalInfo`, `LinkedAccount`, `fetchAccounts()`, `accessSection`, `linkedSection`, `rolesSection`, or any exported symbol.
- Verify: `npx vitest run src/__tests__/task-3823-waffle-account-subrows.test.jsx src/__tests__/account-switcher-menu-spec.test.jsx` passes every case. Then `npm test`, `npm run lint`, `npm run type-check` exit 0.
- Commit boundary: one commit with `src/AccountSwitcher.tsx` and the new test, message `feat(user-menu): Waffle account sub-rows (TASK-3823)`.

### T4 -- Rebuild and commit `dist/` (AC1)

- Files: `dist/index.js` (modify, generated).
- Commands: `npm run build`. It exits 1 on the first run because `dist/index.js` changed. Inspect `GIT_OPTIONAL_LOCKS=0 git diff --stat -- dist`: only `dist/index.js` may change. Then `git add dist/index.js` and run `npm run build` again, which must exit 0.
- If `dist/src/AccountSwitcher.d.ts` or any other `dist/` path changes, stop: that means an unplanned type-surface change (contradicts Interpretation 1 -- no exported symbol changed). Revert that path's build output with `git checkout -- <path>` and report.
- Commit boundary: one commit with `dist/index.js`, message `build(dist): rebuild for Waffle account sub-rows (TASK-3823)`.

### T5 -- Final gate and handoff evidence (AC1)

- Commands, from a clean tree: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. All exit 0. `GIT_OPTIONAL_LOCKS=0 git status --porcelain=v1 --untracked-files=all` is empty.
- Evidence to hand off:
  - Test counts compared with the T0 baseline.
  - The new test file name and case list.
  - The two commit SHAs (T3, T4).
  - `git diff --stat 22ab80c3f5..HEAD`, limited to the two committed mutation paths plus this plan.
  - T1's confirmed (or fallback) mock reading, so `/review-pr` can independently sanity-check the visual match.
  - An explicit statement that AC2 (publish + FEAT-3814 comment) is not attempted by `/execute` -- it is post-landing evidence for `/merge`/`/ship` (T6 below).
- Commit boundary: none.

### T6 -- Post-landing: publication and FEAT-3814 comment (AC2; **not** an `/execute` task)

- This task is not performed by `/execute` and must not be scheduled inside it -- `/execute` never pushes, merges, or posts Waffle comments. It is named here only so AC2 has full, traceable coverage in this plan, and to hand the orchestrator's later `/merge`/`/ship` phase exact evidence commands.
- After the branch lands on `main` and CI is green on the merge SHA: `gh run list --repo sprint-mode/sm-ui --workflow publish.yml --json databaseId,status,conclusion,headSha` for the merge SHA; `gh run view <id> --repo sprint-mode/sm-ui --json jobs` to confirm the `publish` job concluded `success`; `gh api repos/sprint-mode/sm-ui/git/ref/tags/v<version>` to confirm the tag exists and points at the merge SHA. `<version>` is read from that tag, not assumed (it will be `1.3.7` unless another merge lands first and advances it further).
- Then post a Waffle comment on FEAT-3814 (`bug_b4045a3a37313a1a`) reading `"sm-ui published <version>"`, in the evidence shape TASK-3822 already used on this same anchor item.
- Commit boundary: none (no repository mutation).

## Impacts

- Security: none. Sub-row links are plain anchors to a known, fixed Waffle host (`https://waffle.sprintmode.ai`) with a `workspace_id` the identity's own session already legitimately holds (the endpoint itself scopes results to the signed-in session -- ruling (b)); no new credential or cross-origin flow is introduced.
- Data and migrations: none. No sm-api change (ruling (b) final).
- Compatibility: `AccountSwitcherProps` is unchanged; no consumer-facing prop or exported type changes. Consumers that do not yet serve `/api/auth/waffle-accounts` through their proxy simply see the new fetch fail silently (mirrors `fetchAccounts()`'s existing `.catch(function() { setLoaded(true) })` pattern) and no Waffle section renders -- no regression for portals without the route.
- Operations: the release comes from the existing `Publish` workflow on the landing commit; no `package.json` edit is needed. Rollback is a revert PR through `/merge`, which publishes the next patch with the old behavior.
- Documentation: no README change -- no new prop or public API is added.

## Risks and failure handling

- The committed `dist/` could be non-reproducible across Node versions (local v26 vs. CI 20); T0 detects this before any change, and CI's `build` job re-proves it on Node 20.
- The mock (T1) may be unreachable from inside the execution checkout the same way it was unreachable during this planning session (sandboxed to the sm-ui repository only); the fallback in T1 keeps the plan executable without inventing unconfirmed visual detail, and T5's handoff evidence flags whichever path was taken so `/review-pr` can verify against the real mock if the reviewer has broader access.
- `fetchWaffleAccounts()` failing (network error, proxy 404 on an un-updated portal) must degrade the same way `fetchAccounts()` already does -- silently, with the Waffle section simply absent -- not throw or block the rest of the menu.
- AC2 cannot be produced by `/execute` at all (it requires a landed, published SHA); T6 exists purely so the acceptance matrix has no silently-dropped criterion, and the Stop conditions below repeat that `/execute` must not attempt it.

## Execution controls

| Control | Value | Rationale |
|---|---|---|
| `max_wall_clock_minutes` | 70 | One source file, one new test file, one generated bundle, plus a bounded discovery step. The caller ceiling for this autopilot run is 180. |
| `max_turns` | 90 | Install, discovery, RED, GREEN, rebuild, and gates fit comfortably below the caller ceiling of 250. |
| `budget` | 900000 tokens | `src/AccountSwitcher.tsx` is 625 lines and `dist/index.js` is large; reads are sliced. The caller ceiling is 3,000,000. |
| `retry_ceiling_per_gate` | 2 | Each of lint, type-check, test, and build may be re-run at most twice after a fix. |

### Stop conditions (return `blocked`, do not improvise)

- Scope drift: a needed change outside the Planned mutation paths, any change to `AccountSwitcherProps`/`PortalInfo`/`LinkedAccount`/other exported symbols, any need to touch `Layout.tsx`, `waffle-panel-no-cross-portal.test.jsx`, or any sm-api repository to satisfy AC1. Route the delta through `/ticket`.
- Waffle drift: the TASK-3823 binding recomputed with `wf-ready.py`'s `item_binding()` differs from this plan, the item is closed, deferred, or not Ready/`in_progress`, or a written HOLD appears.
- Design drift: a material decision surfaces that the stored, corrected Scope/Constraints do not settle (for example, the endpoint contract turning out not to match `workspace_id`/`name`/`role`/`is_current` when actually called against a live backend).
- Branch state: the tree is dirty before T0, HEAD is not `autopilot/TASK-3823-waffle-accounts-subrows-9b247f`, or HEAD is detached or on `main`.
- Repeated failure: any gate still fails after 2 retries, or the T0 baseline is not green or not reproducible.
- Unavailable authorization or identity: any readiness input below is `unavailable` or `failed`.
- Exhausted controls: any value in the table above is reached.
- `/execute` never pushes, opens a PR, reviews, merges, enters the merge queue, publishes, or posts Waffle comments. T6 (AC2) is explicitly reserved for `/merge`/`/ship`, driven by the orchestrator, after landing.

## Execution readiness inputs

All proofs are read-only. Git reads run as `env GIT_CONFIG_NOSYSTEM=1 GIT_OPTIONAL_LOCKS=0 GIT_PAGER=cat /usr/bin/git --no-optional-locks ...`. No proof fetches, installs, stashes, commits, pushes, or edits configuration.

| Key | Exact command or read | Passing evidence | Unavailable / failed |
|---|---|---|---|
| `item_binding` | MCP `getWorkItem TASK-3823`, then `item_binding()` from `~/.sm-workflow/libexec/wf-ready.py` on `{display_id, description, updated_at}` | Equals `sha256:39e4dde7f617dedc104a127fcc3b916108ca463bee7fecb8e729a6de1c90b95e`; status open or `in_progress`; Readiness `Ready`; no HOLD tag | MCP error: unavailable. Mismatch or state change: failed |
| `plan_binding` | `wf ready prepare TASK-3823 --plan docs/plans/2026-09-18-task-3823-waffle-accounts-subrows.md`; `git log -1 --format=%H -- docs/plans/2026-09-18-task-3823-waffle-accounts-subrows.md` | `wf ready` accepts the single binding and revision lines; the plan is committed on the feature branch | Parse refusal: failed. Missing file: unavailable |
| `repository` | `git remote get-url origin` | `https://github.com/sprint-mode/sm-ui.git`, equal to the Allowed repository `sprint-mode/sm-ui` in allowed org `sprint-mode` | Other value: failed |
| `feature_branch` | `git symbolic-ref --short HEAD` | `autopilot/TASK-3823-waffle-accounts-subrows-9b247f` | Detached: unavailable. Other branch: failed |
| `target_branch` | `grep '^landing_branches=' .sm-workflow.conf` | `landing_branches=main` | Missing: unavailable |
| `base_sha` | `git ls-remote origin refs/heads/main` gives T. Then `git cat-file --batch-all-objects --batch-check='%(objectname) %(objecttype)'` must list `T commit`, and `git rev-list --missing=print T ^HEAD` must print nothing | T present locally as a commit (at planning: `22ab80c3f51605051c8899f6a5ecce28e7bb81d1`); zero commits in T not in HEAD; no `?` line | T not local, nonzero exit, or `?` line: unavailable. Positive count: failed (the caller synchronizes before `/execute`) |
| `working_tree` | `git --no-optional-locks status --porcelain=v1 --untracked-files=all`. Then `pwd -P` as root R. For each mutation path: `test -e`/`test -L`/`test -f`/`test -w` on the target, and for each ancestor from R to the immediate parent: `test -d`, `! test -L`, `test -x` (plus `test -w` on the parent), with `realpath` confirming containment in R | Empty status. `src/AccountSwitcher.tsx` and `dist/index.js` are existing non-symlink writable regular files. `src/__tests__/task-3823-waffle-account-subrows.test.jsx` and `node_modules` have no entry and no symlink. `src/__tests__`, `src`, `dist`, and R are searchable non-symlink directories, immediate parents are writable, and all are inside R | Unreadable: unavailable. Any other result: failed |
| `git_metadata` | `git rev-parse --git-dir --git-common-dir --git-path objects --git-path refs --git-path index --git-path COMMIT_EDITMSG --git-path logs/HEAD --git-path refs/heads/autopilot/TASK-3823-waffle-accounts-subrows-9b247f --git-path logs/refs/heads/autopilot/TASK-3823-waffle-accounts-subrows-9b247f`, then `realpath` of the objects dir O, `find O -maxdepth 1 -iname '[0-9a-f][0-9a-f]'`, and `test -d -a -w -a -x` / `! test -L` on each | Git dir, common dir, refs, O, and every fanout entry are writable and searchable directories. The index is writable. The loose-ref parent and both reflog parents are writable; existing reflog files are writable. `COMMIT_EDITMSG` is absent, or is a writable non-symlink regular file | Missing or unreadable path, or detached HEAD: unavailable. Non-writable path or invalid fanout (including a dangling symlink): failed |
| `github_identity` | `gh api user --jq .login` | A non-empty login L (at planning: `amh-gh`) | Error: unavailable |
| `waffle_identity` | `wf doctor --machine` (Waffle lines) and MCP `getWorkItem TASK-3823` | `PASS Waffle human OAuth` and `PASS Waffle agent profile`; item readable | Otherwise: unavailable |
| `push_capability` | `git config --get-all credential.https://github.com.helper` then `gh api repos/sprint-mode/sm-ui --jq .permissions.push` | The helper is `gh auth git-credential`, so the transport actor is the gh login L; push permission for L is `true` (at planning: `true`) | Different or unknown helper, or unverifiable actor: unavailable. `false`: failed |
| `commands` | `node --version`; `npm --version`; `npm pkg get scripts.lint scripts.type-check scripts.test scripts.build` | Node >= 20; npm present; the four scripts exist exactly as listed in Repository evidence. `npm ci`, `npx vitest`, and `npm run {lint,type-check,test,build}` are then runnable | Missing binary or script: unavailable |
| `dependencies` | `test -f package-lock.json`; `npm ping --registry https://registry.npmjs.org/` | Lockfile present; public registry reachable (no GitHub Packages dependency is added by this plan -- the only runtime dependency is `@simplewebauthn/browser`) | Registry unreachable: unavailable |
| `target_ci` | `gh run list --repo sprint-mode/sm-ui --workflow ci.yml --commit T --json databaseId,status,conclusion,event`, then `gh run view <id> --repo sprint-mode/sm-ui --json jobs --jq '.jobs[] \| select(.name=="ci-gate") \| [.status,.conclusion]'` | Job `ci-gate` is `completed`/`success` on exact T (at planning: run `35256958355` on `22ab80c3f5`, `["completed","success"]`, re-confirmed this run) | Unreadable or incomplete: unavailable. Missing, skipped, or non-success `ci-gate`: failed |

## Evidence required before `/review-pr` and `/merge`

- The T0 baseline and T5 final gate outputs (lint, type-check, test counts, build exit 0).
- The new test file and the names of its passing cases for AC1 (rendering, link href, empty-list gating, collapse/expand).
- T1's confirmed (or fallback) reading of mock screen 2, so the reviewer can independently sanity-check the visual match against the real mock.
- The two commit SHAs on `autopilot/TASK-3823-waffle-accounts-subrows-9b247f`. The diff is limited to `src/AccountSwitcher.tsx`, the new test, and `dist/index.js`, plus this plan.
- A post-landing AC2 check owned by `/merge`/`/ship` (T6): the `Publish` run for the merge SHA succeeded, tag `v1.3.7` (or the next actual tag) exists, and the `"sm-ui published <version>"` comment has been posted on FEAT-3814.
