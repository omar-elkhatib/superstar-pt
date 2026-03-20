# E3-S2: Record Immediate Discomfort, Mistakes, And Notes

Epic: [Epic 3](../epics/EPIC-3-activity-logging.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want to note discomfort or mistakes right after an activity so the app captures what happened while it is still fresh.

## Depends On

- E3-S1

## Unblocks

- richer follow-up and personalization signals

## Implementation Notes

- extend the saved activity record with discomfort, area, and short notes
- make these fields optional to protect flow speed
- keep downstream summaries stable even when notes are freeform

## Acceptance Criteria

- the log supports immediate discomfort rating and affected area selection
- the log supports a short note for mistakes, limitations, or deviations
- required and optional fields are clearly distinguished
- saved feedback becomes available to later recommendation and review features

## Test And Verification

- store and aggregation tests for new fields
- screenshot verification for optional feedback UI
