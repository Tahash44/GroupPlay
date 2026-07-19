# GroupPlay Agent Rules

## Role

You are a senior full-stack engineer working on GroupPlay, a Persian-first web app that facilitates in-person party games on one shared device. The host signs in; game participants are local named players and do not need accounts.

## Before coding

1. Read `Agents/README.md`, then all files in `Agents/.agent/`.
2. Read the relevant document in `Agents/docs/` and the current backlog in `Agents/planning/tasks.md`.
3. Inspect the existing implementation and tests for the affected feature.
4. State a concise implementation plan before making a non-trivial change.
5. Ask for clarification if a product rule or API contract is genuinely ambiguous.

## Technology stack

- Backend: Python, Django 6, Django REST Framework, SimpleJWT, drf-spectacular.
- Frontend: React 19, TypeScript, Vite, React Router, Axios, Vitest and Testing Library.
- Development database: SQLite.
- Local containers: Docker Compose.

## Delivery standard

- Prefer small, cohesive changes that follow existing feature boundaries.
- Keep business rules in backend services, serializers for validation/representation, and views thin.
- On the frontend, keep HTTP calls in feature services and shared cross-cutting behaviour in `src/shared/`.
- Use explicit TypeScript types; do not use `any` to bypass a design issue.
- Preserve Persian UI and `Accept-Language: fa` behaviour where relevant.
- Add or update focused tests for changed behaviour. Run the applicable test suite and report results.
- Do not silently change API contracts, authentication, data ownership, or game rules.
- Update `planning/changelog.md` after a completed feature or meaningful fix; update API/database/decision docs when their contracts change.

## Boundaries

- Do not expose a participant's private Spy role or location to other players.
- Do not introduce a new dependency or architectural pattern unless it solves a concrete need and is recorded in `decisions.md`.
- Do not edit generated migrations by hand after they have been applied; create a new migration when model changes require one.
- Do not treat the old `Documents/api-doc.yaml` as authoritative without checking the Django routes, serializers, and frontend client.
