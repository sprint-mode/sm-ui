# FEAT-5737 plan, sm-ui PR: Login can open on its sign-up form

Plan for FEAT-5737 in sprint-mode/sm-ui (one of the square's five PRs, by Nikola's ruling 2026-11-12, "Add it to sm-ui"; it lands before the sm-raise-dash PR, which pins the released version for raise.sprintmode.ai/auth/signup).

- Item binding: `sha256:0000000000000000000000000000000000000000000000000000000000000000`.
- Waffle source revision: `updated_at` `2026-11-12 09:58:05`

Design binding: none. The item decides the work (Scope 3a to 3c).

Branch: `feat-5737-login-signup-mode`, cut from origin/main `721c7bd` (ci-gate success, run 39978953550). Target branch: `main`. Checkout: `C:\smwork\sm-ui-5737` (private ACL, full clone, core.autocrlf false).

This PR covers Done-when bullet 9.

## Interpretations (each one is open to the Decision owner)

1. A new optional prop, `initialMode?: "signin" | "signup"`, on `LoginProps` (src/Login.tsx:9). Login's mode state (src/Login.tsx:74, today `useState<"signin" | "signup">("signin")`) starts as `"signup"` only when `initialMode` is `"signup"` and `signupParams` is set, because sign-up needs `signupParams` (src/Login.tsx:152). Otherwise it starts as `"signin"`, exactly as today.
2. Everything else about sign-up stays as it is: the same form, the same toggle between the two modes, the same requests. Only the starting mode changes.
3. The committed `dist/` is rebuilt with `npm run build`, because CI runs the same build and fails when `dist/` differs (package.json `build` ends with `git diff --exit-code -- dist`).
4. Publishing picks the next version itself (publish.yml resolves it from the published versions), so package.json's version does not change.

## Acceptance matrix

| Id | Done when (stored) | Tasks | Evidence |
|---|---|---|---|
| DW9 | A test in sm-ui shows that Login opens on its sign-up form when the product asks for it, and on its sign-in form otherwise. | T1 | `src/__tests__/Login-initial-mode.test.jsx`: with `signupParams` and `initialMode="signup"` the first render shows the sign-up fields (first name, last name, company); without `initialMode`, or with `initialMode="signup"` but no `signupParams`, it shows the sign-in form; the toggle still switches modes |
| DW1 to DW8 | (the item's other bullets) | the other PRs and the production run | not in this PR |

## Planned mutation paths

| Path | Operation | Pair |
|---|---|---|
| `src/Login.tsx` | modify | - |
| `src/__tests__/Login-initial-mode.test.jsx` | create | - |
| `dist/index.js` | modify | - |
| `dist/src/Login.d.ts` | modify | - |

If `npm run build` regenerates any other file under `dist/`, the builder lists it and this table is corrected in a plan commit before review.

## Tasks

### T1. Login opens on its sign-up form when asked (DW9)
- Files: all paths above.
- RED: write `src/__tests__/Login-initial-mode.test.jsx` first, following `src/__tests__/Login-code-entry.test.jsx`. Against 721c7bd the `initialMode="signup"` case fails (the first render is the sign-in form).
- Change: Interpretations 1 and 2, then `npm run build` to regenerate `dist/` (Interpretation 3).
- Verify: `npm run lint`, `npx vitest run src/__tests__/Login-initial-mode.test.jsx src/__tests__/Login-code-entry.test.jsx src/__tests__/nikola-171-login-a11y.test.jsx`, then `npm test` compared by failing test names with the same run at 721c7bd, and `npm run build` after the commit reports no `dist/` difference.
- Mutation after the commit, restored from a backup copy outside the repository (never `git checkout --`): start the mode as `"signin"` always; the new sign-up test must fail.
- Commit: `FEAT-5737: Login can open on its sign-up form (initialMode)`.

## Production steps (not part of /execute)

- Merging to main publishes the next sm-ui version (Publish workflow). The sm-raise-dash PR then pins it and renders `/auth/signup` with `initialMode="signup"`.

## Execution readiness inputs

| Key | Read-only proof | Passing evidence | Unavailable or failed when |
|---|---|---|---|
| `item_binding` | `getWorkItem FEAT-5737`; the binding `wf ready prepare` computes | equals the Item binding line; status `in_progress`; Allowed repository `sprint-mode/sm-ui` | any difference (failed) or no read (unavailable) |
| `plan_binding` | `sm-wf.cmd ready prepare FEAT-5737 --plan docs/plans/2026-11-12-feat-5737-login-initial-mode.md` | `{"status":"created"}` | the command refuses |
| `repository` | `git -C C:/smwork/sm-ui-5737 remote get-url origin` | `https://github.com/sprint-mode/sm-ui.git` | another origin |
| `feature_branch` | `git -C C:/smwork/sm-ui-5737 symbolic-ref --short HEAD` | `feat-5737-login-signup-mode`, no upstream | another branch or detached HEAD |
| `target_branch` | `.sm-workflow.conf` `landing_branches=main` at HEAD | `main` | the working copy differs from HEAD |
| `base_sha` | `git ls-remote origin refs/heads/main`; `git cat-file --batch-all-objects --batch-check` lists it; `git rev-list --missing=print --count <origin-main-sha> ^HEAD` | count 0, no `?` record | not local or a `?` record (unavailable); count above 0 (failed) |
| `working_tree` | `GIT_OPTIONAL_LOCKS=0 git status --porcelain` plus the path proofs for every mutation row | clean except the committed plan; parents searchable and writable | dirty overlap or a failed path proof |
| `git_metadata` | `git rev-parse --git-dir --git-common-dir --git-path objects --git-path refs --git-path index` and write probes | every path writable | unwritable (failed) or missing (unavailable) |
| `github_identity` | `gh api user --jq .login` | an authenticated login | no login |
| `waffle_identity` | `getMyDay` through the Waffle MCP | contact `ct_eea25abc3d14d641` | unauthenticated |
| `push_capability` | `wf ready` push proof (transport actor equals the permission login) | same actor with push | mismatch or unverifiable |
| `commands` | `node --version`; package.json scripts `lint`, `test` and `build` | present | missing |
| `dependencies` | `npm ci` succeeds from the lockfile before the build | node_modules present | install fails |
| `target_ci` | `gh run view 39978953550 --repo sprint-mode/sm-ui --json jobs` for origin/main `721c7bd` | job `ci-gate` completed `success` | any other result |

## Risks

- Every product using sm-ui gets the new prop; none passes it today, so their Login renders exactly as before (Interpretation 1, pinned by a test).
- Merging publishes a new sm-ui version. Products pin exact versions, so nothing changes for a product until it bumps its pin. Rollback is a revert PR, which publishes the next version.

## Execution controls

- Max wall clock: 60 minutes for /execute (one task, one builder run).
- Max agent turns: 50 across the Sonnet builder.
- Budget: about 1.5 million tokens across builders; the /review-pr reviewer (Opus) is outside it.
- Retry ceiling: 2 attempts per failing gate, then stop and record it on FEAT-5737.
- Stop when: a change is needed outside the planned mutation paths (other than `dist/` files the build regenerates, listed by the builder); the item or its binding changes; the branch is dirty, protected or not `feat-5737-login-signup-mode`; a gate fails after its retries; an approval is unavailable; a HOLD appears; a control is exhausted. Scope additions go to /ticket.

/execute ends at the last commit. /review-pr and /merge follow; nothing here pushes, opens a PR, merges or deploys.
