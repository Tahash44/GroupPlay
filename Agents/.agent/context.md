# Current Context

## Product state

GroupPlay is an active Django/React implementation, not a planning-only project.
The implemented game is Spy. Authentication, profiles, friends, session creation,
role reveal, timer controls, voting, results, and Spy history are present.

The game catalogue is static frontend data. Only Spy has a working backend. The
end-to-end Spy screens exist, all implemented functional pages have completed their
current design pass, and the frontend has a green focused test/build baseline.

## Current focus

Validate the new internal administration panel in production-like deployment
settings, align remaining product/API contracts, then complete cross-page
responsive, accessibility, and offline quality assurance for the Spy flow.

## Important constraints

- A host account is required; friends and ad-hoc names are host-local data.
- The host is an optional player and is sent as a name-only participant after
  explicit selection.
- The UI is Persian-first; Spy roles and locations have Persian and English fields.
- JWT access tokens last one hour and refresh tokens last seven days.
- Both frontend and backend require at least four selected players.
- Spy count is capped at the floor of one third of the player count.
- Both frontend and backend enforce a timer range of 1–15 minutes.
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

## Verified security baseline on 2026-08-02

- Backend: all 117 Django tests pass.
- Frontend: all 120 Vitest tests pass.
- Frontend: the TypeScript/Vite production build passes after the final result-page
  alignment.
- Administration: active-superuser-only access, audited account suspension,
  read-only session diagnostics, soft content lifecycle, preview-first imports,
  and ten focused tests are implemented.
- Authentication: the public form is the only login entry; successful superuser
  authentication also establishes the admin session and redirects to `/admin/`.
- Player-visible Spy locations are returned in Persian during reveal, history, and
  result flows.
- Content selection: inactive and archived Spy locations are excluded; the host's
  five latest completed locations are avoided when alternatives exist.
- Docker: administration migrations apply successfully and custom static styling is
  discoverable inside the running backend container.

## Confirmed defects

- Root `README.md` still describes a planning-stage Django 5 project.
- Source files contain widespread mojibake in comments and some Persian literals.
