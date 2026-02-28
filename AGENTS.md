# AGENTS.md

## Engineering Workflow Rules

1. Run the test suite before starting any implementation work.
2. Implement or update tests before writing implementation code (test-first / TDD).
3. Ensure each test targets core business value and expected user outcomes, not only technical behavior.
4. After writing tests, run them and confirm they fail for the right reason before implementing.
5. Iterate on implementation and re-run tests until all relevant tests pass.
6. Do not consider work complete until tests pass and business-value expectations are covered by tests.

## Repo Testing Commands

1. Run root logic tests: `npm test`
2. Run mobile tests: `npm run mobile:test`
3. Run full mobile preflight before phone testing: `npm run mobile:verify`
4. Run both root + mobile tests together when needed: `npm run test:all`
5. Before iOS simulator tests, verify tooling: `xcodebuild -version && xcrun simctl list devices && pod --version`
6. Run iOS simulator unit-test validation to completion: `cd mobile/ios && xcodebuild test -workspace SuperstarPT.xcworkspace -scheme SuperstarPT -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ../.derived-data -only-testing:SuperstarPTTests`
7. Run automated iOS UI interaction + screenshots: `npm run ios:test:ui` (Release simulator run, no Metro required)

## Network Access Policy

1. Never use network access unless the user explicitly approves it in the current turn.
2. For any networked or escalated command (for example `npm install`, `npx`, `git push`, `git pull`, `curl`, `brew`), use Codex's built-in permission request flow directly.
3. Do not pause to ask the user for manual yes/no in chat before requesting tool permission.
4. Request one-time approval only for networked commands; do not request or rely on persistent approval rules.
