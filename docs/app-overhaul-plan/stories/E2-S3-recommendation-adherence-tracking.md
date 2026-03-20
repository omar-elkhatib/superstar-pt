# E2-S3: Recommendation Adherence Tracking

Epic: [Epic 2](../epics/EPIC-2-daily-recommendation.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want my logged activity to link back to the day's recommendation so I can compare what was suggested versus what I actually did.

## Depends On

- E2-S1
- E3-S1

## Unblocks

- stronger history and personalization analysis

## Implementation Notes

- store recommendation status as followed, modified, or skipped
- link activity logs to recommendation snapshots when possible
- support late linkage if the user logs outside the recommendation card

## Acceptance Criteria

- recommendation records can store followed, modified, or skipped state
- activity logs can reference the originating recommendation
- history can show whether the user followed or changed the plan
- logging still works if no recommendation was opened first

## Test And Verification

- store tests for recommendation linkage
- session detail verification once Epic 5 is in place
