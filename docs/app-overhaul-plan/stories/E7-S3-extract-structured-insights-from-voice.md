# E7-S3: Extract Structured Insights From Voice

Epic: [Epic 7](../epics/EPIC-7-voice-notes-and-ai-summaries.md)  
Priority: Release 3  
Size: M

## User Story

As a user, I want spoken feedback to become useful structured data so the app can actually learn from what I said.

## Depends On

- E7-S2

## Unblocks

- richer inputs for E8-S1 and E8-S2

## Implementation Notes

- map reviewed notes into symptoms, tolerance, issues, and outcome sentiment
- attach extracted fields to the related session or follow-up
- keep all inferred fields visible and editable before final save

## Acceptance Criteria

- the system can extract symptoms, activity tolerance, issues encountered, and outcome sentiment from a reviewed note
- extracted fields are linked to the related record
- users can inspect and correct inferred fields before save
- incorrect inferences can be removed cleanly

## Test And Verification

- structured extraction tests for supported categories
- manual verification with seeded reviewed summaries
