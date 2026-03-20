# E0-S3: Lightweight Onboarding Baseline

Epic: [Epic 0](../epics/EPIC-0-foundation-and-app-shell.md)  
Priority: MVP  
Size: S

## User Story

As a new user, I want to provide a small amount of starting context so the app can avoid giving generic or unsafe first-day guidance.

## Depends On

- E0-S2

## Unblocks

- safer baseline recommendations in Epic 2

## Implementation Notes

- collect minimal context such as goals, activity level, and sensitive areas
- make onboarding skippable
- avoid blocking app use when context is incomplete

## Acceptance Criteria

- onboarding can be completed in under 2 minutes
- onboarding can be skipped without breaking the app
- completion state persists and suppresses repeat display
- captured baseline data becomes available to recommendation logic

## Test And Verification

- persistence tests for completion state
- screenshot verification for first-run screens
