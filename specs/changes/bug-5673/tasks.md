# bug-5673 tasks

- [x] T1. Change the row key in `CmdK.renderRow` (`src/Layout.tsx:485`) from `item.to || item.label || idx` to `(item.to || item.label || '') + '#' + idx`. Serves S1, S2, S3; S4 to S7 must still pass.
- [x] T2. Run `npx vitest run src/__tests__/bug-5673.acceptance.test.jsx`: all 7 tests pass. Serves S1 to S7.
- [x] T3. Rebuild `dist/` with `npm run build` and commit the regenerated `dist/index.js` (and any other file the build changes under `dist/`). Then run `npm run build` again: it must exit 0 with no diff under `dist/`. Serves the publish Done-when item (not a scenario).
- [x] T4. Run the full gates: `npm run lint`, `npm run type-check`, `npm test`. All must pass. Serves S1 to S7 and the guards in other test files.
