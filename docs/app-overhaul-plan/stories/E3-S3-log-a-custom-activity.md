# E3-S3: Log A Custom Activity

Epic: [Epic 3](../epics/EPIC-3-activity-logging.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want to log something outside the suggested plan so the app still learns from my real life.

## Depends On

- E0-S2
- ideally E3-S1 for shared logging UI

## Unblocks

- more complete history and personalization

## Implementation Notes

- support a custom activity type with structured fallback fields
- preserve effort, duration, and discomfort capture
- ensure custom entries do not break charts or summaries

## Acceptance Criteria

- the user can log a custom activity not found in the recommendation list
- custom logs still support effort, duration, and discomfort capture
- downstream history and insights can safely render custom entries
- the UI makes clear when an activity is outside the suggested plan

## Test And Verification

- tests for custom activity serialization and rendering
- manual verification in history and dashboard views once available
