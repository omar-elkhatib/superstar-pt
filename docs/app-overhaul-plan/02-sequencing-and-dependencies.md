# Sequencing And Dependencies

## Dependency Rules

- Epic 0 is the foundation for the rest of the plan
- Epic 1 must exist before Epic 2 can generate a meaningful daily recommendation
- Epic 2 and Epic 3 together form the usable daily loop
- Epic 4 is required before personalization becomes credible
- Epic 5 and Epic 6 depend on stable data from Epics 1 through 4
- Epic 7 can begin only after the follow-up flow is stable enough to attach richer notes
- Epic 8 should come last because it depends on repeated history and outcome quality

## Epic Dependency Map

- Epic 0 -> Epics 1, 2, 3, 4, 5, 6, 7, 8
- Epic 1 -> Epic 2, Epic 5, Epic 6, Epic 8
- Epic 2 -> Epic 3, Epic 5, Epic 8
- Epic 3 -> Epic 4, Epic 5, Epic 6, Epic 7, Epic 8
- Epic 4 -> Epic 5, Epic 6, Epic 7, Epic 8
- Epic 5 -> Epic 6, Epic 8
- Epic 6 -> Epic 8
- Epic 7 -> Epic 8

## Critical Path

1. E0-S1 Home navigation shell
2. E0-S2 Unified data model and persistence
3. E1-S1 Morning check-in flow
4. E2-S1 Generate today's recommendation
5. E3-S1 Log a recommended activity quickly
6. E4-S1 Create follow-up tasks after activity logging
7. E4-S2 Complete a lightweight delayed feedback check-in
8. E5-S1 Unified timeline
9. E6-S1 Top-line health and performance metrics
10. E8-S1 Learn from repeated outcomes

## Parallel Work Guidance

These can happen in parallel after Epic 0 is underway:

- E1-S3 Missing check-in prompt can run alongside E1-S1
- E2-S2 Recommendation rationale can run alongside E2-S1
- E3-S2 Immediate discomfort and notes can run alongside E3-S1
- E4-S3 Follow-up inbox can run alongside E4-S2 once follow-up records exist
- E5-S3 History filters can run after timeline structure is in place
- E6-S3 Weekly review can run after basic metric aggregation exists

These should not run early:

- E7-S2 and E7-S3 should not start before voice-note storage and review states exist
- E8-S2 and E8-S3 should not start before E8-S1 has real learning signals to expose

## Release Gates

### Gate 1: Core Loop Ready

Required:

- navigation shell exists
- unified persistence schema exists
- daily check-in works
- recommendation is generated and stored
- activity logging works from recommendation
- delayed follow-up can be scheduled and completed
- screenshots and Maestro flow cover the core loop

### Gate 2: Review Layer Ready

Required:

- unified timeline exists
- session detail chain exists
- top-line metrics exist
- dashboard empty states and history states are verified

### Gate 3: Adaptive Layer Ready

Required:

- voice capture and editable summaries work
- structured insight extraction is reviewable
- personalization logic uses repeated outcomes
- learning explanations are visible and grounded in history

## Suggested Sprint Sequence

### Sprint 0

- E0-S1 Home navigation shell
- E0-S2 Unified data model and persistence

### Sprint 1

- E1-S1 Morning check-in flow
- E1-S3 Missing check-in prompt
- E2-S1 Generate today's recommendation

### Sprint 2

- E1-S2 Edit today's check-in
- E2-S2 Recommendation rationale and cautions
- E3-S1 Log a recommended activity quickly
- E3-S2 Record immediate discomfort, mistakes, and notes

### Sprint 3

- E2-S3 Recommendation adherence tracking
- E3-S3 Log a custom activity
- E4-S1 Create follow-up tasks after activity logging
- E4-S2 Complete a lightweight delayed feedback check-in
- E4-S3 Follow-up inbox and reminders

### Sprint 4

- E5-S1 Unified timeline
- E5-S2 Session detail with outcome chain
- E5-S3 History filters

### Sprint 5

- E6-S1 Top-line health and performance metrics
- E6-S2 Opportunity gaps and missing blocks
- E6-S3 Weekly review snapshot

### Sprint 6+

- E7-S1 Record a voice note
- E7-S2 Review and edit transcript summary
- E7-S3 Extract structured insights from voice
- E8-S1 Learn from repeated outcomes
- E8-S2 Show what the app has learned
- E8-S3 Recommendation feedback controls

## MVP Cut Line

Everything through Epic 4 is the MVP cut line.

If scope must be reduced further, de-scope in this order:

1. E0-S3 Lightweight onboarding baseline
2. E2-S3 Recommendation adherence tracking
3. E3-S3 Log a custom activity
4. E4-S3 Follow-up inbox and reminders

Do not cut:

- E0-S2 Unified data model and persistence
- E1-S1 Morning check-in flow
- E2-S1 Generate today's recommendation
- E3-S1 Log a recommended activity quickly
- E4-S1 and E4-S2 follow-up loop
