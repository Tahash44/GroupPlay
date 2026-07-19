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

These documents describe the checked-in code as of 2026-07-19. Update the appropriate document in the same change whenever code changes its stated contract or architecture.
