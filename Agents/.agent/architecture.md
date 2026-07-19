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

## Frontend flow

```text
Route → feature page/component → feature service → shared Axios client → /api/v1 backend
```

`shared/api/api.ts` adds bearer tokens and retries one failed authenticated request after a refresh. `AuthContext` retrieves the current profile on app startup and supplies authentication state. Routes are defined in `frontend/src/router/index.tsx`.

## Design rules

- A game-specific implementation extends the generic game models rather than duplicating host/player concepts.
- Domain state is persisted; do not rely on browser state for game truth.
- The backend is the authority for role assignment, timer calculations, votes, and winners.
- State transitions must be valid for the current `SpyGameState.status`.
