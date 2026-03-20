# Epic 2: Daily Recommendation

## Goal

Generate an actionable, explainable daily activity recommendation from the user's current condition and recent history.

## Depends On

- Epic 0
- Epic 1

## Unblocks

- Epic 3
- Epic 5
- Epic 8

## Stories

- [E2-S1 Generate today's recommendation](../stories/E2-S1-generate-todays-recommendation.md)
- [E2-S2 Recommendation rationale and cautions](../stories/E2-S2-recommendation-rationale-and-cautions.md)
- [E2-S3 Recommendation adherence tracking](../stories/E2-S3-recommendation-adherence-tracking.md)

## Scope

- recommendation generation after check-in
- plain-language rationale and caution messaging
- storage of recommendation snapshots and adherence state

## Likely Repo Touchpoints

- `mobile/src/adaptivePlan.mjs`
- `mobile/src/loadModel.mjs`
- home recommendation card
- new recommendation persistence helpers

## Exit Criteria

- a recommendation is generated and saved after check-in
- users can understand why it was suggested
- later logging can link back to that recommendation
