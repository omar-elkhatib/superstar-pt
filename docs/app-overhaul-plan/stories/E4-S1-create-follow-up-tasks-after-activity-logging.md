# E4-S1: Create Follow-Up Tasks After Activity Logging

Epic: [Epic 4](../epics/EPIC-4-delayed-outcome-follow-up.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want the app to remember when to check back with me so I do not have to manually track delayed outcomes.

## Depends On

- E3-S1
- E0-S2

## Unblocks

- E4-S2
- E4-S3
- E8-S1

## Implementation Notes

- create a follow-up task when an activity log is saved
- support 24-hour and 48-hour timing windows
- avoid duplicate pending tasks for the same session unless explicitly allowed

## Acceptance Criteria

- logging an activity can create a pending follow-up task
- follow-up timing supports 24-hour and 48-hour windows
- pending status is visible in the app
- duplicate task creation is prevented by default

## Test And Verification

- scheduling and deduplication tests
- manual verification with time-based seeded records where needed
