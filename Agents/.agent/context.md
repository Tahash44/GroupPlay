# Current Context

## Product state

GroupPlay is an active Django/React implementation, not a planning-only project.
The implemented game is Spy. Authentication, profiles, friends, session creation,
role reveal, timer controls, voting, results, and Spy history are present.

The game catalogue is static frontend data. Only Spy has a working backend. The
end-to-end Spy screens exist, all implemented functional pages have completed their
current design pass, and the frontend has a green focused test/build baseline.

## Current focus

Complete cross-page responsive/accessibility/offline quality assurance, then harden
ownership, role privacy, state transitions, and request validation for the
end-to-end Spy flow.

## Important constraints

- A host account is required; friends and ad-hoc names are host-local data.
- The host is an optional player and is sent as a name-only participant after
  explicit selection.
- The UI is Persian-first; Spy roles and locations have Persian and English fields.
- JWT access tokens last one hour and refresh tokens last seven days.
- The frontend enforces four selected players, while the backend accepts three.
  This is an unresolved contract mismatch.
- The frontend timer selector offers 1–15 minutes, while the backend accepts
  60–3600 seconds.
- Multi-Spy voting requires exactly `spy_count` unique selections and succeeds only
  when the selected set is the complete actual Spy set.
- The last successful setup is cached per user in browser session storage for up to
  eight hours. It is convenience state, not game truth.

## Design completion on 2026-08-02

- Current functional pages redesigned: auth, games, friends, profile, Spy setup,
  reveal, timer, voting, result, history, and history detail.
- Non-Spy game details remain placeholders and are not considered designed product
  flows.
- Remaining design work is a final reference-width, landscape, keyboard,
  screen-reader, reduced-motion, text-zoom, contrast, touch-target, offline, and
  token-consistency QA pass.

## Verified baseline on 2026-07-27

- Backend: 101 Django tests pass.
- Frontend: all 118 Vitest tests pass.
- Frontend: the TypeScript/Vite production build passes.
- Docker Compose: backend and frontend images build, both containers run, and the
  schema and frontend root endpoints return HTTP 200.

## Verified redesign baseline on 2026-08-02

- Backend: all 104 Django tests pass.
- Frontend: all 119 Vitest tests pass.
- Frontend: the TypeScript/Vite production build passes after the final result-page
  alignment.

## Confirmed defects

- All Spy detail/control endpoints except the sessions collection omit host ownership.
- Session detail returns every player's private role and the location regardless of
  game state.
- `GameSession.__str__` references a missing `status` attribute.
- `SpyTimerService` is defined twice.
- Session creation accepts arbitrary or foreign `friend_id` values.
- Timer/reveal operations lack consistent state-transition guards.
- Root `README.md` still describes a planning-stage Django 5 project.
- Source files contain widespread mojibake in comments and some Persian literals.
