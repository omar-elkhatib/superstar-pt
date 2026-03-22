# Workstream 00: Integrator And Shell

## Owner

- `AI-0`

## Goal

Create the new app shell and keep the repo mergeable while other agents work in parallel.

## Scope

- add navigation dependencies
- reduce `mobile/App.js` to bootstrap, providers, toast host, and navigator
- create bottom tabs and empty stacks
- create placeholder screen exports for `Today`, `Log`, `Progress`
- own final integration and legacy shell removal

## Primary Touchpoints

- `mobile/package.json`
- `mobile/App.js`
- `mobile/src/navigation/**`
- `mobile/src/TopFeedbackBanner.js`

## Must Not Touch

- detailed screen implementation in other agents’ folders beyond minimal registration

## Dependencies

- none to start

## Blocks

- final integration for all other workstreams

## Deliverables

- navigable three-tab shell
- safe-area-aware root layout
- route registration for all final screens
- deletion or retirement of `mobile/src/appShellModel.mjs` after replacement

## Acceptance

- app opens on `TodayTab`
- no top toggle row remains
- tab navigation works without resetting unrelated screen state
- banner host remains visible and non-overlapping

## Tests

- update shell tests to assert new tab contract instead of legacy view toggle behavior

## Handoff Notes

- publish exact route names and exported screen names once merged
