# GroupPlay Agent Workspace

This directory is the persistent working context for AI coding agents in GroupPlay.

## Read order

Before analysing or changing code, read:

1. `.agent/agent.md`
2. `.agent/rules.md`
3. `.agent/context.md`
4. `.agent/architecture.md`
5. the relevant files in `docs/` and `planning/`

## Directory map

- `.agent/` — operating rules, current context, architecture, and recorded decisions.
- `docs/` — product requirements, API reference, and database model reference.
- `planning/` — current phase, backlog, and change history.
- `.ai/prompts/` — repeatable prompts for feature work.
- `.ai/context/` — small, task-specific context notes when a future task needs them.

These documents describe the checked-in code as audited through 2026-08-02. Update the
appropriate document in the same change whenever code changes its stated contract,
architecture, delivery status, or verified quality baseline.

## Authority

The implementation is authoritative for current behaviour:

1. Django routes, serializers, services, models, migrations, and tests.
2. Frontend routes, feature services, types, pages, and tests.
3. `Agents/` as the maintained explanation and backlog.
4. `Documents/` as supporting product/design material that may be stale.

Do not infer completion from the presence of a screen or endpoint alone. Check that
the relevant test suite and production build pass.
