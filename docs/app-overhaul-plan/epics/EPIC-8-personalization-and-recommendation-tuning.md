# Epic 8: Personalization and Recommendation Tuning

## Goal

Improve recommendations over time using repeated outcomes, while keeping the reasoning visible to the user.

## Depends On

- Epic 1
- Epic 2
- Epic 3
- Epic 4
- Epic 5
- Epic 6
- optionally Epic 7 for richer notes

## Unblocks

- no later epic; this is the adaptive layer capstone

## Stories

- [E8-S1 Learn from repeated outcomes](../stories/E8-S1-learn-from-repeated-outcomes.md)
- [E8-S2 Show what the app has learned](../stories/E8-S2-show-what-the-app-has-learned.md)
- [E8-S3 Recommendation feedback controls](../stories/E8-S3-recommendation-feedback-controls.md)

## Scope

- update recommendation confidence from repeated outcomes
- expose learned patterns in plain language
- capture explicit user sentiment about recommendation usefulness

## Likely Repo Touchpoints

- `mobile/src/loadModel.mjs`
- `mobile/src/adaptivePlan.mjs`
- new recommendation-learning module
- home and insights explanation components

## Exit Criteria

- recommendations respond to repeated outcomes
- the user can see why guidance has shifted
- usefulness feedback is captured separately from symptom outcomes
