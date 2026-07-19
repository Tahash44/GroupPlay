# Product Requirements

## Product

GroupPlay is a web application for facilitating in-person group/party games on a single shared device. The host manages the game; players can be saved friends or entered by name.

## Implemented or evidenced capabilities

- Host registration, login, token refresh, logout, profile update, and password change.
- Host-scoped friend list with create, edit, and soft delete.
- Browse game cards and open game details in the frontend.
- Create a Spy session with a timer, spy count, and selected/named players.
- Reveal one role at a time; the game starts after all roles are revealed.
- Inspect, pause, resume, or stop the game timer.
- Vote for a player, then allow the spy to guess the location when applicable.

## Product rules

- Only the host requires an account.
- The host can be selected as a player but is not automatically included in a Spy session.
- A Spy session has at least three submitted players plus the host; spy count must be lower than the player count after the host is included.
- A submitted player needs either a friend ID or a non-empty name; duplicate friend IDs and duplicate entered names are rejected.
- Timer duration is 60–3600 seconds.
- Roles must remain private until the relevant player reveals theirs.

## Non-functional expectations

- Persian-first UI, responsive enough for a shared mobile/tablet device.
- Secure authenticated API access and host data isolation.
- Clear handling of expired credentials through the frontend refresh flow.
- Test important game rules, authentication paths, and API client error handling.

## Out of current scope

- A player account for every participant.
- Online multiplayer or real-time remote synchronization.
- Payment, notifications, and a confirmed production deployment design.
