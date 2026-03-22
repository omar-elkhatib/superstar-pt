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

## Status Snapshot

Verified against the repo on `2026-03-22`.

Completed in repo:

- bottom-tab shell, route contracts, and safe-area root bootstrap exist
- shared theme tokens and reusable UI primitives exist
- `Today`, `Log`, and `Progress` screen implementations exist in dedicated feature folders
- adapter/view-model coverage exists for `Today`, `Log`, `Progress`, and shell contracts
- `npm test` and `npm run mobile:test` currently pass

Still open:

- finish live integration for `Today` so it reads real store data instead of falling back to default empty-state adapter output
- connect `Today` CTAs to the real check-in, onboarding, follow-up, and recommendation flows
- make `Log` consume the navigation params already emitted by `Today` for recommended-session handoff
- reconnect banner/haptic feedback state to the root host in `mobile/App.js`
- retire remaining legacy shell files after parity is confirmed
- rerun simulator/Maestro verification for the five overhaul screenshots after the integrated shell exists

Current verdict:

- workstreams `01` through `06` are effectively landed
- workstream `00` is partially complete because shell registration exists but the cross-screen wiring is not finished
- workstream `07` is not complete yet because the final screenshot-based verification must happen after integration

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

## Remaining Finish Order

1. `AI-0` completes the remaining integration wiring and legacy cleanup.
2. `AI-7` reruns regression checks and captures the required overhaul screenshots from the integrated build.

## Definition Of Done

- New shell uses bottom tabs with native-feeling screen structure.
- `Today` is the only screen showing the primary daily recommendation.
- `Progress` owns history and analytics; `Load` never repeats recommendation cards.
- Toast/banner renders inside safe area.
- Root and mobile tests pass.
- Cross-screen handoffs work end to end:
  - `Today` recommendation CTA opens `Log` in recommended mode with prefilled draft data
  - `Today` check-in, onboarding, and follow-up actions no longer depend on route-injected placeholder handlers
- Simulator screenshots exist for:
  - `Today` empty state
  - `Today` ready state
  - `Log` recommended-prefill state
  - `Progress > Timeline`
  - `Progress > Load`
