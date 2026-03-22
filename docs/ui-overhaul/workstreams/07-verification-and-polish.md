# Workstream 07: Verification And Polish

## Owner

- `AI-7`

## Goal

Verify the integrated overhaul, catch regressions, and produce the screenshot artifacts required for UI work.

## Scope

- update tests after integration
- run simulator validation flows
- capture screenshots
- validate safe-area banner placement
- tighten spacing, copy density, and obvious accessibility issues

## Primary Touchpoints

- test files under `test/` and `mobile/test/`
- Maestro flows if present and still relevant
- screenshot artifact locations under `mobile/.derived-data/`

## Must Not Touch

- core navigation architecture unless a blocker is found

## Dependencies

- integrated build from `AI-0`
- screens from `AI-3`, `AI-4`, `AI-6`

## Deliverables

- passing tests
- simulator screenshots for the five required UI states
- final bug list for anything deferred

## Acceptance

- no duplicated recommendation content across top-level destinations
- top banner remains inside safe area
- primary screens read clearly on simulator without clipped or crowded content

## Test Checklist

- `npm test`
- `npm run mobile:test`
- relevant simulator build/run flow
- screenshot capture for:
  - `Today` empty
  - `Today` ready
  - `Log` recommended-prefill
  - `Progress > Timeline`
  - `Progress > Load`

## Handoff Notes

- if any UI defect remains, document it with screenshot evidence and exact file ownership
