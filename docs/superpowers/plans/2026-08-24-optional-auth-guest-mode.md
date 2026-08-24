# Optional Authentication and Guest Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow anonymous visitors to browse the app and complete one temporary Spy game while keeping account-only features protected.

**Architecture:** Add an expiring opaque guest identity separate from the custom user model. Spy session ownership accepts either the authenticated host or the matching guest identity, while profile, friends persistence, history, and administration remain account-only. The frontend keeps the guest identity and one active game in browser storage, uses a shared login/register prompt, and preserves the current route/action after authentication.

**Tech Stack:** Django 6.0.6, Django REST Framework, Simple JWT, SQLite, React 19, TypeScript 6, React Router, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-24-optional-auth-guest-mode-design.md`

## Global Constraints

- Guest access must never expose account profile, permanent friends, account history, or administration data.
- Guest data and the browser guest identity expire after eight hours.
- One guest may have only one active Spy game at a time.
- Guests may complete the Spy flow without login, including role reveal, timer, voting, and result.
- The pre-game and post-result prompts are optional and contain only login, registration, and close actions.
- No authentication prompt may interrupt an active game.
- Authenticated users must not see guest prompts.
- Do not transfer a guest game into a later-created account.
- Preserve existing user-authenticated behaviour and existing unrelated working-tree changes.

---

### Task 1: Add the expiring guest identity model

**Files:**
- Create: `GroupPlay/games/migrations/0003_guest_session.py`
- Modify: `GroupPlay/games/models.py`
- Modify: `GroupPlay/config/settings.py` only if a guest lifetime constant is needed
- Test: `GroupPlay/games/tests/test_models.py`

**Interfaces:**
- Produces a `GuestSession` record with an opaque token, expiry timestamp, and one-to-one or unique active-game ownership fields that later API tasks can query.
- Produces a single named lifetime constant of eight hours shared by creation and expiry checks.

- [ ] **Step 1: Write failing model tests**

Add tests that create a guest identity, verify its token is not the display value, accept an unexpired identity, reject an expired identity, and prevent two active Spy sessions from being assigned to the same guest.

- [ ] **Step 2: Run the focused model tests**

```text
python GroupPlay/manage.py test games.tests.test_models -v 2
```

Expected: the new guest tests fail because the model and expiry API do not exist.

- [ ] **Step 3: Implement the model and migration**

Use a cryptographically random opaque token, store `created_at` and `expires_at`, add an `active_session` relation that can be cleared after finish or cancellation, and expose a small method such as `is_valid(now=None)` that checks both expiry and active state without touching authentication users.

- [ ] **Step 4: Run the focused model tests again**

```text
python GroupPlay/manage.py test games.tests.test_models -v 2
```

Expected: PASS.

- [ ] **Step 5: Commit the model unit**

```text
git add GroupPlay/games/models.py GroupPlay/games/migrations/0003_guest_session.py GroupPlay/games/tests/test_models.py
git commit -m "feat: add expiring guest game identity"
```

### Task 2: Expose guest identity and ownership helpers

**Files:**
- Modify: `GroupPlay/games/services.py` or the existing shared game service boundary
- Modify: `GroupPlay/games/serializers.py`
- Modify: `GroupPlay/games/views.py`
- Modify: `GroupPlay/games/urls.py` or the actual mounted game URL module
- Test: `GroupPlay/games/tests/test_models.py`
- Test: `GroupPlay/games/spy/tests/test_spy_api.py`

**Interfaces:**
- Produces `POST /api/v1/games/guest/` returning `{guest_token, expires_at}`.
- Produces a request helper that resolves either `request.user` or the opaque guest token from a dedicated header such as `X-Guest-Token`.
- Produces an ownership check that accepts only the authenticated owner or the exact guest owner of the session.

- [ ] **Step 1: Add failing API tests**

Test guest creation, malformed token rejection, expired token rejection, and cross-guest session rejection. Assert that guest creation does not create an `accounts.User`.

- [ ] **Step 2: Run the focused API tests**

```text
python GroupPlay/manage.py test games.tests.test_models games.spy.tests.test_spy_api -v 2
```

Expected: the new guest endpoint and ownership assertions fail.

- [ ] **Step 3: Implement token resolution and guest creation**

Create the guest record atomically, return only the opaque token and expiry, parse the dedicated header, and return a stable `401` or `403` response for missing, malformed, expired, or foreign guest credentials according to the existing API error conventions.

- [ ] **Step 4: Run the focused API tests**

```text
python GroupPlay/manage.py test games.tests.test_models games.spy.tests.test_spy_api -v 2
```

Expected: PASS.

- [ ] **Step 5: Commit the guest identity API**

```text
git add GroupPlay/games GroupPlay/games/tests GroupPlay/games/spy/tests
git commit -m "feat: issue and validate guest game tokens"
```

### Task 3: Make Spy sessions work for authenticated hosts and guests

**Files:**
- Modify: `GroupPlay/games/models.py`
- Modify: `GroupPlay/games/serializers.py`
- Modify: `GroupPlay/games/services.py`
- Modify: `GroupPlay/games/spy/services.py`
- Modify: `GroupPlay/games/spy/views.py`
- Modify: `GroupPlay/games/spy/serializers.py`
- Modify: `GroupPlay/games/spy/urls/V1/urls.py`
- Test: `GroupPlay/games/spy/tests/test_spy_api.py`
- Test: `GroupPlay/games/spy/tests/test_spy_logic.py`

**Interfaces:**
- Spy session creation accepts either an authenticated request or a valid guest token.
- Every detail, reveal, timer, vote, guess, and result request enforces the same owner identity that created the session.
- Finished guest sessions remain accessible through the guest token for eight hours but are excluded from authenticated history queries.

- [ ] **Step 1: Add failing guest-flow API tests**

Cover guest session creation, sequential reveal, timer controls, exact multi-Spy voting, guess result, finished detail, and denial when a second guest token requests the session. Add a test that an authenticated user cannot read another guest session.

- [ ] **Step 2: Run the guest-flow tests**

```text
python GroupPlay/manage.py test games.spy.tests.test_spy_api games.spy.tests.test_spy_logic -v 2
```

Expected: guest requests fail with the current authenticated-only permission path.

- [ ] **Step 3: Implement session ownership fields and service branching**

Make the session owner explicit without allowing both a user and guest owner for the same session. Keep player names and role privacy unchanged. On creation, attach the guest identity and reserve its active-game slot; on finish, release the active-game slot while retaining the finished result until expiry.

- [ ] **Step 4: Preserve account-only history**

Ensure list and detail history endpoints query only sessions owned by the authenticated user. Guest detail remains a direct-session operation, never a history listing operation.

- [ ] **Step 5: Run all backend tests**

```text
python GroupPlay/manage.py test
```

Expected: PASS for existing account, friend, admin, generic game, and Spy tests.

- [ ] **Step 6: Commit the guest-enabled Spy flow**

```text
git add GroupPlay
git commit -m "feat: allow guests to play Spy sessions"
```

### Task 4: Add frontend guest identity and storage lifecycle

**Files:**
- Modify: `frontend/src/shared/api/api.ts`
- Modify: `frontend/src/shared/context/AuthContext.tsx`
- Create: `frontend/src/shared/context/GuestContext.tsx`
- Create: `frontend/src/shared/guest/guestStorage.ts`
- Create: `frontend/src/shared/guest/guestStorage.test.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- `guestStorage` exposes `getGuestToken()`, `setGuestIdentity()`, `clearGuestIdentity()`, and `hasExpiredGuestIdentity()`.
- `GuestContext` exposes `{ guestToken, ensureGuest(), clearGuest(), hasActiveGame, setActiveGame(), clearActiveGame() }`.
- The API client adds `X-Guest-Token` only when a valid guest token exists and continues adding bearer tokens for authenticated users.

- [ ] **Step 1: Write failing storage and interceptor tests**

Test eight-hour expiry, automatic cleanup, guest header injection, bearer-header preservation, and absence of guest headers after logout or expiry.

- [ ] **Step 2: Run the focused frontend tests**

```text
cd frontend
npm run test:run -- src/shared/guest/guestStorage.test.ts src/shared/api/api.test.ts
```

Expected: FAIL because the guest storage and context do not exist.

- [ ] **Step 3: Implement guest storage and context**

Use browser storage for the opaque token and expiry, use one active-game record per guest, and call the guest endpoint lazily when a guest enters the Spy setup flow. Never replace or clear a valid bearer session with a guest identity.

- [ ] **Step 4: Run the focused frontend tests**

```text
cd frontend
npm run test:run -- src/shared/guest/guestStorage.test.ts src/shared/api/api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the frontend guest foundation**

```text
git add frontend/src/shared
git commit -m "feat: add frontend guest identity lifecycle"
```

### Task 5: Add the reusable login/register invitation modal

**Files:**
- Create: `frontend/src/shared/components/auth/AuthPromptModal.tsx`
- Create: `frontend/src/shared/components/auth/AuthPromptModal.css`
- Create: `frontend/src/shared/components/auth/AuthPromptModal.test.tsx`
- Modify: `frontend/src/router/index.tsx`
- Modify: `frontend/src/features/auth/pages/AuthPage.tsx`

**Interfaces:**
- `AuthPromptModal` accepts `open`, `variant` (`pre-game` or `post-result`), and `onClose`.
- The modal emits navigation to login or registration while preserving a return location and pending action marker.
- Closing the modal performs no navigation and leaves the current guest flow unchanged.

- [ ] **Step 1: Write failing component tests**

Test separate pre-game and post-result copy, exactly two auth actions, a close button in the top-right corner, no guest prompt for authenticated users, and return-location preservation for both login and registration.

- [ ] **Step 2: Run the focused component tests**

```text
cd frontend
npm run test:run -- src/shared/components/auth/AuthPromptModal.test.tsx
```

Expected: FAIL because the component and return-state handling do not exist.

- [ ] **Step 3: Implement the modal and return flow**

Use the existing design tokens and shared button/dialog primitives. Store the current path and pending action in router state or a dedicated transient return state, then restore the route after successful authentication without showing the prompt again to the authenticated user.

- [ ] **Step 4: Run the focused component tests**

```text
cd frontend
npm run test:run -- src/shared/components/auth/AuthPromptModal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the invitation modal**

```text
git add frontend/src/shared/components/auth frontend/src/router/index.tsx frontend/src/features/auth/pages/AuthPage.tsx
git commit -m "feat: add optional authentication prompt"
```

### Task 6: Make guest navigation and Spy UI flows work

**Files:**
- Modify: `frontend/src/features/games/pages/GamesListPage.tsx`
- Modify: `frontend/src/features/games/pages/GameDetailPage.tsx`
- Modify: `frontend/src/features/games/pages/HistoryPage.tsx`
- Modify: `frontend/src/features/friends/pages/FriendsPage.tsx`
- Modify: `frontend/src/features/friends/components/AddFriendModal.tsx`
- Modify: `frontend/src/features/friends/components/EditFriendModal.tsx`
- Modify: `frontend/src/features/friends/components/DeleteConfirmDialog.tsx`
- Modify: `frontend/src/features/games/spy/pages/SpyNewGamePage.tsx`
- Modify: `frontend/src/features/games/spy/pages/SpyRoleRevealPage.tsx`
- Modify: `frontend/src/features/games/spy/pages/InGamePage.tsx`
- Modify: `frontend/src/features/games/spy/pages/VotingPage.tsx`
- Modify: `frontend/src/features/games/pages/HistoryDetailPage.tsx`
- Test: the existing page tests for each modified page

**Interfaces:**
- Guest game pages call the same Spy service with the guest header supplied by the API layer.
- `SpyNewGamePage` shows the pre-game prompt on first guest entry, allows manual temporary players, and restores an active guest game after refresh.
- `VotingPage` or the result route shows the post-result prompt without interrupting result rendering.
- History renders an empty guest state with auth invitation; friend mutations open the auth modal without sending unauthorized mutation requests.

- [ ] **Step 1: Add failing page tests**

Cover guest access to games and details, empty guest history, friend mutation prompt, first-entry pre-game prompt, close-and-continue behaviour, full guest Spy navigation, active-game restoration, and post-result prompt timing.

- [ ] **Step 2: Run the focused page tests**

```text
cd frontend
npm run test:run -- src/features/games src/features/friends src/features/games/spy
```

Expected: FAIL in the new guest cases while existing authenticated cases remain the baseline.

- [ ] **Step 3: Implement guest-aware page guards and service calls**

Remove route-level authentication wrappers only from public pages and Spy gameplay routes. Keep profile, friends mutation, history data, and settings behaviour aligned with the approved access rules. Ensure the guest flow never redirects away from an active Spy page.

- [ ] **Step 4: Run the focused page tests**

```text
cd frontend
npm run test:run -- src/features/games src/features/friends src/features/games/spy
```

Expected: PASS.

- [ ] **Step 5: Commit the guest UI flow**

```text
git add frontend/src/features frontend/src/router/index.tsx
git commit -m "feat: enable guest browsing and Spy gameplay"
```

### Task 7: Align documentation, schema, and full verification

**Files:**
- Modify: `Agents/docs/api.md`
- Modify: `Agents/docs/database.md`
- Modify: `Agents/docs/requirements.md`
- Modify: `Agents/planning/phase.md`
- Modify: `Agents/planning/tasks.md`
- Modify: `Documents/api-doc.yaml` only after comparing it with the generated schema
- Test: backend and frontend full suites

**Interfaces:**
- Documentation states the guest-token header, guest-only Spy access, eight-hour expiry, and account-only history/profile/friends persistence.
- Manual schema either matches the generated schema or explicitly points consumers to `/api/schema/` as the authoritative source.

- [ ] **Step 1: Run the complete verification suites before documentation edits**

```text
python GroupPlay/manage.py test
cd frontend
npm run test:run
npm run build
```

Expected: all backend tests, frontend tests, and production build pass.

- [ ] **Step 2: Update the maintained documentation from the implemented contract**

Document the guest endpoint, header, ownership rules, expiry, one-active-game rule, and guest history behaviour. Update the phase and task backlog only for verified work.

- [ ] **Step 3: Reconcile the manual API schema**

Compare `Documents/api-doc.yaml` against the generated schema from `python GroupPlay/manage.py spectacular --file /tmp/groupplay-schema.yaml`. Update only fields and paths confirmed by serializers, views, and tests; otherwise retain the explicit legacy warning.

- [ ] **Step 4: Run final verification**

```text
python GroupPlay/manage.py test
cd frontend
npm run test:run
npm run build
```

Expected: PASS with no new lint, type, or test failures.

- [ ] **Step 5: Commit documentation and verified final state**

```text
git add Agents Documents docs
git commit -m "docs: document optional authentication and guest mode"
```

## Self-review

- Guest browsing, full Spy execution, temporary players, result retention, expiry,
  and one-active-game behaviour are covered by Tasks 2, 3, 4, and 6.
- Account-only profile, friends persistence, history, and administration are covered
  by Tasks 3 and 6.
- Pre-game and post-result prompts, close behaviour, authenticated suppression, and
  return navigation are covered by Tasks 5 and 6.
- Ownership isolation and expired-token handling are covered by Tasks 1, 2, and 3.
- Generated/manual schema reconciliation and documentation are covered by Task 7.
- No unresolved placeholders or undefined task interfaces remain.
