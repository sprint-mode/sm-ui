# Request: BUG-5673

- Source: Waffle item `BUG-5673` (internal id `bug_3cf96a338083dbc1`), product `ui`, type `bug`, priority `normal`, tags `pilot:rails,model:sonnet`.
- Submitted by: Nikola Dulovic, 2026-11-06 10:07:02.
- Intake date: 2026-11-16.
- Comments on the item at intake: none.

The text below is the item's title and description, copied verbatim.

---

## Title

Search palette keeps stale rows when two results share a link

## Summary

The shared search palette keys each row by its link, so results that share a link collide and React keeps rows from earlier searches. On Signal on 2026-11-06 the palette held 29 rows while its footer said `10 items`.

## Why

A person who types a name one letter at a time sees more rows than the search returned, including rows that no longer match. Reproduced in production on https://signal.sprintmode.ai on 2026-11-06: typing `Nikola` one letter at a time left 29 `a` elements in the palette while the footer read `10 items`. One of them was `Daniel Zacharias`, left over from the search for `Ni`. Typing the same word with fewer pauses drew 10 rows, so the count depends on how many searches ran. Nikola Dulovic's own screenshot shows 15 rows above the same `10 items` footer.

## Scope

- In `src/Layout.tsx`, `renderRow` sets `key: item.to || item.label || idx`. Give every row a key that is unique within the list, including rows that share `to`.

## Done when
- A test renders a palette whose results hold two rows with the same `to`, changes the results, and finds only the current rows in the DOM.
- The same test finds the number of rows in the DOM equal to the number in the footer.
- A published `@sprint-mode/sm-ui` version contains the fix.

## Constraints

- sm-ui only.
- No change to the palette's look, its filtering or its props.
- A consumer picks the fix up on its own next bump; this item bumps no consumer.

## Out of scope

- What Signal's search returns, which the other two items filed on 2026-11-06 cover.
- The other `key={item.to}` uses in `src/Layout.tsx`, which draw navigation lists and were not seen to misbehave.
- Bumping sm-ui in any consumer.

## Context

- Found while diagnosing Nikola Dulovic's report that Signal search shows too many rows.
- Signal stops producing shared links once its own search fix lands, so this item does not block Signal. By code read, not tested live, other portals still produce them: `GET /api/search` in sm-api gives every finance contract row the path `/finance/contracts`.
- Model proposal: model:sonnet. It missed the model:haiku test because the test file is not named here.

## Execution metadata
- Allowed repository: sprint-mode/sm-ui
- Operating mode: rails
- Pilot tag: pilot:rails
- Model tag: model:sonnet
- Readiness: Ready
- HOLD policy reference: Supplied AGENTS.md Landing code, Native delivery lifecycle, HOLD and autonomous execution, and Deploys. Apply written classes; no HOLD outcome is waived.
- Decision owner: ct_eea25abc3d14d641
- Fallback channel: Waffle email
- Acknowledgment policy: Existing Pulse policy: pause for Nikola on scope or HOLD decisions. Silence is not approval.
