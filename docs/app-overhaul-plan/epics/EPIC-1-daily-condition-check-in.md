# Epic 1: Daily Condition Check-In

## Goal

Make the morning condition capture fast, useful, and reliable enough to drive the day's recommendation.

## Depends On

- Epic 0
- specifically E0-S1 and E0-S2

## Unblocks

- Epic 2
- Epic 5
- Epic 6
- Epic 8

## Stories

- [E1-S1 Morning check-in flow](../stories/E1-S1-morning-check-in-flow.md)
- [E1-S2 Edit today's check-in](../stories/E1-S2-edit-todays-check-in.md)
- [E1-S3 Missing check-in prompt](../stories/E1-S3-missing-check-in-prompt.md)

## Scope

- same-day check-in creation
- same-day check-in editing
- home-state prompting when no check-in exists

## Likely Repo Touchpoints

- new check-in module under `mobile/src/`
- home screen UI
- `mobile/src/historyStore.mjs`
- Maestro flow files for check-in states

## Exit Criteria

- the user can create and edit today's check-in quickly
- the home screen reflects complete versus incomplete daily state
- check-ins persist across relaunches and are usable by recommendation logic
