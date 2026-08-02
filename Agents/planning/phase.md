# Project Phases

## Phase 1 — Foundation

**Status:** Done

- [x] Django project, custom user, React/Vite frontend, and Docker Compose.
- [x] JWT authentication and generated API schema tooling.

## Phase 2 — Host management

**Status:** Done

- [x] Profile and password management.
- [x] Host-scoped friend management.
- [x] Auth context and coordinated token refresh.

## Phase 3 — Spy vertical slice

**Status:** Implemented but not hardened

- [x] Generic session/player persistence and Spy-specific state.
- [x] Session setup, role assignment, and sequential reveal.
- [x] Timer, voting, guess, result, and history backend endpoints.
- [x] Setup, reveal, timer, voting, result, and history frontend pages.
- [x] Redesign the complete Spy journey with shared tokens, local icons, responsive
  layouts, accessible interaction states, and consistent result/history styling.
- [x] Support exact multi-Spy accusation and same-session restoration of the last
  successful setup.
- [x] Restore a passing frontend test and production build.
- [x] Enforce ownership on every read/control endpoint.
- [x] Prevent premature role/location disclosure.
- [x] Validate friend ownership.
- [x] Harden state transitions.
- [ ] Align generated/manual API documentation and frontend types.

## Phase 4 — Quality and expansion

**Status:** In progress

- [x] Resolve player-count, Spy-count, and timer-range product mismatches.
- [ ] Harden deployment security and secret management.
- [x] Redesign all currently implemented functional pages against the maintained
  design system.
- [ ] Complete reference-width, landscape, keyboard, screen-reader, reduced-motion,
  contrast, text-zoom, touch-target, and offline QA.
- [ ] Complete encoding and Persian-language QA.
- [ ] Add games through the generic session abstraction.
- [ ] Define production database and deployment architecture.
- [x] Add the version-one superuser administration panel for users, Spy sessions,
  Spy locations, bulk content import, auditing, and operational dashboard metrics.
- [x] Prevent inactive/archived locations from entering new games and reduce
  host-local location repetition across recent finished sessions.
