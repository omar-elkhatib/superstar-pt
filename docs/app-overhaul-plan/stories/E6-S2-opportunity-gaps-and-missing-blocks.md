# E6-S2: Opportunity Gaps And Missing Blocks

Epic: [Epic 6](../epics/EPIC-6-dashboard-and-performance-metrics.md)  
Priority: Release 2  
Size: M

## User Story

As a user, I want the app to highlight areas I may be under-training or neglecting so I know what to add.

## Depends On

- E6-S1
- E5-S1 is strongly preferred for drill-down context

## Unblocks

- more actionable planning from the dashboard

## Implementation Notes

- derive gap signals from recent activity coverage and current condition state
- keep language suggestive rather than absolute
- link each gap to relevant recommendation or history context where possible

## Acceptance Criteria

- the dashboard highlights potential coverage gaps or missing blocks
- suggestions reference current health state and recent pattern data
- suggestions avoid sounding prescriptive or diagnostic
- each gap item links to relevant history or recommendation context when available

## Test And Verification

- logic tests for opportunity detection
- screenshot verification for gap callouts
