# E8-S3: Recommendation Feedback Controls

Epic: [Epic 8](../epics/EPIC-8-personalization-and-recommendation-tuning.md)  
Priority: Release 3  
Size: S

## User Story

As a user, I want to mark whether guidance was useful so the app can improve and I can keep it aligned with my reality.

## Depends On

- E2-S1
- E8-S1 is preferred if the signal will influence tuning immediately

## Unblocks

- stronger tuning and explanation quality over time

## Implementation Notes

- store explicit recommendation feedback separate from symptom outcomes
- keep the control lightweight and non-blocking
- use the signal for tuning and explanation refinement rather than replacing symptom data

## Acceptance Criteria

- users can mark recommendations as helpful, not helpful, or modified
- this signal is stored separately from symptom outcomes
- submitting feedback does not interrupt the main daily flow
- the saved signal becomes available to later tuning logic

## Test And Verification

- persistence tests for recommendation feedback
- screenshot verification for lightweight feedback controls
