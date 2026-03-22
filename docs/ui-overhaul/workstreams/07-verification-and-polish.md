# Workstream 07: Verification And Polish

## Owner

- `AI-7`

## Goal

Verify the integrated overhaul after workstream `00` finishes the remaining live wiring, then produce the screenshot artifacts required for UI work.

## Current Status

Already true:

- logic and structural mobile tests already cover shell contracts, theme tokens, and the `Today`/`Log`/`Progress` screen models
- `npm test` and `npm run mobile:test` pass as of `2026-03-22`

Not yet sufficient:

- the overhaul still needs a final integrated pass before screenshot evidence is trustworthy
- existing screenshot artifacts under `mobile/.derived-data/` do not cleanly prove the required `Today`/`Log`/`Progress` acceptance states for the overhaul
- the current Linux Gas Town VM cannot run iOS simulator or Maestro screenshot verification, so this workstream stays pending locally

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

Execution note:

- on this Linux VM, limit the local outcome to logic-level verification and documentation of the simulator limitation

## Handoff Notes

- if any UI defect remains, document it with screenshot evidence and exact file ownership
