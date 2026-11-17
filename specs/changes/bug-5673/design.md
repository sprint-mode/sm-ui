# bug-5673 design

## Approach
`CmdK.renderRow` in `src/Layout.tsx:485` sets `key: item.to || item.label || idx`. Two rows with the same `to` get the same key. When the next result list starts with a different key, React's keyed reconciliation keeps one of the old rows in the DOM and never deletes it. The acceptance test reproduces this: after `Ni` then `Nik`, the palette holds 2 rows while the footer reads `1 items`.

The fix changes that one line to `key: (item.to || item.label || '') + '#' + idx`.

- `idx` is unique within every list that `renderRow` draws. `renderGrouped` passes a running index that grows across sections, and the recent list passes its array index. The `'#' + idx` suffix therefore makes the key unique, including for rows that share `to`.
- The `to` or `label` prefix keeps the key readable in React DevTools. When a different item takes the same position, React mounts a new row instead of patching the old one.
- The rows hold no local state. Their highlight comes from the `hi` state of `CmdK`. A key that also changes with position therefore changes nothing that a person sees.

## Files to change
- `src/Layout.tsx`: the `key` of `renderRow`, one line.
- `src/__tests__/bug-5673.acceptance.test.jsx`: new, the acceptance tests (written in the plan step, locked at approval).
- `dist/index.js`: rebuilt with `npm run build`. CI runs the same build, and it fails when `dist/` differs from the build output (the `build` script ends with `git diff --exit-code -- dist`). If the build regenerates another file under `dist/`, the build step lists it.

## Risk
`low`. The change is one React `key` in one client-side component. It touches no migration, auth, session, role, billing, email, secret, `wrangler*.toml`, CI or deploy file.

Note for the merge decision: `.github/workflows/publish.yml` publishes a new patch version of `@sprint-mode/sm-ui` to GitHub Packages after CI is green on `main`. A merge therefore publishes the package. Eugenio de Tomaso decides both.

## What does not change
- The palette's look: no style, element or text changes. Only the `key` value changes.
- Its filtering: `filtered`, `dedupedAsync` and `allItems` stay as they are.
- Its props: `CmdKProps` and `CmdKItem` stay as they are.
- The `key={item.to || item.label}` uses in the navigation lists of `src/Layout.tsx` (lines 1260 and 2560), which are out of scope.
- `package.json` `version`: `publish.yml` picks the next version itself.
- No consumer is bumped.
- The mismatch between `dedupedAsync` (keyboard list) and `asyncItems` (drawn rows) stays as it is. It went to the `ui` stack's debt list as comment `plc_aa12cdd00e5767c4`.
