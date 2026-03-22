# Workstream 04: Log Screen

## Owner

- `AI-4`

## Goal

Rebuild logging into a cleaner native form without breaking recommendation linkage or current save behavior.

## Scope

- create `LogScreen`
- recommended/manual mode switch
- grouped rows for activity, variant, duration, effort, completion
- optional discomfort and notes paths
- sticky save CTA
- preserve recommended log prefill behavior

## Primary Touchpoints

- `mobile/src/screens/log/**`
- `mobile/src/recommendationLogging.mjs` only if a small adapter is needed
- `mobile/src/activityEntryMetadata.mjs` only if custom activity UX requires it

## Must Not Touch

- navigation files
- `Today` or `Progress` folders

## Dependencies

- `AI-1`
- shell registration from `AI-0`

## Deliverables

- clean logging flow with recommended/manual modes
- recommended prefill stays intact
- custom activity path still works

## Acceptance

- saving a recommended session still classifies followed vs modified correctly
- screen is materially simpler than the current monolithic card
- optional fields do not dominate the first screenful

## Tests

- preserve or add tests for:
  - recommended prefill
  - adherence classification
  - custom activity save path

## Simulator Verification

- capture recommended-prefill screen state
