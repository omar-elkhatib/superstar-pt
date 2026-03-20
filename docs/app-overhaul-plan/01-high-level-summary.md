# High-Level Summary

## Objective

Turn the current adaptive training app into a full daily decision-support loop:

- capture how the user feels today
- recommend the right activity for today
- log what the user actually did
- capture delayed outcome feedback 24 to 48 hours later
- turn that history into insights, metrics, and better recommendations over time

## Product Shape

The overhaul should not be treated as a single redesign project. It is a staged product build with three layers:

1. Core daily loop
2. Review and insight layer
3. Adaptive intelligence layer

## Recommended MVP

The MVP should stop after the core daily loop is reliable.

MVP includes:

- new home shell
- daily condition check-in
- rules-based daily recommendation
- fast activity logging
- delayed follow-up scheduling and completion
- local persistence for the full loop

MVP should exclude:

- voice and AI summaries
- advanced personalization
- clinician workflows
- complex predictive modeling

## Core Architectural Decision

Reuse the current load, tolerance, and recommendation logic where it helps, but restructure the UI before adding major functionality.

That means:

- split `mobile/App.js` into screens and domain modules
- expand local persistence into a unified schema
- keep recommendation logic rules-based until the app has enough historical data
- build history and dashboard only after the core loop produces trustworthy data

## Release Summary

### Release 1: Core Daily Loop

Primary outcome: the user can complete the full record -> recommend -> log -> follow-up cycle.

Epics:

- Epic 0: Foundation and App Shell
- Epic 1: Daily Condition Check-In
- Epic 2: Daily Recommendation
- Epic 3: Activity Logging
- Epic 4: Delayed Outcome Follow-Up

### Release 2: Review And Insight Layer

Primary outcome: the user can understand what has happened over time and plan with confidence.

Epics:

- Epic 5: History and Session Review
- Epic 6: Dashboard and Performance Metrics

### Release 3: Adaptive Intelligence Layer

Primary outcome: the app becomes easier to use and more relevant over time.

Epics:

- Epic 7: Voice Notes and AI Summaries
- Epic 8: Personalization and Recommendation Tuning

## Critical Delivery Principle

Do not build the intelligence layer before the app can reliably capture the underlying data loop. If delayed outcomes are weak or incomplete, voice and personalization will amplify noise instead of improving guidance.

## Definition Of Done Across The Plan

- business-value behavior is covered by tests
- UI changes include screenshot-based verification
- top feedback banners remain in the safe area
- persistence survives app relaunch
- empty and no-history states are explicit
- recommendations do not overstate certainty or imply diagnosis
