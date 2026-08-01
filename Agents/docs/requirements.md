# Product Requirements

## Product

GroupPlay facilitates in-person party games on one shared device. The authenticated
host manages the game; participants are saved friends or ad-hoc names.

## Implemented capabilities

- Host registration, login, refresh, logout, profile update, and password change.
- Host-scoped friend listing, creation, editing, and soft deletion.
- Static game catalogue and detail placeholders for games other than Spy.
- Spy creation with timer, spy count, and explicitly selected participants.
- Sequential private role reveal and automatic timer start after the last reveal.
- Timer inspection, pause, resume, stop, voting, Spy guess, and result handling.
- Exact multi-Spy accusation when a session contains more than one Spy.
- Paginated finished-Spy history and session detail screens.
- Same-session restoration of the last successfully created Spy setup for the
  current user, expiring after eight hours.

## Product rules

- Only the host requires an account.
- The host is never added implicitly. When selected, the host is submitted as a
  normal name-only participant.
- A participant supplies either a friend ID or a non-empty name.
- Duplicate friend IDs and duplicate entered names are rejected.
- Spy count must be lower than submitted player count.
- Voting must submit exactly as many unique accused players as the configured Spy
  count. The Spy-guess phase opens only when that set equals all actual Spies.
- The frontend currently requires four players; the backend accepts three. The
  intended minimum is unresolved and must be aligned.
- Backend timer duration is 60–3600 seconds. The setup UI offers 1–15 minutes.
- A role remains private until its participant reveals it.
- Host-owned sessions, friends, and controls must be inaccessible to another host.
- Setup restoration is a short-lived convenience only. It must be scoped to the
  signed-in user, saved only after successful creation, and must not survive as a
  days-later remembered game.

## Non-functional expectations

- Persian-first, responsive shared-device UI.
- Secure authenticated API access and host data isolation.
- Expired credentials handled through a coordinated frontend refresh flow.
- Tests for game rules, authentication, ownership, privacy, and API error handling.
- A releasable frontend passes both Vitest and the TypeScript/Vite production build.

## Out of current scope

- Participant accounts.
- Online multiplayer or real-time remote synchronization.
- Payment and notifications.
- A backend-managed game catalogue.
- A confirmed production deployment/database design.
