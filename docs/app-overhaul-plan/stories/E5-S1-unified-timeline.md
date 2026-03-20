# E5-S1: Unified Timeline

Epic: [Epic 5](../epics/EPIC-5-history-and-session-review.md)  
Priority: Release 2  
Size: M

## User Story

As a user, I want to see my check-ins, recommendations, activities, and follow-ups in one timeline so I can understand how one day led to the next.

## Depends On

- E1-S1
- E2-S1
- E3-S1
- E4-S2

## Unblocks

- E5-S2
- better insight and explanation features

## Implementation Notes

- aggregate records from multiple types into one chronological feed
- make item types visually distinct
- preserve performance with a realistic local dataset

## Acceptance Criteria

- history shows check-ins, recommendations, activities, and follow-ups in order
- timeline items are visually distinct by type
- empty states explain how history becomes useful over time
- the timeline performs acceptably on mobile with realistic seed data

## Test And Verification

- aggregation tests for merged history ordering
- screenshot verification for empty and populated timeline states
