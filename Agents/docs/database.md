# Database Reference

SQLite at `GroupPlay/db.sqlite3` is the development database. Django models and
migrations are authoritative.

| Model | Purpose | Key relationships |
| --- | --- | --- |
| `accounts.User` | Custom host user with optional `name`. | Owns friends and sessions. |
| `accounts.Friend` | Reusable host participant with soft deletion. | Belongs to one user. |
| `games.GameSession` | Generic hosted game and winner record. | Belongs to a host and has players. |
| `games.Player` | Session participant. | Belongs to a session and may reference a friend. |
| `games.spy.Location` | Bilingual Spy location. | Selected by Spy state. |
| `games.spy.SpyGameState` | Spy lifecycle and timer state. | One-to-one with a session. |
| `games.spy.SpyPlayerState` | Private role and reveal flag. | One-to-one with a player. |

## Spy lifecycle

`CREATED → ROLE_REVEAL → IN_PROGRESS → VOTING → SPY_GUESS or FINISHED`

Creation currently persists sessions directly in `ROLE_REVEAL`. The last reveal
starts the timer. Stopping the timer moves to voting. A correct accusation moves to
Spy guess; a wrong accusation finishes with Spy winners. The guess result finishes
the session.

For multi-Spy sessions, a correct accusation is the exact set of all Spy player IDs.
Submitting fewer, more, duplicate, or different players does not satisfy the vote.

## Data invariants

- `GameSession.host` is the authoritative owner.
- A friend-linked player copies the current friend name on save.
- Soft-deleted friends are excluded from normal friend queries.
- `GameSession.winner` is a JSON list of player IDs.
- Winning side is derived by intersecting winner IDs with Spy player IDs.
- History is computed from sessions and Spy state; there is no history table.
- Last-setup restoration is frontend session storage, not persisted game truth and
  not part of the database model.

## Integrity gaps

- The database does not enforce that a player's friend belongs to the session host.
- `SpyPlayerState.session` duplicates the session reachable through its player and
  has no database constraint requiring them to match.
- Spy count and timer bounds are serializer rules, not model constraints.
- Existing initial migrations reflect the current schema; future model changes need
  new migrations rather than edits to applied files.
