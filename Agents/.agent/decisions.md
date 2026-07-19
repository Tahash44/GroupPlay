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
