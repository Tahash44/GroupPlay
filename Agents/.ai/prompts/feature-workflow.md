# Feature Workflow Prompt

Use this prompt before implementing a feature:

```text
Read Agents/README.md, all files in Agents/.agent/, the relevant files in
Agents/docs/, and Agents/planning/tasks.md. Inspect the code and tests related
to [TASK]. Do not code yet. Summarize the current behaviour, identify API/data
contracts affected, list risks, check the current git status, and give a minimal
implementation and test plan.
```

After the plan is approved:

```text
Implement [TASK] following the GroupPlay agent rules. Keep backend business
logic in services and frontend HTTP calls in feature services. Add or update
focused tests, run the relevant checks, and update Agents/planning/changelog.md
plus any affected Agents docs. For frontend changes, run both the test suite and
production build. Report changed files, exact commands, and test/build results.
```
