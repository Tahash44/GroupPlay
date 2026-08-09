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

## ADR-005 — Spy setup limits

**Status:** Accepted
**Date:** 2026-08-02

Spy sessions require at least four players. The maximum Spy count is the floor of
one third of the submitted player count. Timer duration is limited to 60–900 seconds.

Rationale: these limits match the version-one product document and the implemented
setup experience, remove frontend/backend disagreement, and preserve a viable
civilian majority.

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

## ADR-009 — Hybrid internal administration

**Status:** Accepted
**Date:** 2026-08-02

Version one uses a branded, RTL Django administration site restricted to active
superusers. User and game data are read-only except for explicit account
suspension/reactivation. Spy locations support managed metadata, activation, soft
archive/restore, preview-first bulk import, and audited changes. Domain services own
the mutations so a future dedicated management frontend can reuse the same rules.

Rationale: this delivers a secure operational panel without prematurely building a
second SPA/API surface, while keeping management behavior separate from presentation.
Permanent deletion is intentionally absent so historical sessions remain valid.

## ADR-010 — Host-local recent location avoidance

**Status:** Accepted
**Date:** 2026-08-02

New Spy sessions select only active, non-archived locations. The five most recent
locations from that host's finished games are excluded when alternatives exist. The
oldest exclusions are relaxed one at a time when the pool is too small.

Rationale: repeated rounds should feel varied without making a small location pool
unable to start a game or changing the random nature of selection.

## ADR-011 — Unified public and administration login

**Status:** Accepted
**Date:** 2026-08-02

The React public login form is the only credential-entry surface. Regular users
receive JWT credentials and continue to the application. Active superusers also
receive a Django admin session and an `admin_url`, which the frontend follows without
persisting admin JWT credentials. Direct unauthenticated admin-login requests return
to the shared frontend form.

Rationale: users should not need to know which login page matches their role. Django
session authentication and CSRF protection remain in force for the admin panel,
while the application keeps its existing JWT flow.
