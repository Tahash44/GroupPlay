```markdown
# GroupPlay

A platform for managing in-person group games on a single shared device.

## What it does
- Automates game facilitation: role assignment, timers, and phase announcements
- No internet required for players — runs on one shared device
- Only the host needs an account; players are simple named participants

## Current implementation

The current playable vertical slice is the Spy game. It includes host
authentication, profile and friend management, session history, sequential role
reveal, server-calculated timer controls, multi-Spy voting, location guessing, and
an RTL superuser administration panel for operational content and diagnostics.

Other games are currently catalogue placeholders and are not implemented game
flows.

## Tech stack

- **Backend:** Django 6.0.6 + Django REST Framework 3.17.1
- **Frontend:** React 19 + TypeScript 6 + Vite 8
- **API docs:** drf-spectacular, exposed at `/api/schema/` and `/api/docs/`
- **Database:** SQLite for the current development setup
- **Tests:** Django test suite and Vitest frontend tests

## Status

The foundation and host-management phases are complete. The Spy vertical slice is
implemented, tested, and usable in development, while deployment hardening,
cross-device quality assurance, API-document reconciliation, and additional games
remain open.

## Documentation authority

For current behaviour, use `Agents/docs/api.md`, `Agents/docs/database.md`, and the
implementation itself. `Documents/BaziGardan_doc.md` is the original product
specification and `Documents/api-doc.yaml` is a legacy manual schema that still
needs reconciliation with the generated schema.
```
