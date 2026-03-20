# E0-S2: Unified Data Model And Persistence

Epic: [Epic 0](../epics/EPIC-0-foundation-and-app-shell.md)  
Priority: MVP  
Size: M

## User Story

As a returning user, I want my check-ins, recommendations, sessions, and follow-ups to remain saved so that the app can learn from my history.

## Depends On

- none

## Unblocks

- all data-dependent stories in Epics 1 through 8

## Implementation Notes

- expand `mobile/src/historyStore.mjs` into a unified schema
- preserve compatibility with existing session records
- store check-ins, recommendation snapshots, follow-up tasks, and insight records

## Acceptance Criteria

- records persist across app relaunches
- old session entries still load after migration
- new record types share a coherent schema and IDs
- migration behavior is covered by automated tests

## Test And Verification

- store integration tests for reads, writes, and migration
- manual relaunch verification on simulator
