# Workstream 03: Today Screen

## Owner

- `AI-3`

## Goal

Implement the new `Today` experience using the shared UI kit and the `Today` state adapter.

## Scope

- create `TodayScreen`
- render check-in summary/editor entry point
- render recommendation hero
- render single follow-up card
- render compact weekly teaser
- move onboarding baseline into a modal or sheet flow owned by `Today`

## Primary Touchpoints

- `mobile/src/screens/today/**`

## Allowed Supporting Touchpoints

- light wiring changes in `mobile/src/checkInModel.mjs` only if needed for adapter/screen fit

## Must Not Touch

- `mobile/App.js`
- navigation registration
- `Progress` or `Log` files

## Dependencies

- `AI-1`
- `AI-2`

## Deliverables

- complete `Today` screen
- no recommendation history on `Today`
- no link to a separate insights screen from inside `Today`

## Acceptance

- screen hierarchy matches the approved UI overhaul plan
- recommendation is the primary hero after check-in
- follow-up card is secondary and concise
- onboarding no longer clutters the main feed after completion or skip

## Tests

- add or update tests for:
  - only one recommendation surface on `Today`
  - onboarding modal visibility behavior
  - recommended-session CTA handoff into `Log`

## Simulator Verification

- capture:
  - empty `Today`
  - completed `Today`
