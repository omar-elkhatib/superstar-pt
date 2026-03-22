# Native iOS Re-Shell With Simulator-Backed Wireframes

## Summary

- The redesign targets a native iOS tab shell with `Today`, `Log`, and `Progress`.
- The host has Xcode and iOS simulator runtimes available, so the implementation phase can use simulator screenshots for wireframes and UI verification.
- The `Progress` header should be simplified: remove the three-metric strip and use one calm weekly summary plus a segmented control.

## Updated UX Direction

- `Today` remains the default landing tab and owns the daily loop.
- `Log` is a dedicated entry flow, not a dumping ground of all controls.
- `Progress` merges history and insights, but its top area stays quiet and readable.

## Simplified Progress Header

- Replace:
  - `7d Sessions | Risk | Follow-up`
  - numeric values beneath
- With:
  - Large title: `Progress`
  - One summary line/card: `This week: 5 sessions • Moderate load risk`
  - Segmented control below: `Timeline | Load`
- Move follow-up completion out of the header.
- Surface follow-up completion lower in the screen as a secondary summary card only if useful.

## Revised Screen Sketches

```text
TODAY
┌──────────────────────────────┐
│ Today                        │
│ Your morning status      Edit│
│ Pain 4   Ready 6   Fatigue 3 │
│──────────────────────────────│
│ Today's plan                 │
│ Base training                │
│ Keep volume steady today     │
│ Risk: Moderate on knee       │
│ [Log this plan]  [Skip]      │
│──────────────────────────────│
│ Follow-up due                │
│ Walking · due in 2h          │
│ [Complete follow-up]         │
│──────────────────────────────│
│ This week                    │
│ 5 sessions • load stable  >  │
│                              │
│ Today        Log     Progress│
└──────────────────────────────┘
```

```text
LOG
┌──────────────────────────────┐
│ Log Session                  │
│ [Recommended]   Manual       │
│──────────────────────────────│
│ Activity                 Walk│
│ Variant                  Base│
│ Duration                 20m │
│ Effort                   4/10│
│ Completion            Complete│
│──────────────────────────────│
│ Add discomfort feedback   >  │
│ Notes                     >  │
│──────────────────────────────│
│         [Save Session]       │
└──────────────────────────────┘
```

```text
PROGRESS / TIMELINE
┌──────────────────────────────┐
│ Progress                     │
│ This week: 5 sessions •      │
│ Moderate load risk           │
│ [Timeline]        Load       │
│──────────────────────────────│
│ Today · Recommendation       │
│ Hold progression today       │
│──────────────────────────────│
│ Yesterday · Session          │
│ Walking · 20m · effort 4     │
│──────────────────────────────│
│ 2d ago · Follow-up           │
│ Improved function            │
│──────────────────────────────│
│ 3d ago · Check-in            │
│ Pain 3 · Ready 7 · Fatigue 2 │
│──────────────────────────────│
│ Today        Log     Progress│
└──────────────────────────────┘
```

```text
PROGRESS / LOAD
┌──────────────────────────────┐
│ Progress                     │
│ This week: 5 sessions •      │
│ Moderate load risk           │
│ Timeline          [Load]     │
│──────────────────────────────│
│ Load over time               │
│ ▁▂▃▂▄▅  total                │
│ ▁▁▂▂▃▃  knee                 │
│──────────────────────────────│
│ Risk guide                   │
│ Low · Medium · High          │
│ Top joint: Knee              │
│──────────────────────────────│
│ Today        Log     Progress│
└──────────────────────────────┘
```

## Simulator-Backed Wireframe Deliverable

- In implementation, build the new shell in-app rather than drawing separate mock assets.
- Use the iOS simulator to capture reviewable wireframes for:
  - `Today` empty state
  - `Today` post-check-in state
  - `Log` recommended-prefill state
  - `Progress > Timeline`
  - `Progress > Load`
- Treat those screenshots as the design wireframes and verification artifacts.

## Public Interfaces / Structural Changes

- Add React Navigation tab + stack structure:
  - `TodayStack`
  - `LogStack`
  - `ProgressStack`
- Replace the current custom shell in `mobile/src/appShellModel.mjs`.
- Add derived state builders:
  - `buildTodayScreenState(...)`
  - `buildProgressTimeline(...)`
  - `buildProgressSummary(...)`
- Keep existing persistence entities in `mobile/src/historyStore.mjs` and existing recommendation logic in `mobile/src/adaptivePlan.mjs`.

## Implementation Plan

### Phase 1

- Reduce `mobile/App.js` to app bootstrap, providers, navigator, and toast host.
- Add React Navigation plus safe-area support.
- Create `navigation/`, `theme/`, `screens/today/`, `screens/log/`, `screens/progress/`, and shared `components/`.

### Phase 2

- Build `TodayScreen` around existing daily state from `mobile/src/checkInModel.mjs` and recommendation output from `mobile/src/adaptivePlan.mjs`.
- Convert onboarding baseline into a first-run modal flow.
- Condense follow-up inbox to the single next action.

### Phase 3

- Rebuild `LogScreen` with grouped rows and sheets while preserving recommendation-link behavior from `mobile/src/recommendationLogging.mjs`.
- Keep recommended-session prefill from `Today`.

### Phase 4

- Build `ProgressScreen` with derived summary cards, timeline feed, and load tab.
- Move session detail off the main list into `SessionDetailScreen`.

### Phase 5

- Fix safe-area toast placement.
- Add empty-state polish, accessibility labeling, and screenshot-based verification on a macOS/iOS-capable host.

## Test Cases And Acceptance

- Logic:
  - `Today` shows one recommendation surface only.
  - `Progress` timeline merges check-ins, recommendations, sessions, and follow-ups newest-first.
  - `Progress > Load` never shows recommendation cards.
  - Simplified `Progress` header renders a single summary string, not three separate KPI columns.
- UI verification:
  - Simulator screenshots for all primary screens listed above.
  - Safe-area verification for the top banner/toast.
  - Regression check that duplicated recommendation/history content is removed.

## Assumptions And Defaults

- Default `Progress` summary copy format: `This week: {n} sessions • {risk} load risk`.
- `Follow-up completion` is removed from the header entirely.
- Wireframes will be produced as in-app simulator screenshots during implementation, not as separate Figma-style static comps.
- If simulator/build commands need host-level access beyond the sandbox, request one-time permission when executing them.
