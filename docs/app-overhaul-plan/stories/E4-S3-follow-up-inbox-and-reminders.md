# E4-S3: Follow-Up Inbox And Reminders

Epic: [Epic 4](../epics/EPIC-4-delayed-outcome-follow-up.md)  
Priority: MVP  
Size: S

## User Story

As a user, I want to see which follow-ups are still waiting on me so I do not miss important outcome logging.

## Depends On

- E4-S1

## Unblocks

- stronger completion rates for delayed outcomes

## Implementation Notes

- show pending and overdue follow-ups on home or a lightweight inbox
- keep the path to completion one tap away
- treat system notifications as optional, not required for the MVP

## Acceptance Criteria

- the app shows pending and overdue follow-ups in-product
- each pending item opens directly into the matching follow-up flow
- reminder timing is visible and understandable
- the feature remains useful even without push notifications

## Test And Verification

- state tests for pending and overdue grouping
- screenshot verification for inbox states
