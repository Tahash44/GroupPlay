# Engineering Rules

## Backend

- Keep endpoint paths under `/api/v1/` and protect host-owned resources with authentication and ownership checks.
- Place reusable game/domain logic in `services.py`; keep `APIView` classes focused on request/response orchestration.
- Validate incoming payloads with DRF serializers and return stable, documented response fields.
- Use `transaction.atomic` when a game session creation or state transition writes several related records.
- Never return unrevealed roles in general session/history responses.
- Use Django migrations for schema changes and tests in the relevant app's `tests/` package.

## Frontend

- Follow the existing `features/<feature>/{pages,components,services,types}` layout.
- Reuse `shared/api/api.ts` for authenticated API requests; it owns token attachment and single-flight refresh handling.
- Keep route access behind `PrivateRoute` when a screen requires a signed-in host.
- Keep feature API types synchronized with backend serializers.
- Test services with Axios mocking and pages/components with Testing Library when behaviour changes.

## Documentation

- Mark known inconsistencies explicitly instead of guessing.
- Keep status documents factual: implemented, partially implemented, planned, or unknown.
- Add an ADR-style entry to `decisions.md` for durable architectural choices.
