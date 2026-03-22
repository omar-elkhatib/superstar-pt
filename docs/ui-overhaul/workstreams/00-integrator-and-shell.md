# Workstream 00: Integrator And Shell

## Owner

- `AI-0`

## Goal

Finish the remaining app-shell integration work now that the foundational shell and feature screens already exist.

## Current Status

Already landed:

- `mobile/App.js` is reduced to providers, banner host placement, and navigator bootstrap
- bottom tabs and route contracts are registered
- `Today`, `Log`, and `Progress` screen modules are already mounted in the navigator

Still owned here:

- live data/action integration for `Today`
- `Today` to `Log` recommended-session handoff
- root feedback banner/haptic wiring
- legacy shell retirement after parity is confirmed

## Scope

- keep `mobile/App.js` as a thin bootstrap while restoring real feedback state
- wire `Today` to `appHistoryStore` getters and persisted recommendation/baseline/follow-up data
- connect `Today` CTAs to the real check-in, onboarding, follow-up, `Log`, and `Progress` flows
- make `Log` consume navigation params for recommended-session prefill and mode selection
- remove legacy shell wrappers and unused exports once the new paths cover the same user outcomes

## Primary Touchpoints

- `mobile/package.json`
- `mobile/App.js`
- `mobile/src/navigation/**`
- `mobile/src/TopFeedbackBanner.js`

## Must Not Touch

- detailed screen implementation in other agents’ folders beyond minimal registration

## Dependencies

- none to start

## Blocks

- final integration for all other workstreams

## Deliverables

- live `Today` screen integration
- working `Today` to `Log` recommended-session handoff
- active banner/haptic feedback host
- deletion or retirement of `mobile/src/appShellModel.mjs` and legacy shell screens after replacement

## Acceptance

- app opens on `TodayTab`
- no top toggle row remains
- tab navigation works without resetting unrelated screen state
- banner host remains visible and non-overlapping
- `Today` reads live state instead of route-only demo data
- `Log` opens in recommended mode when launched from `Today`
- onboarding, follow-up, and check-in actions no longer depend on placeholder callback injection

## Tests

- keep shell contract tests passing
- add integration coverage for `Today` data wiring and `Today` to `Log` navigation handoff
- cover feedback banner behavior once the root notice state is restored

## Handoff Notes

- do not mark this workstream complete until the remaining live wiring is in place and the old shell is retired or explicitly documented as dead code
