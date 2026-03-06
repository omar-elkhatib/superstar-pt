# Haptic Feedback Plan Handoff

## Goal
Add clear tactile and visual feedback for key user actions so users get immediate confirmation when navigating views and adding sessions.

## Scope
- Trigger haptics only for:
  - `view_change`
  - `session_added`
  - `session_validation_error`
- Show top banner for:
  - Session added (success)
  - Session validation errors (error)
- Keep banner inside safe visible area (no status bar/notch overlap).

## Implementation Approach
- Use `expo-haptics` for selection/success/error tactile patterns.
- Keep behavior centralized in a policy mapping module so UI calls one feedback pathway.
- Use a lightweight in-app banner with auto-dismiss timers.

## Implemented Files
- `mobile/src/feedbackPolicy.mjs` (event -> haptic/banner mapping)
- `mobile/src/hapticsClient.mjs` (safe haptics wrapper)
- `mobile/src/TopFeedbackBanner.js` (banner UI)
- `mobile/App.js` (wiring for view changes + add-session success/error)
- `mobile/test/feedbackPolicy.test.mjs` (policy unit tests)
- `mobile/.maestro/features/session-feedback.yaml` (feature flow + screenshots)
- `AGENTS.md` (rule: banners/toasts must be safe-area visible and simulator-verified)

## Validation Commands
- `npm test`
- `npm run mobile:test`
- `npm run ios:maestro:test:feature -- mobile/.maestro/features/session-feedback.yaml`

## Visual Verification Artifacts
- `mobile/.derived-data/maestro/features/session-feedback/artifacts/screenshots/session_feedback_success_banner.png`
- `mobile/.derived-data/maestro/features/session-feedback/artifacts/screenshots/session_feedback_error_banner.png`

## Current Status
- Changes are committed and pushed on `main`.
- Commit: `d79f163`
