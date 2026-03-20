# Epic 6: Dashboard and Performance Metrics

## Goal

Convert accumulated history into top-line metrics and decision-useful review surfaces.

## Depends On

- Epic 1
- Epic 3
- Epic 4
- Epic 5 for the best user review experience

## Unblocks

- Epic 8

## Stories

- [E6-S1 Top-line health and performance metrics](../stories/E6-S1-top-line-health-and-performance-metrics.md)
- [E6-S2 Opportunity gaps and missing blocks](../stories/E6-S2-opportunity-gaps-and-missing-blocks.md)
- [E6-S3 Weekly review snapshot](../stories/E6-S3-weekly-review-snapshot.md)

## Scope

- top-line metric cards and charts
- gap and opportunity detection
- weekly summary snapshots

## Likely Repo Touchpoints

- insights screen
- `mobile/src/loadModel.mjs`
- new metrics aggregation module
- existing chart and visualization components

## Exit Criteria

- the dashboard has useful metrics with clear time windows
- low-data states are still understandable
- users can identify both progress and gaps from the insights layer
