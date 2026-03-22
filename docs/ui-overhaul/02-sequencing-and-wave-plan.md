# Sequencing And Wave Plan

## Critical Path

1. Shell and navigation foundation
2. Shared UI kit and fixed contracts
3. Today/Progress adapters
4. Screen implementations
5. Final integration and legacy shell removal
6. Simulator screenshots and regression verification

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

## Wave 3: Integration

Owner:

- `AI-0`

Deliverables:

- wire screens into navigators
- remove legacy top-toggle shell
- delete dead wrappers only after replacement is working
- ensure toast host and safe area placement are correct

## Wave 4: Verification And Polish

Owner:

- `AI-7`

Deliverables:

- regression tests
- simulator screenshots
- safe-area banner verification
- accessibility and content-density cleanup

## Merge Strategy

- Merge low-conflict infrastructure first.
- Do not let screen agents modify each other’s folders.
- Route registration happens once in the integration wave.
- If a shared contract must change, `AI-0` owns that decision and rebases downstream branches.

## Recommended Worker Start Order

Day 1:

- `AI-0`
- `AI-1`
- `AI-2`
- `AI-5`

Day 2:

- `AI-3`
- `AI-4`
- `AI-6`

Day 3:

- `AI-0` integration
- `AI-7` verification after the integrated build exists
