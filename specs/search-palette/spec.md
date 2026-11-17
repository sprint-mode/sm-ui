# search-palette

## Requirement: Palette rows match the current results
Added by bug-5673 (BUG-5673).

The `CmdK` palette SHALL draw exactly one row for each current result, including results that share the same `to`, and SHALL draw no row from an earlier result list.

Shared setup for S1 to S5: `CmdK` renders with `open` set to `true`, `onClose` and `onNavigate` as spies, no `items`, and an `onSearch` that resolves by query:

- `Ni` resolves `{ items: [{ label: 'Daniel Zacharias', to: '/people', section: 'People' }, { label: 'Nina Ortiz', to: '/people', section: 'People' }], total: 2 }`.
- `Nik` resolves `{ items: [{ label: 'Nikola Dulovic', to: '/people/nikola', section: 'People' }], total: 1 }`.

A "row" is an `a` element in the palette's result list.

### Scenario S1: Rows from an earlier search are gone after the results change
- WHEN the person types `Ni`, the `Ni` results render, and the person then types `Nik` and the `Nik` results render
- THEN the palette holds exactly 1 row, its text contains `Nikola Dulovic`, and the texts `Daniel Zacharias` and `Nina Ortiz` appear nowhere in the palette

### Scenario S2: The number of rows equals the footer count
- WHEN the same sequence as S1 has run
- THEN the footer reads `1 items` and the palette holds 1 row

### Scenario S3: Rows that share a link raise no duplicate-key warning
- WHEN the person types `Ni` and the `Ni` results render
- THEN React logs no `console.error` message that contains `Encountered two children with the same key`

### Scenario S4 (guard): Both rows that share a link are drawn
- WHEN the person types `Ni` and the `Ni` results render
- THEN the palette holds 2 rows, in the order `Daniel Zacharias`, `Nina Ortiz`, and the footer reads `2 items`

### Scenario S5 (guard): A click on a row that shares a link still navigates
- WHEN the `Ni` results render and the person clicks the row `Nina Ortiz`
- THEN `onClose` is called once and `onNavigate` is called once with `/people`

### Scenario S6 (guard): Static items still filter by the query
- WHEN `CmdK` renders open with no `onSearch` and `items` set to `[{ label: 'Dashboard', to: '/', section: 'Pages' }, { label: 'Contracts', to: '/finance/contracts', section: 'Finance' }]`, and the person types `contr`
- THEN the palette holds 1 row, its text contains `Contracts`, and the footer reads `1 items`

### Scenario S7 (guard): Recent rows still show when the query is empty
- WHEN `localStorage` holds `[{"label":"Contracts","to":"/finance/contracts"},{"label":"Dashboard","to":"/"}]` under the key `cmdk-test-recent`, and `CmdK` renders open with `recentKey` set to `cmdk-test-recent` and an empty query
- THEN the palette shows the heading `Recent`, holds 2 rows in the order `Contracts`, `Dashboard`, and the footer reads `2 items`

Tests: `src/__tests__/bug-5673.acceptance.test.jsx`.
