# E7-S1: Record A Voice Note

Epic: [Epic 7](../epics/EPIC-7-voice-notes-and-ai-summaries.md)  
Priority: Release 3  
Size: M

## User Story

As a user, I want to record my feedback instead of typing it so that giving context stays quick and natural.

## Depends On

- E3-S1 and/or E4-S2 for attachment points
- stable persistence from E0-S2

## Unblocks

- E7-S2
- E7-S3

## Implementation Notes

- support recording during activity logging and delayed follow-up
- expose record, stop, review, retry, and cancel states
- keep the control usable one-handed on mobile

## Acceptance Criteria

- a voice note can be attached during logging or follow-up
- recording, review, retry, and cancel states are clear
- canceled recordings do not corrupt the underlying form state
- the control remains usable on mobile form layouts

## Test And Verification

- UI state tests where possible
- screenshot verification for record and review states
