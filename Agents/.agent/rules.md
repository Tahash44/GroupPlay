# Engineering Rules

## Backend

- Keep endpoint paths under `/api/v1/` and protect host-owned resources with authentication and ownership checks.
- Place reusable game/domain logic in `services.py`; keep `APIView` classes focused on request/response orchestration.
- Validate incoming payloads with DRF serializers and return stable, documented response fields.
- Use `transaction.atomic` when a game session creation or state transition writes several related records.
- Never return unrevealed roles in general session/history responses.
- Resolve Spy sessions through a host-scoped queryset before calling any reveal,
  timer, vote, guess, or detail service.
- Validate that a submitted `friend_id` belongs to the authenticated host and is not
  soft-deleted.
- Guard every state-changing service against invalid current states; return a stable
  DRF error rather than leaking Django `DoesNotExist` or plain `ValueError`.
- Use Django migrations for schema changes and tests in the relevant app's `tests/` package.

## Frontend

- Follow the existing `features/<feature>/{pages,components,services,types}` layout.
- Reuse `shared/api/api.ts` for authenticated API requests; it owns token attachment and single-flight refresh handling.
- Keep route access behind `PrivateRoute` when a screen requires a signed-in host.
- Keep feature API types synchronized with backend serializers.
- Test services with Axios mocking and pages/components with Testing Library when behaviour changes.
- Keep `npm.cmd run build` green. TypeScript checks test files as well as application
  files in the current configuration.
- Do not use private role fields from the generic session-detail response to drive
  voting/result UI. Introduce a state-appropriate public result contract.

## Documentation

- Mark known inconsistencies explicitly instead of guessing.
- Keep status documents factual: implemented, partially implemented, planned, or unknown.
- Add an ADR-style entry to `decisions.md` for durable architectural choices.
- Record commands and exact pass/fail counts in `context.md` only when freshly
  verified; keep transient failures out of durable architecture decisions.
