# API Reference

## Authority and conventions

`GroupPlay/config/urls.py`, mounted URL modules, serializers, views, and services are
authoritative. Schema endpoints are `/api/schema/` and `/api/docs/`.

Application endpoints use `/api/v1`. Protected endpoints require a bearer access
token.

Guest Spy requests use the `X-Guest-Token` header returned by
`POST /api/v1/games/guest/`. Guest tokens expire after eight hours and are limited
to one active Spy session. Guest-owned sessions are accessible only with the same
guest token and are not included in account history.

The administration site is mounted at `/admin/`. It is a server-rendered,
session-authenticated, CSRF-protected internal interface restricted to active
superusers; it does not add a public administration API.
Its standalone login form is disabled: unauthenticated admin requests return to the
shared frontend login page. Player-visible Spy reveal, detail, and result payloads
use `Location.name_fa` rather than the English content-management name.

## Authentication and account

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register/` | Create a host and return access/refresh tokens. |
| POST | `/auth/login/` | Authenticate and return tokens; superusers also receive `admin_url` and an admin session. |
| POST | `/auth/token/refresh/` | Exchange `refresh_token` for access. |
| POST | `/auth/logout/` | Blacklist `refresh_token`. |
| GET/PATCH | `/auth/profile/` | Read or update the current profile. |
| POST | `/auth/change-password/` | Change password. |

## Guest identity

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/games/guest/` | Issue an anonymous, expiring guest token for temporary Spy play. |

## Friends

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/friends/` | List active friends or create one. |
| GET/PUT/DELETE | `/friends/{pk}/` | Read, partially update, or soft-delete. |

## Spy

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/games/spy/sessions/` | Paginated host sessions or create. |
| GET | `/games/spy/sessions/{id}/` | Host-owned, state-safe session/history detail. |
| GET/POST | `/games/spy/sessions/{id}/reveal/` | Pending players or reveal one role. |
| GET | `/games/spy/sessions/{id}/timer/` | Computed timer status. |
| POST | `/games/spy/sessions/{id}/timer/pause/` | Pause timer. |
| POST | `/games/spy/sessions/{id}/timer/resume/` | Resume timer. |
| POST | `/games/spy/sessions/{id}/timer/stop/` | Stop and enter voting. |
| POST | `/games/spy/sessions/{id}/vote/` | Submit one or more accused player IDs. |
| POST | `/games/spy/sessions/{id}/spy-guess/` | Submit boolean `is_correct`. |

The sessions collection accepts `status`, such as `status=FINISHED`, plus page
parameters. Page size defaults to 10 and is capped at 50.

## Core payloads

```json
{
  "timer_duration": 300,
  "spy_count": 1,
  "players": [
    { "friend_id": 12 },
    { "name": "Sara" },
    { "name": "Ali" }
  ]
}
```

Creation returns `id`, `status`, and `created_at`, with status currently
`ROLE_REVEAL`.

Spy session creation is available to an authenticated host or a valid guest
token. Authenticated sessions are owned by the user; guest sessions are owned by
the guest token and are not added to account history.

Creation requires at least four players. `spy_count` must be no greater than the
floor of one third of the player count, and `timer_duration` must be between 60 and
900 seconds.

```json
{ "player_id": 12 }
```

The current voting payload uses a list and must contain exactly `spy_count` unique
session player IDs:

```json
{ "voted_player_ids": [12, 18] }
```

The legacy single-player field `voted_player_id` remains accepted for one-Spy
clients, but new clients should use `voted_player_ids`.

```json
{ "is_correct": true }
```

Pause/resume responses include timer status and `message`. Stop omits
`remaining_time` and `timer_started_at`. Detail/history adds `played_at`,
`duration_seconds`, `player_count`, `spy_count`, and `winner_side`.

Before a session is finished, detail returns player names and IDs but keeps every
player `role`, `location`, `winner`, and `winner_side` null. Finished sessions expose
those result fields for result and history screens. Every detail/control endpoint is
host-scoped and returns not-found for a foreign session.

State-changing operations are guarded by the Spy lifecycle. Requests made in the
wrong state return HTTP 409 with the stable `invalid_game_state` error code. Invalid
player input remains a validation error with HTTP 400.

## Documentation and security gaps

- `Documents/api-doc.yaml` is a legacy manually maintained document and lacks or
  misstates current prefixes and fields. Do not generate clients from it until it
  is reconciled with code and the generated schema. This file remains the current
  human-readable API reference.
- Production deployment must supply HTTPS, secure-cookie, trusted-origin, secret,
  host, and proxy settings before exposing `/admin/` outside a trusted environment.
