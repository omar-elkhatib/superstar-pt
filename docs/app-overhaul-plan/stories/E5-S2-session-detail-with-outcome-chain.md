# E5-S2: Session Detail With Outcome Chain

Epic: [Epic 5](../epics/EPIC-5-history-and-session-review.md)  
Priority: Release 2  
Size: M

## User Story

As a user, I want to open a session and see the full context around it so I can understand what drove the outcome.

## Depends On

- E5-S1
- E2-S3
- E4-S2

## Unblocks

- better trust and future learning explanations

## Implementation Notes

- connect recommendation snapshot, activity log, immediate feedback, and delayed follow-up in one detail view
- show sensible placeholders when any link is missing
- surface the most relevant summary or insight for that session

## Acceptance Criteria

- session detail includes recommendation, activity, immediate feedback, and delayed outcome when available
- missing chain segments are explained clearly
- the most relevant summary or insight is visible in context
- navigation into and out of the detail view is stable

## Test And Verification

- record-linkage tests for detail assembly
- screenshot verification for complete and partial chains
