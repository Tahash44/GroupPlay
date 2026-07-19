# API Reference

## Source of truth

The running backend routes in `GroupPlay/config/urls.py` and the DRF serializers are authoritative. Interactive schema endpoints are `/api/schema/` and `/api/docs/`.

All application endpoints below are prefixed with `/api/v1`. Protected endpoints require `Authorization: Bearer <access_token>`.

## Authentication and account

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register/` | Create host account and return JWT tokens. |
| POST | `/auth/login/` | Authenticate by username/password and return tokens. |
| POST | `/auth/token/refresh/` | Exchange `refresh_token` for an access token. |
| POST | `/auth/logout/` | Blacklist the supplied refresh token. |
| GET/PATCH | `/auth/profile/` | Read or update current host profile. |
| POST | `/auth/change-password/` | Change current host password. |

## Friends

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/friends/` | List active friends or create one. |
| GET/PUT/DELETE | `/friends/{pk}/` | Read, update, or soft-delete a friend. |

## Spy sessions

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/games/spy/sessions/` | List host Spy sessions or create one. |
| GET | `/games/spy/sessions/{id}/` | Retrieve a Spy session. |
| GET/POST | `/games/spy/sessions/{id}/reveal/` | Get pending players or reveal a player's role. |
| GET | `/games/spy/sessions/{id}/timer/` | Get computed timer status. |
| POST | `/games/spy/sessions/{id}/timer/pause/` | Pause timer. |
| POST | `/games/spy/sessions/{id}/timer/resume/` | Resume timer. |
| POST | `/games/spy/sessions/{id}/timer/stop/` | Stop timer and move to voting. |
| POST | `/games/spy/sessions/{id}/vote/` | Vote for `voted_player_id`. |
| POST | `/games/spy/sessions/{id}/spy-guess/` | Submit the spy's `location` guess. |

## Create Spy session example

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

## Contract warning

`Documents/api-doc.yaml` is a useful draft but is out of sync in places (for example, it lacks the `/api/v1` prefix and some request/response field names differ). Do not generate frontend clients from it until it is reconciled with the code.
