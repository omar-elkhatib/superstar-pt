# E2-S2: Recommendation Rationale And Cautions

Epic: [Epic 2](../epics/EPIC-2-daily-recommendation.md)  
Priority: MVP  
Size: S

## User Story

As a user, I want to understand why the app is recommending something so I can decide whether to follow it.

## Depends On

- E2-S1

## Unblocks

- trust in daily recommendation usage

## Implementation Notes

- surface a short explanation with plain-language reasoning
- call out conservative signals when the plan is reduced or held
- avoid clinical certainty language

## Acceptance Criteria

- each recommendation includes a short rationale
- conservative recommendations highlight the caution signal that drove them
- wording avoids diagnosis and overconfidence
- rationale remains understandable in the low-history fallback case

## Test And Verification

- unit tests for rationale text selection
- screenshot verification for cautious and normal recommendation states
