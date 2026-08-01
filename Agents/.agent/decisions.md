# Architecture Decisions

## ADR-001 — JWT authentication for hosts

**Status:** Accepted
**Date:** 2026-07-19 (documented from existing code)

The app authenticates hosts with Django REST Framework SimpleJWT. The React client stores access and refresh tokens in local storage, attaches a bearer token through the shared Axios client, and refreshes access tokens after a 401 response.

Rationale: the frontend is a separate SPA and hosts may use the app from a shared device. The current lifetimes are one hour for access and seven days for refresh.

## ADR-002 — Generic sessions plus Spy-specific state

**Status:** Accepted  
**Date:** 2026-07-19 (documented from existing code)

`games.GameSession` and `games.Player` model generic game ownership and participants. `games.spy` provides a one-to-one `SpyGameState` and one-to-one `SpyPlayerState` for Spy rules and private roles.

Rationale: future games can reuse host/player/session concepts without inheriting Spy-only fields.

## ADR-003 — Backend-owned game logic

**Status:** Accepted  
**Date:** 2026-07-19 (documented from existing code)

Spy role selection, role reveal state, timer state, voting, and location guessing live in `games/spy/services.py`, not in the browser.

Rationale: prevents client-side manipulation and keeps the shared-device game state recoverable.

## ADR-004 — History derived from persisted sessions

**Status:** Accepted
**Date:** 2026-07-27 (documented from existing code)

Spy history is derived from host-owned `GameSession` records. The sessions collection
supports status filtering and page-number pagination; the detail serializer adds
played time, elapsed duration, player count, and winning side.

Rationale: current history requirements do not justify a second persistence model.
Future cross-game history should aggregate generic sessions without duplicating
session truth.

## ADR-005 — Four-player frontend minimum is provisional

**Status:** Proposed
**Date:** 2026-07-27

The frontend requires four selected players, but the backend accepts three. Until a
product decision is made and both layers are aligned, agents must not describe
either number as the settled product rule.

## ADR-006 — Local UI font and icon assets

**Status:** Accepted
**Date:** 2026-08-01

The frontend packages Vazirmatn through `@fontsource/vazirmatn` and renders interface
icons through `@phosphor-icons/react`. Runtime Google Fonts and Material Symbols
requests are no longer part of the UI.

Rationale: the Persian interface must remain readable and visually complete on slow,
restricted, or offline networks. React icon components also provide predictable SVG
rendering and make accessible controls easier to implement than icon-font text.

## ADR-007 — Short-lived restoration of the last Spy setup

**Status:** Accepted
**Date:** 2026-08-02

After a Spy session is created successfully, the frontend stores the selected
players, Spy count, and timer duration in browser session storage. The entry is
scoped to the signed-in user and expires after eight hours.

Rationale: repeated rounds on one shared device should not require rebuilding the
same participant list, but a setup from a previous day or browser session should not
unexpectedly reappear. This cache is form convenience only and never replaces
backend-owned session or game state.

## ADR-008 — Exact-set voting for multiple Spies

**Status:** Accepted
**Date:** 2026-08-02

The voting API accepts a list of accused player IDs. The list must contain exactly
the configured number of unique Spies, and the game advances to the location guess
only when the submitted set equals the complete actual Spy set.

Rationale: selecting a single known Spy in a multi-Spy game must not count as a full
civilian victory or incorrectly advance the game.
