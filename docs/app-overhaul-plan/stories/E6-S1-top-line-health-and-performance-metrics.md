# E6-S1: Top-Line Health And Performance Metrics

Epic: [Epic 6](../epics/EPIC-6-dashboard-and-performance-metrics.md)  
Priority: Release 2  
Size: M

## User Story

As a user, I want a high-level summary of my pain, readiness, fatigue, activity consistency, and tolerance so I can quickly judge how I am doing.

## Depends On

- E1-S1
- E3-S1
- E4-S2

## Unblocks

- E6-S2
- E6-S3
- E8-S2

## Implementation Notes

- compute top-line metrics from stored check-ins and activity history
- reuse current load and tolerance logic where possible
- make every metric show its time window

## Acceptance Criteria

- insights shows top-line metrics for pain, readiness, fatigue, activity consistency, and tolerance trend
- each metric clearly states its time window
- empty states remain useful when data is sparse
- the UI works cleanly on mobile screen sizes

## Test And Verification

- metric aggregation tests
- screenshot verification for dashboard states
