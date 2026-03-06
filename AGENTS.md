# AGENTS.md

## UI Verification Requirement (Top-Level)

1. For any UI-impacting change, include screenshot-based verification checks (iOS simulator screenshots and/or Maestro screenshot assertions) to confirm the UI behaves and renders as intended before completion.

## Engineering Workflow Rules

1. Run the test suite before starting any implementation work.
2. Implement or update tests before writing implementation code (test-first / TDD).
3. Ensure each test targets core business value and expected user outcomes, not only technical behavior.
4. After writing tests, run them and confirm they fail for the right reason before implementing.
5. Iterate on implementation and re-run tests until all relevant tests pass.
6. Do not consider work complete until tests pass and business-value expectations are covered by tests.
7. For top banners/toasts, render within the device safe-area visible region and verify with iOS simulator screenshots/Maestro assertions before completion.

## Repo Testing Commands

1. Run root logic tests: `npm test`
2. Run mobile tests: `npm run mobile:test`
3. Run full mobile preflight before phone testing: `npm run mobile:verify`
4. Run both root + mobile tests together when needed: `npm run test:all`
5. Before iOS simulator tests, verify tooling: `xcodebuild -version && xcrun simctl list devices && pod --version`
6. Run iOS simulator unit-test validation to completion: `cd mobile/ios && xcodebuild test -workspace SuperstarPT.xcworkspace -scheme SuperstarPT -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ../.derived-data -only-testing:SuperstarPTTests`
7. Run iOS Maestro E2E session end-to-end: `npm run e2e:maestro` (prepare, test, teardown)
8. Run Maestro prepare only: `npm run ios:maestro:prepare`
9. Run Maestro test only: `npm run ios:maestro:test`
10. Run Maestro teardown only: `npm run ios:maestro:teardown`

## Network Access Policy

1. Never use network access unless the user explicitly approves it in the current turn.
2. For any networked or escalated command (for example `npm install`, `npx`, `git push`, `git pull`, `curl`, `brew`), use Codex's built-in permission request flow directly.
3. Do not pause to ask the user for manual yes/no in chat before requesting tool permission.
4. Request one-time approval only for networked commands; do not request or rely on persistent approval rules.

## GitHub CLI in Codex

1. Authenticate in your host terminal first: `gh auth login -h github.com`.
2. In Codex, run `gh` commands with elevated permissions so host keychain + network access are available.
3. Use one-time approval for each networked `gh` command.
4. Verify auth before PR actions: `gh auth status -h github.com` and `gh api user -q .login`.
5. Create PRs from a branch ahead of `main`: `gh pr create --base main --head <branch> --draft --fill`.
6. If `gh` reports invalid token without elevation, rerun the same command with elevated permissions.
