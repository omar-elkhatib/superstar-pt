# Workstream 02: Today State Adapters

## Owner

- `AI-2`

## Goal

Create a single derived-state layer for `Today` so the screen does not recompute business logic inline.

## Scope

- build `buildTodayScreenState(...)`
- adapt existing check-in, recommendation, follow-up, and weekly-summary data into screen-ready sections
- keep current recommendation semantics intact

## Primary Touchpoints

- `mobile/src/viewModels/todayScreenState.mjs`
- existing read-only dependencies:
  - `mobile/src/checkInModel.mjs`
  - `mobile/src/followUpInbox.mjs`
  - `mobile/src/adaptivePlan.mjs`
  - `mobile/src/loadModel.mjs`
  - `mobile/src/historyStore.mjs`

## Must Not Touch

- visual screen files
- navigation files

## Dependencies

- none beyond frozen contracts

## Deliverables

- derived state builder for:
  - check-in section
  - recommendation hero
  - prioritized follow-up card
  - weekly summary teaser
  - onboarding visibility

## Acceptance

- only one follow-up item is promoted on `Today`
- `Today` recommendation content is complete enough to render without screen-level domain logic
- empty and complete states are explicit

## Tests

- new business-value tests for `buildTodayScreenState`
- verify missing-check-in, existing-check-in, and follow-up-priority cases

## Handoff Notes

- document returned field names clearly so `AI-3` can consume them without reinterpretation
