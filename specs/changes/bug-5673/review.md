# Review: bug-5673

Verdict: PASS
Reviewed head: 4d106e35e4c3a95d8a878a3b82edf5b19d6029c5
Lock: ok

## Scenarios
All tests are in `src/__tests__/bug-5673.acceptance.test.jsx`.

| Scenario | Test | Assertion | Result |
|---|---|---|---|
| S1 | `[bug-5673 S1]` | L78 `expect(texts).toHaveLength(1)`, L79 `expect(texts[0]).toContain('Nikola Dulovic')`, L80 `expect(palette.container.textContent).not.toContain('Daniel Zacharias')`, L81 `expect(palette.container.textContent).not.toContain('Nina Ortiz')` | pass |
| S2 | `[bug-5673 S2]` | L87 `expect(screen.getByText('1 items')).toBeTruthy()`, L88 `expect(rows(palette.container)).toHaveLength(1)` | pass |
| S3 | `[bug-5673 S3]` | L71 `expect(duplicateKeyMessages).toEqual([])` (filters `Encountered two children with the same key`; spy set before render) | pass |
| S4 (guard) | `[bug-5673 S4]` | L95 `expect(texts).toHaveLength(2)`, L96 `expect(texts[0]).toContain('Daniel Zacharias')`, L97 `expect(texts[1]).toContain('Nina Ortiz')`, L98 `expect(screen.getByText('2 items')).toBeTruthy()` | pass |
| S5 (guard) | `[bug-5673 S5]` | L106 `expect(palette.onClose).toHaveBeenCalledTimes(1)`, L107 `expect(palette.onNavigate).toHaveBeenCalledTimes(1)`, L108 `expect(palette.onNavigate).toHaveBeenCalledWith('/people')` | pass |
| S6 (guard) | `[bug-5673 S6]` | L122 `expect(texts).toHaveLength(1)`, L123 `expect(texts[0]).toContain('Contracts')`, L124 `expect(screen.getByText('1 items')).toBeTruthy()` | pass |
| S7 (guard) | `[bug-5673 S7]` | L133 `expect(screen.getByText('Recent')).toBeTruthy()`, L135 `expect(texts).toEqual(['Contracts', 'Dashboard'])`, L136 `expect(screen.getByText('2 items')).toBeTruthy()` | pass |

The reviewer bundled both versions of `src/Layout.tsx` in memory and ran the `Ni` and then `Nik` sequence under jsdom:
- `main`: after `Nik` the rows are `["Daniel Zacharias","Nikola Dulovic"]` while the footer reads `1 items`, and React logs 1 duplicate-key error.
- Head: after `Nik` the only row is `["Nikola Dulovic"]`, and React logs 0 duplicate-key errors.

The key `(item.to || item.label || '') + '#' + idx` is unique in every list that `renderRow` draws. The part after the last `#` is always `idx`, and `idx` is unique in the recent list (`src/Layout.tsx:584`, the array index) and in `renderGrouped` (`src/Layout.tsx:541-548`, a running counter across sections).

## Gates
- Acceptance tests: `Test Files  1 passed (1)`, `Tests  7 passed (7)`.
- `npm test`: `Test Files  39 passed (39)`, `Tests  408 passed (408)`.
- `npm run type-check`: exit 0, no messages.
- `npm run lint`: `✖ 136 problems (0 errors, 136 warnings)`. `main` has the same 136 warnings, and the warning list for `src/Layout.tsx` is identical on both sides. The change adds no warning.

## Scope and risk
- Changed code: `src/Layout.tsx` (one line, L485), `dist/index.js` (the same line, compiled, at L105770) and the new acceptance test file. These match `design.md` and `tasks.md`.
- The navigation-list keys in `src/Layout.tsx` are unchanged.
- The diff touches no migration, auth, session, role, billing, email, secret, `wrangler*.toml`, CI or deploy file. Risk `low` holds.

## Findings
- note `specs/changes/bug-5673/`: the six factory records (`request.md`, `spec.md`, `design.md`, `tasks.md`, `approval.json`, `change.json`) are outside the "Files to change" list in `design.md`. They are records, not code.
- note `dist/index.js`: the reviewer did not re-run the second `npm run build` because the build writes to `dist/`. The builder ran it and it exited 0, and CI's `git diff --exit-code -- dist` checks it again.
- note `src/Layout.tsx:475`, `src/Layout.tsx:486`: pre-existing and outside the diff. `window.location.href = item.to` and `href: item.to || '#'` use result links without a check. The links come from the consumer's own `items` and `onSearch`. This change does not touch or worsen that.
- note `src/Layout.tsx:543`: pre-existing and outside the diff. The section Fragment key `sec || '_' + idx` can collide only with a section named like `_0`. It is not a row key.
