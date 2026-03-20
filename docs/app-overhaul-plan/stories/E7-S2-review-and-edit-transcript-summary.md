# E7-S2: Review And Edit Transcript Summary

Epic: [Epic 7](../epics/EPIC-7-voice-notes-and-ai-summaries.md)  
Priority: Release 3  
Size: M

## User Story

As a user, I want to review the generated transcript and summary so I can correct mistakes before they affect the app's understanding of me.

## Depends On

- E7-S1

## Unblocks

- E7-S3
- safer downstream personalization

## Implementation Notes

- present transcript and generated summary separately
- allow the summary to be edited before save
- provide a fallback path if summarization fails

## Acceptance Criteria

- transcript and short summary are generated for a recorded note
- the user can edit the summary before final save
- the UI clearly distinguishes source speech from generated interpretation
- if summarization fails, the user can still save raw or manual text

## Test And Verification

- review-state tests and failure-path tests
- screenshot verification for summary review UI
