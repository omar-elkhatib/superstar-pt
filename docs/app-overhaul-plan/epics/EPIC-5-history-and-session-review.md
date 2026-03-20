# Epic 5: History and Session Review

## Goal

Show the user's data as one connected timeline instead of isolated records.

## Depends On

- Epic 1
- Epic 2
- Epic 3
- Epic 4

## Unblocks

- Epic 6
- Epic 8

## Stories

- [E5-S1 Unified timeline](../stories/E5-S1-unified-timeline.md)
- [E5-S2 Session detail with outcome chain](../stories/E5-S2-session-detail-with-outcome-chain.md)
- [E5-S3 History filters](../stories/E5-S3-history-filters.md)

## Scope

- one chronological history view
- session detail that ties recommendation, activity, and follow-up together
- practical filters for pattern review

## Likely Repo Touchpoints

- history screen
- session detail screen
- `mobile/src/historyStore.mjs`
- `mobile/src/sessionBrowser.mjs`

## Exit Criteria

- timeline items are distinct and understandable
- session detail explains the full outcome chain
- filters help users find patterns without confusing the base timeline
