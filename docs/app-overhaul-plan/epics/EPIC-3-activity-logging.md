# Epic 3: Activity Logging

## Goal

Let the user record completed activity with immediate context while keeping the interaction lightweight.

## Depends On

- Epic 0
- Epic 2 for the recommended-activity path

## Unblocks

- Epic 4
- Epic 5
- Epic 6
- Epic 7
- Epic 8

## Stories

- [E3-S1 Log a recommended activity quickly](../stories/E3-S1-log-a-recommended-activity-quickly.md)
- [E3-S2 Record immediate discomfort, mistakes, and notes](../stories/E3-S2-record-immediate-discomfort-mistakes-and-notes.md)
- [E3-S3 Log a custom activity](../stories/E3-S3-log-a-custom-activity.md)

## Scope

- prefilled logging from recommendation
- immediate discomfort and note capture
- custom activity logging outside recommended flows

## Likely Repo Touchpoints

- extracted log screen from `mobile/App.js`
- `mobile/src/historyStore.mjs`
- `mobile/src/loadModel.mjs`
- session form components and success feedback

## Exit Criteria

- the user can log recommended and custom activities
- immediate feedback becomes part of the saved record
- save feedback remains safe-area compliant
