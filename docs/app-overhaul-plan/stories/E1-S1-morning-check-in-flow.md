# E1-S1: Morning Check-In Flow

Epic: [Epic 1](../epics/EPIC-1-daily-condition-check-in.md)  
Priority: MVP  
Size: M

## User Story

As a user, I want to log my pain, readiness, and fatigue in under a minute so I can quickly get guidance for the day.

## Depends On

- E0-S1
- E0-S2

## Unblocks

- E2-S1

## Implementation Notes

- add same-day check-in creation from the home screen
- use fast touch controls rather than long forms
- support an optional short note

## Acceptance Criteria

- pain, readiness, and fatigue can be captured from home
- saving the check-in creates a same-day record with a timestamp
- the user is taken directly to today's recommendation after save
- the flow is optimized for one-minute completion

## Test And Verification

- domain tests for same-day check-in creation
- screenshot verification for incomplete and complete states
- Maestro flow through check-in and save
