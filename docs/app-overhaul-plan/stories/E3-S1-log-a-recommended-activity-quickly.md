# E3-S1: Log A Recommended Activity Quickly

Epic: [Epic 3](../epics/EPIC-3-activity-logging.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want to log the activity I completed with minimal effort so that keeping records stays lightweight.

## Depends On

- E2-S1
- E0-S2

## Unblocks

- E4-S1
- E5-S2

## Implementation Notes

- launch a prefilled log flow from the recommendation card
- keep defaults sensible for fast submission
- preserve existing success banner and haptic patterns

## Acceptance Criteria

- the user can start a prefilled activity log from today's recommendation
- the log supports duration, effort, and completion status
- the default path can be completed in under 60 seconds
- successful save persists the session and shows safe-area feedback

## Test And Verification

- activity log domain tests
- screenshot verification for log and success states
- Maestro path from recommendation to saved session
