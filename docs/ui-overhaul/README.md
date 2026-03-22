# UI Overhaul Execution Pack

This directory breaks the UI overhaul into parallelizable implementation workstreams for a team of AI agents.

## Goal

Ship a native-feeling iOS shell with three top-level destinations:

- `Today`
- `Log`
- `Progress`

The redesign must:

- remove the current top button shell
- eliminate duplicated recommendation/history content across screens
- preserve the existing recommendation, persistence, load, and follow-up logic
- produce simulator screenshots for the new primary screens before completion

## Recommended Team Shape

- `AI-0`: Integrator / shell owner
- `AI-1`: Shared UI kit + theme tokens
- `AI-2`: Today state adapters
- `AI-3`: Today screen
- `AI-4`: Log screen
- `AI-5`: Progress state adapters
- `AI-6`: Progress screen + session detail
- `AI-7`: Verification, tests, screenshots, polish

## Critical Rules

- Only `AI-0` edits `mobile/App.js`, `mobile/package.json`, or navigation registration files once they exist.
- Screen agents should build in new feature folders and avoid broad edits to shared legacy files.
- Existing domain modules are preserved unless a workstream explicitly calls for adapter changes.
- Screenshot verification on the iOS simulator is required for any UI-impacting task.
- Each workstream must land with tests that cover user-visible behavior, not only implementation details.

## Directory Map

- [01-frozen-contracts.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/01-frozen-contracts.md): route names, file ownership, public interfaces, and non-negotiable implementation rules
- [02-sequencing-and-wave-plan.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/02-sequencing-and-wave-plan.md): dependency order and merge plan
- [00-integrator-and-shell.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/00-integrator-and-shell.md): shell, navigation, bootstrap, integration
- [01-shared-ui-kit.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/01-shared-ui-kit.md): tokens, screen scaffolds, reusable UI primitives
- [02-today-state-adapters.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/02-today-state-adapters.md): `Today`-specific derived state
- [03-today-screen.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/03-today-screen.md): `Today` UI and interactions
- [04-log-screen.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/04-log-screen.md): `Log` UI and interaction rebuild
- [05-progress-state-adapters.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/05-progress-state-adapters.md): progress summary and timeline models
- [06-progress-screen.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/06-progress-screen.md): `Progress` UI, timeline, load tab, session detail
- [07-verification-and-polish.md](/Users/omarelkhatib/Sandbox/superstar-pt/docs/ui-overhaul/workstreams/07-verification-and-polish.md): cross-cutting validation, screenshots, regressions, safe area

## Suggested Merge Order

1. `AI-0` lands shell skeleton and folder structure.
2. `AI-1`, `AI-2`, and `AI-5` land in parallel.
3. `AI-3`, `AI-4`, and `AI-6` land on top of those foundations.
4. `AI-0` performs final integration and removes the legacy shell.
5. `AI-7` finishes regression tests, simulator screenshots, and polish fixes.

## Definition Of Done

- New shell uses bottom tabs with native-feeling screen structure.
- `Today` is the only screen showing the primary daily recommendation.
- `Progress` owns history and analytics; `Load` never repeats recommendation cards.
- Toast/banner renders inside safe area.
- Root and mobile tests pass.
- Simulator screenshots exist for:
  - `Today` empty state
  - `Today` ready state
  - `Log` recommended-prefill state
  - `Progress > Timeline`
  - `Progress > Load`
