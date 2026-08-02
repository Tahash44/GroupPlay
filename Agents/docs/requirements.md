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
- Superuser-only RTL administration dashboard for user inspection, account
  suspension/reactivation, Spy session diagnostics, and audit history.
- Spy location content management with category, difficulty, age suitability,
  activation, soft archive/restore, usage metrics, and preview-first bulk import.
- Host-local recent-location avoidance across the five latest completed games,
  with graceful fallback when the active content pool is small.

## Product rules

- Only the host requires an account.
- The host is never added implicitly. When selected, the host is submitted as a
  normal name-only participant.
- A participant supplies either a friend ID or a non-empty name.
- Duplicate friend IDs and duplicate entered names are rejected.
- A session requires at least four players.
- Spy count may not exceed the floor of one third of the submitted player count.
- Voting must submit exactly as many unique accused players as the configured Spy
  count. The Spy-guess phase opens only when that set equals all actual Spies.
- Timer duration is 60–900 seconds, matching the setup UI range of 1–15 minutes.
- A role remains private until its participant reveals it.
- Host-owned sessions, friends, and controls must be inaccessible to another host.
- Setup restoration is a short-lived convenience only. It must be scoped to the
  signed-in user, saved only after successful creation, and must not survive as a
  days-later remembered game.
- Only active, non-archived locations may be selected for a new game.
- User suspension and location archival preserve existing friends, sessions, game
  results, and audit history; the version-one panel has no permanent-delete flow.
- Administration access is restricted to an active superuser. User records and game
  sessions are observational except for explicit, audited account status changes.
- The public login form is the single authentication entry point. A successful
  superuser login establishes the admin session and redirects to the internal panel;
  regular users continue to the application dashboard.
- Every player-visible Spy location value uses the Persian location name. English
  names remain available only for content management and internal metadata.

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
- A backend-managed multi-game catalogue beyond Spy location content.
- A confirmed production deployment/database design.
