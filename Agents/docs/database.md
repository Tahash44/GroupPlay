# Database Reference

Current development database is SQLite (`GroupPlay/db.sqlite3`). Django models are the source of truth; migrations reside beside each app.

| Model | Purpose | Key relationships |
| --- | --- | --- |
| `accounts.User` | Custom Django user with optional `name`. | Owns friends and hosted sessions. |
| `accounts.Friend` | Host-managed reusable participant. Soft-deleted via `is_deleted`. | Belongs to one user; optionally used by a player entry. |
| `games.GameSession` | Generic game session. | Belongs to host; has players; one Spy state for Spy games. |
| `games.Player` | A participant in a session. | Belongs to session; may point to a friend; name mirrors friend name on save. |
| `games.spy.Location` | Bilingual Spy location. | Used by Spy game states. |
| `games.spy.SpyGameState` | Spy status, selected location, spy count, and timer state. | One-to-one with `GameSession`. |
| `games.spy.SpyPlayerState` | A player's Spy role and reveal flag. | One-to-one with `Player`; belongs to session. |

## Spy state lifecycle

`CREATED → ROLE_REVEAL → IN_PROGRESS → VOTING → SPY_GUESS or FINISHED`

The implementation creates sessions directly in `ROLE_REVEAL`. Timer stop moves the game toward voting; vote and guess services determine later outcomes. Confirm transition guards whenever these rules change.

## Data invariants

- `GameSession.host` is the authoritative owner.
- `SpyGameState.session` and `SpyPlayerState.player` are unique one-to-one links.
- A `Player` linked to a `Friend` adopts that friend's name at save time.
- Soft-deleted friends should be excluded from normal lists and should not be treated as active selectable friends without an explicit product decision.
