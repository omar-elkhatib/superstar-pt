# E5-S3: History Filters

Epic: [Epic 5](../epics/EPIC-5-history-and-session-review.md)  
Priority: Release 2  
Size: S

## User Story

As a user, I want to filter history by activity, symptom area, and outcome so I can spot patterns faster.

## Depends On

- E5-S1

## Unblocks

- faster pattern review and manual insight discovery

## Implementation Notes

- support filters for activity type, symptom area, and outcome category
- keep filter state visible and easy to clear
- preserve a readable default when no filters are active

## Acceptance Criteria

- users can filter by activity type
- users can filter by discomfort or symptom area
- users can filter by improved, neutral, or worsened outcome categories
- filter state is visible and can be reset quickly

## Test And Verification

- filtering logic tests
- screenshot verification for filtered history states
