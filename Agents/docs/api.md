# API Reference

## Authority and conventions

`GroupPlay/config/urls.py`, mounted URL modules, serializers, views, and services are
authoritative. Schema endpoints are `/api/schema/` and `/api/docs/`.

Application endpoints use `/api/v1`. Protected endpoints require a bearer access
token.

## Authentication and account

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register/` | Create a host and return access/refresh tokens. |
| POST | `/auth/login/` | Authenticate and return tokens. |
| POST | `/auth/token/refresh/` | Exchange `refresh_token` for access. |
| POST | `/auth/logout/` | Blacklist `refresh_token`. |
| GET/PATCH | `/auth/profile/` | Read or update the current profile. |
| POST | `/auth/change-password/` | Change password. |

## Friends

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/friends/` | List active friends or create one. |
| GET/PUT/DELETE | `/friends/{pk}/` | Read, partially update, or soft-delete. |

## Spy

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/games/spy/sessions/` | Paginated host sessions or create. |
| GET | `/games/spy/sessions/{id}/` | Session/history detail. |
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

## Known contract and security gaps

- Only the sessions collection is host-scoped. Detail and all control endpoints
  authenticate but do not verify ownership.
- Detail currently exposes every role and the location regardless of state. This is
  a defect, not an intended public contract.
- `Documents/api-doc.yaml` lacks or misstates current prefixes and fields. Do not
  generate clients from it until reconciled with code and generated schema.
