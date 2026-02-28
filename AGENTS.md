# AGENTS.md

## Engineering Workflow Rules

1. Run the test suite before starting any implementation work.
2. Implement or update tests before writing implementation code (test-first / TDD).
3. Ensure each test targets core business value and expected user outcomes, not only technical behavior.
4. After writing tests, run them and confirm they fail for the right reason before implementing.
5. Iterate on implementation and re-run tests until all relevant tests pass.
6. Do not consider work complete until tests pass and business-value expectations are covered by tests.

## Network Access Policy

1. Never use network access unless the user explicitly approves it in the current turn.
2. Before any networked command (for example `npm install`, `npx`, `git push`, `git pull`, `curl`, `brew`), ask for permission first.
3. Request one-time approval only for networked commands; do not request or rely on persistent approval rules.
