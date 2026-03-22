# Frozen Contracts

These contracts are fixed so multiple AI agents can work in parallel without reopening product or architecture decisions.

## Navigation

- Navigation library: React Navigation
- Top-level tabs:
  - `TodayTab`
  - `LogTab`
  - `ProgressTab`
- Stacks:
  - `TodayStack`
  - `LogStack`
  - `ProgressStack`
- Default tab: `TodayTab`

## Target File Layout

- `mobile/src/navigation/`
- `mobile/src/theme/`
- `mobile/src/components/ui/`
- `mobile/src/screens/today/`
- `mobile/src/screens/log/`
- `mobile/src/screens/progress/`
- `mobile/src/viewModels/`

## Ownership Boundaries

- `mobile/App.js`: `AI-0` only
- `mobile/package.json`: `AI-0` only
- `mobile/src/navigation/**`: `AI-0` only
- `mobile/src/theme/**`: `AI-1` primary owner
- `mobile/src/components/ui/**`: `AI-1` primary owner
- `mobile/src/screens/today/**`: `AI-3` primary owner
- `mobile/src/screens/log/**`: `AI-4` primary owner
- `mobile/src/screens/progress/**`: `AI-6` primary owner
- `mobile/src/viewModels/today*.mjs`: `AI-2` primary owner
- `mobile/src/viewModels/progress*.mjs`: `AI-5` primary owner

## Public Interfaces

### Today

Create:

```js
buildTodayScreenState({
  checkIns,
  entries,
  followUpTasks,
  recommendationSnapshots,
  templates,
  toleranceState,
  baselineProfile,
  nowIso
})
```

Return shape:

```js
{
  checkInCard,
  recommendationCard,
  followUpCard,
  weeklySummaryCard,
  onboarding
}
```

### Progress

Create:

```js
buildProgressSummary({
  entries,
  followUpTasks,
  loadSummary,
  recommendationSnapshots,
  nowIso
})
```

Return at minimum:

```js
{
  weeklySessionCount,
  riskLabel,
  summaryText,
  topJointLabel
}
```

Create:

```js
buildProgressTimeline({
  checkIns,
  recommendationSnapshots,
  entries,
  followUpTasks,
  templates,
  nowIso
})
```

Timeline item shape:

```js
{
  id,
  type, // "check_in" | "recommendation" | "session" | "follow_up"
  timestampIso,
  title,
  subtitle,
  detail,
  linkedEntityId
}
```

## Product Contracts

- `Today` owns:
  - current-day check-in
  - current-day recommendation hero
  - a single highest-priority follow-up card
  - a compact weekly summary teaser
- `Log` owns:
  - recommended/manual mode switch
  - session entry form
  - optional discomfort and notes rows
- `Progress` owns:
  - weekly summary header
  - `Timeline | Load` segmented control
  - unified timeline feed
  - load visualization
  - session detail drill-in

## Copy Contracts

- `Progress` summary format:
  - `This week: {n} sessions • {risk} load risk`
- `Follow-up completion` is not shown in the `Progress` header.

## Test ID Contracts

- `shell-tab-today`
- `shell-tab-log`
- `shell-tab-progress`
- `today-checkin-card`
- `today-recommendation-card`
- `today-followup-card`
- `log-mode-recommended`
- `log-mode-manual`
- `progress-summary`
- `progress-segment-timeline`
- `progress-segment-load`
- `progress-timeline-list`
- `progress-load-view`

## Non-Goals For This Overhaul

- changing recommendation logic semantics
- changing persistence schema unless required for non-breaking adapter support
- clinician workflows
- backend sync
- wearable integrations
