# Architecture

## Repository layout

```text
GroupPlay/                 Django backend root
  config/                  settings and top-level API routes
  accounts/                custom user, authentication, profile, friends
  games/                   shared game session and player models
    spy/                   Spy-specific state, services, API
frontend/                  React + TypeScript application
  src/features/            auth, profile, friends, games
  src/shared/              API client, auth context, layout, styles, shared types
Documents/                 ERD and draft OpenAPI documentation
Agents/                    persistent AI-agent context and planning
```

## Backend flow

```text
URL route → APIView / generic view → serializer validation → service → Django models → SQLite
                                      ↓
                                response serializer
```

- `accounts` owns `User`, `Friend`, JWT operations, profile, and friend APIs.
- `games` owns generic `GameSession` and `Player` records.
- `games.spy` owns Spy state, locations, roles, timer, vote, and guess rules.
- `config/urls.py` mounts versioned endpoints under `/api/v1/` and schema/docs under `/api/schema/` and `/api/docs/`.
- Spy session history is not a separate model or endpoint. It is a filtered,
  paginated view of `GameSession` records at the sessions collection endpoint.

## Frontend flow

```text
Route → feature page/component → feature service → shared Axios client → /api/v1 backend
```

`shared/api/api.ts` adds bearer tokens and coordinates a single refresh for concurrent
401 responses. `AuthContext` retrieves the current profile on app startup and
supplies authentication state. Routes are defined in
`frontend/src/router/index.tsx`. `PrivateRoute` optionally wraps authenticated pages
in `AppLayout`; the Spy setup, reveal, timer, and voting flow deliberately uses the
full-screen layout.

The game catalogue is currently frontend mock data. Only Spy has a working backend
game implementation. History currently queries the Spy sessions endpoint directly.

The Spy setup page may cache the last successfully submitted participant list and
settings in user-scoped browser session storage for up to eight hours. This cache is
only a short-lived form convenience; persisted session models and backend services
remain authoritative for active and completed games.

## Design rules

- A game-specific implementation extends the generic game models rather than duplicating host/player concepts.
- Domain state is persisted; do not rely on browser state for game truth.
- The backend is the authority for role assignment, timer calculations, votes, and winners.
- State transitions must be valid for the current `SpyGameState.status`.
- Generic session ownership must be enforced before any Spy-specific state is read
  or mutated.
