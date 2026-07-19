# Task Backlog

## High priority

- [ ] Enforce `GameSession.host == request.user` for every Spy session detail, reveal, timer, vote, and guess endpoint.
- [ ] Reconcile `Documents/api-doc.yaml`, DRF schema output, backend serializers, and frontend service types.
- [ ] Complete and test the frontend Spy gameplay journey after role reveal: timer, pause/resume/stop, vote, guess, and final result.
- [ ] Fix or remove `GameSession.__str__` use of missing `self.status`.
- [ ] Remove duplicated `SpyTimerService` class definition and retain a single tested implementation.

## Medium priority

- [ ] Update root `README.md` to match current Django 6 / implemented-project state.
- [ ] Define a session history/result UX and connect it to the existing session list/detail API.
- [ ] Add tests for cross-host access attempts and invalid Spy state transitions.
- [ ] Replace development-only security settings before production (`SECRET_KEY`, `DEBUG`, CORS, allowed hosts).

## Low priority

- [ ] Add additional game modules using the generic session/player abstraction.
- [ ] Add a deployment guide and production database plan.
- [ ] Improve accessibility and responsive QA for shared-device usage.
