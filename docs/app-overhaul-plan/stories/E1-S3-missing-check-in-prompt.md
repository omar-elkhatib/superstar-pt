# E1-S3: Missing Check-In Prompt

Epic: [Epic 1](../epics/EPIC-1-daily-condition-check-in.md)  
Priority: MVP  
Size: S

## User Story

As a user, I want the app to clearly show when I have not checked in yet so I know what to do first.

## Depends On

- E0-S1

## Unblocks

- better home completion guidance

## Implementation Notes

- add an obvious incomplete state on home
- replace the prompt with a summary card after check-in exists
- keep the CTA focused on the next required action

## Acceptance Criteria

- home shows a prominent prompt when no check-in exists today
- the prompt opens the check-in flow directly
- once today's check-in exists, the prompt is replaced by a summary state
- empty-state UI is visually verified on simulator

## Test And Verification

- state-selection tests for missing versus complete home state
- screenshot verification for both states
