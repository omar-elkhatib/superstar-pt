# Workstream 05: Progress State Adapters

## Owner

- `AI-5`

## Goal

Build the derived data required by the new `Progress` screen so the UI can stay thin.

## Scope

- build `buildProgressSummary(...)`
- build `buildProgressTimeline(...)`
- create any helper formatters needed for timeline items
- preserve load chart data sources and current risk semantics

## Primary Touchpoints

- `mobile/src/viewModels/progressSummary.mjs`
- `mobile/src/viewModels/progressTimeline.mjs`
- existing read-only dependencies:
  - `mobile/src/loadModel.mjs`
  - `mobile/src/recommendationLogging.mjs`
  - `mobile/src/checkInModel.mjs`
  - `mobile/src/followUpInbox.mjs`
  - `mobile/src/activityEntryMetadata.mjs`

## Must Not Touch

- visual `Progress` screen implementation
- navigation files

## Dependencies

- none beyond frozen contracts

## Deliverables

- one-line weekly summary model
- mixed-item timeline builder
- session detail data adapter if needed by `AI-6`

## Acceptance

- timeline mixes check-ins, recommendations, sessions, and follow-ups in descending time order
- summary string format stays fixed
- recommendation cards are not part of the `Load` model

## Tests

- add tests for:
  - summary string generation
  - mixed-item ordering
  - empty-state handling

## Handoff Notes

- publish item type fields clearly for `AI-6`
