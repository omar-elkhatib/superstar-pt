# Workstream 06: Progress Screen

## Owner

- `AI-6`

## Goal

Implement the merged `Progress` destination with a simplified header, timeline tab, load tab, and session detail drill-in.

## Scope

- create `ProgressScreen`
- create `Timeline | Load` segmented control flow
- render simplified summary header
- render unified timeline list
- render load chart view
- create session detail screen or drill-in component

## Primary Touchpoints

- `mobile/src/screens/progress/**`

## Allowed Supporting Touchpoints

- light supporting adapters only if coordinated with `AI-5`

## Must Not Touch

- `mobile/App.js`
- `Today` or `Log` folders

## Dependencies

- `AI-1`
- `AI-5`
- shell registration from `AI-0`

## Deliverables

- `Progress` landing screen
- no repeated recommendation hero/history card inside `Load`
- session detail available from timeline session items

## Acceptance

- header contains only title, summary, and segment control
- timeline is the default subview
- load view focuses on chart plus risk context
- history and insights are no longer separate top-level tabs

## Tests

- add tests for:
  - default segment is timeline
  - load view excludes recommendation card content
  - session detail opens from a timeline session item

## Simulator Verification

- capture:
  - `Progress > Timeline`
  - `Progress > Load`
