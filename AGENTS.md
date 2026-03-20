# AGENTS.md

## UI Verification Requirement (Top-Level)

1. For any UI-impacting change, include screenshot-based verification checks (iOS simulator screenshots and/or Maestro screenshot assertions) to confirm the UI behaves and renders as intended before completion.
2. In the current Linux Gas Town VM, do not attempt to resolve `mobile:verify`, Expo CLI doctor failures, iOS bundle checks, simulator validation, or Maestro screenshot flows. Those toolchains are unavailable here, so agents must record the limitation and continue with logic-level verification only.

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
   Do not treat this as actionable in the current Linux Gas Town VM; `expo`, iOS simulator tooling, and Maestro UI verification are unavailable here.
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

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:d4f96305 -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
