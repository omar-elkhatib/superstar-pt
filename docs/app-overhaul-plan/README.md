# Adaptive Activity Coach Delivery Plan

This folder breaks the overhaul plan into execution-ready planning documents.

## Start Here

1. [High-Level Summary](./01-high-level-summary.md)
2. [Sequencing And Dependencies](./02-sequencing-and-dependencies.md)
3. Epic files under [`epics/`](./epics)
4. Story files under [`stories/`](./stories)

## Folder Map

- `01-high-level-summary.md`: product and delivery summary
- `02-sequencing-and-dependencies.md`: release order, dependency graph, critical path, and parallel work guidance
- `epics/`: one file per epic with scope, dependencies, and exit criteria
- `stories/`: one file per implementation-ready user story

## Recommended Release Sequence

- Release 1: Foundation, daily check-in, daily recommendation, activity logging, delayed follow-up
- Release 2: History, dashboard, weekly review, opportunity gaps
- Release 3: Voice notes, AI summaries, personalization tuning

## Current Repo Alignment

This plan assumes the team will preserve and extend existing logic in:

- `mobile/src/loadModel.mjs`
- `mobile/src/adaptivePlan.mjs`
- `mobile/src/historyStore.mjs`
- `mobile/src/sessionBrowser.mjs`
- `mobile/src/feedbackPolicy.mjs`

It also assumes `mobile/App.js` will be split into feature-oriented screens before major new UI surface area is added.
