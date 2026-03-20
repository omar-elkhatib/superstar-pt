# E8-S2: Show What The App Has Learned

Epic: [Epic 8](../epics/EPIC-8-personalization-and-recommendation-tuning.md)  
Priority: Release 3  
Size: S

## User Story

As a user, I want a simple explanation of the patterns the app sees so I understand why recommendations are changing.

## Depends On

- E8-S1
- E5-S1 is strongly preferred for traceability

## Unblocks

- trust in personalized recommendations

## Implementation Notes

- add a short 'what we're learning' summary on home or insights
- reference concrete patterns the user can recognize
- keep certainty language modest

## Acceptance Criteria

- the app surfaces a short summary of learned patterns
- the summary references concrete, user-visible signals
- the explanation avoids overstating certainty
- the user can trace the pattern back to supporting history where possible

## Test And Verification

- explanation-selection tests
- screenshot verification for learned-pattern UI
