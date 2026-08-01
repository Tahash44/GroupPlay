# Task Backlog

## Critical

- [x] Restore the frontend baseline: correct the game type import, remove the unused
  test import, update the history navigation test, and pass tests plus build.
- [ ] Enforce `GameSession.host == request.user` for every Spy detail, reveal, timer,
  vote, and guess endpoint; add cross-host tests.
- [ ] Stop session detail from exposing private roles/location before the appropriate
  result state; replace frontend dependence on leaked roles with a safe contract.

## High priority

- [x] Execute the design-system foundation in `Documents/design.md`: self-host fonts,
  replace remote icon fonts, merge tokens, add global focus styles and reduced motion.
- [x] Build shared UI primitives for buttons, fields, dialogs, states, headers, and
  bottom action bars before redesigning individual pages.
- [x] Redesign every implemented, functional frontend page against the shared design
  system: authentication, games, friends, profile, Spy setup/reveal/timer/voting/
  result, history, and history detail.
- [x] Require an exact set of accused players equal to the configured Spy count in
  both the frontend and backend voting flow.
- [x] Preserve the last successful Spy setup for the same signed-in user in the
  current browser session, with an eight-hour expiry.

- [ ] Validate submitted friend IDs belong to the host and are not soft-deleted.
- [ ] Add state guards for reveal and timer pause/resume/stop, with stable API errors.
- [ ] Fix `GameSession.__str__` referencing nonexistent `self.status`.
- [ ] Collapse the duplicate `SpyTimerService` into one tested implementation.
- [ ] Reconcile generated schema, `Documents/api-doc.yaml`, serializers, and frontend
  types.
- [ ] Decide and align the minimum player count across backend, frontend, tests, and
  docs.

## Medium priority

- [ ] Decide whether the setup timer maximum is 15 or 60 minutes and align it.
- [ ] Update root `README.md` for Django 6 and the implemented project state.
- [ ] Replace mojibake in source comments and user-visible Persian literals.
- [ ] Remove the stray unary `+` before the voting route and normalize formatting.
- [ ] Add tests for foreign/deleted friends, role privacy, and invalid transitions.
- [ ] Replace development-only security settings before production.
- [ ] Complete the final cross-page responsive pass at 375, 768, 1024, and 1440
  pixel reference widths.
- [ ] Verify mobile and tablet landscape layouts, including fixed headers, action
  bars, scrolling, and safe-area spacing.
- [ ] Complete keyboard and screen-reader QA: focus order, dialog focus containment,
  accessible names, selected states, and route-change focus.
- [ ] Verify reduced-motion, text zoom, contrast, and touch targets across all
  implemented routes.
- [ ] Verify offline UI integrity and failure recovery for fonts, icons, API errors,
  and retry states.
- [ ] Perform a final visual-consistency pass so spacing, borders, shadows, headings,
  and primary actions match the shared tokens on every page.
- [ ] Decide the product and design for non-Spy game detail placeholders before
  treating them as completed pages.

## Low priority

- [ ] Add more games with the generic session/player abstraction.
- [ ] Add deployment and production database guidance.
- [ ] Improve shared-device accessibility and responsive QA.
