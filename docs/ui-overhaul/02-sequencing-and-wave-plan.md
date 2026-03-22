# Sequencing And Wave Plan

## Current Status

Verified against the repo on `2026-03-22`.

- Wave `0` foundation is mostly complete: `mobile/App.js`, tab navigation, route contracts, and real screen registration exist.
- Wave `1` is complete: shared tokens/primitives and adapter work landed with tests.
- Wave `2` is complete: `Today`, `Log`, and `Progress` screen implementations landed in new feature folders.
- Wave `3` is still open: the cross-screen and root-level wiring is incomplete.
- Wave `4` is still pending: screenshot-based verification must be rerun on the integrated shell.

## Remaining Critical Path

1. Wire `Today` to live `appHistoryStore` data instead of the default fallback state.
2. Replace route-injected placeholder handlers for check-in, onboarding, and follow-up actions with real flows.
3. Make `Log` honor the recommended-session params emitted by `Today`.
4. Reconnect feedback events to the banner/haptic host at the app root.
5. Remove or retire unused legacy shell modules after replacement parity is confirmed.
6. Run the post-integration verification pass and regenerate the required screenshots.

## Wave 0: Setup And Contract Lock

Owner:

- `AI-0`

Deliverables:

- new folder structure
- navigation dependency installation
- placeholder tab shell
- contract confirmation in code comments or module exports

Blocks:

- all screen implementation work from landing cleanly

Can run in parallel with:

- `AI-1`, `AI-2`, `AI-5` can start on new files as long as they do not edit `App.js`

Status:

- complete enough to unblock the rest of the overhaul
- still leaves final integration ownership with `AI-0`

## Wave 1: Foundations In Parallel

Owners:

- `AI-1`: shared UI kit
- `AI-2`: Today state adapters
- `AI-5`: Progress state adapters

Entry criteria:

- folder layout exists
- route names are frozen

Exit criteria:

- shared primitives exist
- Today state builder exists and is tested
- Progress summary/timeline builders exist and are tested

Status:

- complete

## Wave 2: Primary Screens In Parallel

Owners:

- `AI-3`: Today screen
- `AI-4`: Log screen
- `AI-6`: Progress screen + session detail

Entry criteria:

- Wave 1 merged or at least available in branches

Exit criteria:

- each screen compiles in isolation
- each screen uses owned adapters/primitives
- each screen ships with tests

Status:

- complete

## Wave 3: Integration

Owner:

- `AI-0`

Deliverables:

- replace `Today` fallback state with live store-backed state
- wire `Today` actions into real check-in, onboarding, follow-up, and progress flows
- make `Log` consume `Today`'s recommended-session handoff params
- reconnect feedback banner/haptic state at the root
- delete dead wrappers only after replacement is working

Acceptance:

- `Today` reflects current check-ins, recommendations, follow-ups, and onboarding baseline from the store
- `Today` no longer depends on route-only callback injection for core actions
- the recommended-session CTA opens `Log` with the matching draft visible
- success and error feedback can surface through the top banner without overlapping the safe area

## Wave 4: Verification And Polish

Owner:

- `AI-7`

Deliverables:

- regression tests
- simulator screenshots
- safe-area banner verification
- accessibility and content-density cleanup

Status:

- pending Wave `3`
- cannot be executed from the current Linux Gas Town VM, so the plan must treat this as a follow-up on macOS/simulator tooling

## Merge Strategy

- Merge low-conflict infrastructure first.
- Do not let screen agents modify each other’s folders.
- Route registration is already in place; remaining integration work is data/action wiring.
- If a shared contract must change, `AI-0` owns that decision and rebases downstream branches.

## Remaining Worker Order

- `AI-0` integration and legacy cleanup
- `AI-7` verification after the integrated build exists
