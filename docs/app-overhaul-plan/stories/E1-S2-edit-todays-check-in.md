# E1-S2: Edit Today's Check-In

Epic: [Epic 1](../epics/EPIC-1-daily-condition-check-in.md)  
Priority: MVP  
Size: S

## User Story

As a user, I want to update my current-day check-in if my condition changes so the app can reflect how I actually feel.

## Depends On

- E1-S1

## Unblocks

- more accurate daily recommendation refresh behavior

## Implementation Notes

- allow edits only for the current day from the daily flow
- refresh recommendation inputs after save
- prevent accidental editing of prior-day records from the home shortcut

## Acceptance Criteria

- today's check-in can be reopened and updated
- the latest saved values replace earlier same-day values for recommendation input
- prior-day check-ins remain untouched from the daily flow
- the UI indicates whether the user is creating or editing

## Test And Verification

- tests for same-day overwrite behavior
- UI verification for edit state messaging
