# Current Context

## Product state

GroupPlay is an active Django/React implementation, not merely a planning project. The current implemented game is Spy. Authentication, profile management, friend management, Spy-session creation, role reveal, timer controls, voting, and spy location guessing are present on the backend.

The frontend currently includes authentication, profile, friends, game list/detail views, Spy game setup, and Spy role reveal. It has a service for creating Spy sessions; later gameplay controls may still require frontend wiring or verification.

## Current focus

Finish and harden the end-to-end Spy game flow while maintaining the existing host-on-one-device experience. Keep API/client contracts aligned and covered by tests.

## Important constraints

- A host account is required; friends and ad-hoc player names are host-local data.
- The signed-in host is shown as an optional player choice in Spy setup and is only added after explicit selection.
- The default UI language is Persian; backend has both Persian and English role/location fields.
- JWT access tokens last one hour and refresh tokens last seven days in current settings.

## Known follow-ups

- Validate resource ownership consistently: several Spy detail/control views currently filter by session ID and game type but not host.
- Reconcile `Documents/api-doc.yaml` with the actual `/api/v1/...` routes and current serializer field names.
- Verify/fix the `GameSession.__str__` reference to `self.status`, because `GameSession` has no `status` field; status belongs to `SpyGameState`.
- Remove duplicated `SpyTimerService` definition in `games/spy/services.py` if behaviour is being changed there.
- Update the root README: it still claims planning status and Django 5 although code is implemented with Django 6.
