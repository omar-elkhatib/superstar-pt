# Epic 0: Foundation and App Shell

## Goal

Create the app structure needed for the new product flow without continuing to expand the current single-screen implementation.

## Why Now

This is the foundation epic. The current app already has useful logic, but the UI surface is too concentrated in `mobile/App.js` to safely absorb the overhaul.

## Depends On

- none

## Unblocks

- Epic 1 through Epic 8

## Stories

- [E0-S1 Home navigation shell](../stories/E0-S1-home-navigation-shell.md)
- [E0-S2 Unified data model and persistence](../stories/E0-S2-unified-data-model-and-persistence.md)
- [E0-S3 Lightweight onboarding baseline](../stories/E0-S3-lightweight-onboarding-baseline.md)

## Scope

- split the app into feature-oriented screens
- create a durable local schema for check-ins, recommendations, activity logs, follow-ups, and insights
- add lightweight first-run context collection

## Likely Repo Touchpoints

- `mobile/App.js`
- `mobile/src/historyStore.mjs`
- `mobile/src/feedbackPolicy.mjs`
- `mobile/src/TopFeedbackBanner.js`
- new folders under `mobile/src/` for screens, domains, and hooks

## Exit Criteria

- the app has a usable navigation shell
- core records persist coherently across relaunches
- existing session data still loads after schema changes
- onboarding is skippable and does not block app use
