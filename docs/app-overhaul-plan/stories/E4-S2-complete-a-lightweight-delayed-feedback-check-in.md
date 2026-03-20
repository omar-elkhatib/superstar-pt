# E4-S2: Complete A Lightweight Delayed-Feedback Check-In

Epic: [Epic 4](../epics/EPIC-4-delayed-outcome-follow-up.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want a short follow-up flow so I can report how the activity affected me without a long questionnaire.

## Depends On

- E4-S1

## Unblocks

- E5-S2
- E6-S1
- E8-S1

## Implementation Notes

- capture pain response, fatigue response, functional impact, and hindsight appropriateness
- allow an optional short note
- write the result back to the related session record

## Acceptance Criteria

- the follow-up can be completed in under 60 seconds
- the flow records delayed pain, fatigue, functional impact, and appropriateness
- optional note capture is available
- completion updates the related session and recommendation inputs

## Test And Verification

- follow-up completion tests
- screenshot verification for pending and completed follow-up states
- Maestro flow covering pending -> complete
