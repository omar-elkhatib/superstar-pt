# E2-S1: Generate Today's Recommendation

Epic: [Epic 2](../epics/EPIC-2-daily-recommendation.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want the app to suggest the right activity level for today so I do not have to guess what is safe or useful.

## Depends On

- E1-S1
- E0-S2

## Unblocks

- E3-S1
- later personalization work

## Implementation Notes

- extend `adaptSession` and `buildAdaptiveRecommendation` into a daily-plan output
- use today's check-in plus recent load and symptom history
- save a recommendation snapshot for later review

## Acceptance Criteria

- a recommendation is generated after check-in
- the output includes activity type, intensity or volume guidance, and summary text
- low-history users receive a conservative fallback recommendation
- the generated recommendation is persisted

## Test And Verification

- recommendation logic tests for high-history and low-history cases
- screenshot verification for recommendation card states
