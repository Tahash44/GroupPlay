# Changelog

## 2026-08-02

### Completed page redesigns

- Redesigned authentication, friends, profile, games catalogue, Spy setup, private
  reveal, timer, voting, guessing, result, history, and history-detail experiences.
- Standardized Persian typography, semantic colors, local SVG icons, borders,
  shadows, focus states, touch targets, responsive navigation, and shared states.
- Corrected bidirectional text entry and mixed Persian/English name presentation in
  authentication and friend workflows.
- Reworked desktop and mobile catalogue navigation, branding, card order, available
  states, and coming-soon presentation.
- Aligned the live Spy result page with the history-detail visual structure,
  including summary, location, winner reason, statistics, and player roles.

### Spy flow improvements

- Made the timer start only after the last participant has revealed a role.
- Fixed mobile ad-hoc guest creation and refined player-selection controls.
- Simplified private reveal cards to show only the location for civilians and the
  Spy identity for Spies.
- Removed the intermediate Spy-selection dialog before the location-guess phase.
- Added exact multi-Spy accusation: the UI requires the configured count and the
  backend advances only when the selected set exactly equals all actual Spies.
- Persisted the last successful Spy setup per signed-in user in session storage for
  up to eight hours, avoiding repetitive participant entry during the same play
  session without restoring stale setups days later.

### Verification and remaining work

- Verified all 104 backend tests and all 119 frontend tests pass, with frontend lint
  and the production build also green after the latest result-page alignment.
- Recorded the remaining cross-page reference-width, landscape, accessibility,
  reduced-motion, zoom, contrast, touch-target, offline, and final-consistency QA in
  the phase plan and backlog.

## 2026-08-01

### Design foundation

- Replaced runtime Google font loading with packaged Vazirmatn weights.
- Replaced Material Symbols text spans with a shared Phosphor SVG icon component.
- Added one semantic token source with compatibility aliases for existing pages.
- Added consistent keyboard focus treatment and reduced-motion behavior.
- Made the player-removal control a semantic, labelled button.
- Verified the frontend production build and complete test suite.

### Shared UI components

- Added typed shared button, text-field, dialog, state-panel, page-header, and action-bar components.
- Added loading, disabled, error, focus, responsive, safe-area, and reduced-motion-compatible states.
- Added Escape dismissal, focus restoration, and keyboard focus containment to dialogs.
- Migrated all friend dialogs, the friends page header/search/states, history states, and the Spy setup action bar.
- Removed the obsolete friend-modal stylesheet and replaced repeated HTTP error narrowing with a typed helper.

### Authentication and friends redesign

- Rebuilt login and registration with shared fields and buttons while preserving the existing API flow.
- Added a clear mode selector, responsive desktop introduction, mobile-first form layout, and accessible password visibility control.
- Removed duplicated authentication tokens, structural emoji, and route-mode state effects.
- Consolidated the friends page styles, added a responsive two-column layout, and increased item actions to touch-safe sizes.
- Verified login and registration visually at 375px and 1280px widths.
- Removed the duplicate mode switch below the authentication form.
- Anchored the desktop introduction so its position stays fixed across authentication modes.
- Added automatic bidirectional input direction with Persian placeholders kept right-to-left.
- Isolated mixed-language friend names inside the delete-confirmation sentence.

### Application shell and games catalog

- Rebuilt the mobile top bar, four-item bottom navigation, and desktop sidebar.
- Added safe-area spacing, a keyboard skip link, route-aware active states, and a working new-game action.
- Unified profile access, host identity, brand presentation, and logout styling.
- Rebuilt the games catalog with a shared header, loading/error/empty states, and responsive cards.
- Added explicit available and coming-soon states so unfinished games no longer appear actionable.
- Kept the Spy setup as the primary playable path and updated its catalog copy.
- Reordered the desktop navigation and placed its icons on the right of right-aligned labels.
- Simplified the host identity area and limited profile navigation to the avatar itself.
- Corrected desktop and mobile brand placement and gave mobile navigation its requested order.
- Removed the redundant Spy introduction panel and right-aligned the catalog heading.
- Promoted Spy to the first, moderately larger catalog card and enabled dense grid packing.
- Changed Mafia from a popular badge to an explicit coming-soon state.

### Design audit

- Audited all implemented frontend routes, pages, components, and shared styles.
- Compared the existing implementation with the supplied BaziGardan design system.
- Used the UI/UX knowledge base for accessibility, interaction, color, typography,
  responsive layout, React semantics, and the conceptual-sketch visual direction.
- Verified the login and registration pages at desktop and 375px mobile width.
- Documented page-level issues, system-wide priorities, tokens, component architecture,
  and acceptance criteria in `Documents/design.md`.

## 2026-07-27

### Audited

- Re-read backend models, serializers, services, views, routes, migrations, and tests.
- Re-read frontend routing, authentication, feature services/types, Spy gameplay,
  history, layout, and tests.
- Verified all 101 backend tests pass.
- Verified 117 of 118 frontend tests pass; the layout history test is stale.
- Verified the frontend production build fails on two TypeScript errors.

### Updated

- Corrected context for implemented timer, voting, results, and history screens.
- Documented actual history, detail, timer, voting, and guess contracts.
- Added confirmed ownership, role-privacy, friend-integrity, transition, build, and
  encoding risks.
- Reordered the backlog around security and a green delivery baseline.
- Recorded history-from-sessions and provisional player-minimum decisions.

### Fixed

- Corrected the `GameDetailPage` type import.
- Removed an unused Testing Library import from the voting tests.
- Updated the layout test to treat implemented history navigation as available.
- Restored the frontend baseline with all 118 tests and the production build passing.
- Built and started both Docker Compose services and verified HTTP 200 responses.

## 2026-07-19

### Added

- Persistent AI-agent workspace under `Agents/`.
- Project rules, architecture, context, product, database, API, phase, and backlog documentation based on the current repository.
- The authenticated host is an optional, selectable player in Spy setup; the backend no longer adds the host automatically.

### Documented

- Current implemented authentication, friends, Spy game, frontend, and Docker architecture.
- Known API, ownership, and code-quality follow-ups.

### Changed

- Spy game setup now allows a timer between one and fifteen minutes.
