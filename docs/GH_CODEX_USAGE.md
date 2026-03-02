# Using `gh` In Codex (Secure + Reliable)

1. Keep your normal `gh` login in your host terminal (`gh auth login -h github.com`).
2. In Codex, run `gh` commands with elevated permissions so the command can access host keychain + network.
3. Prefer one-time approval per networked command.
4. Verify auth before PR work:
   - `gh auth status -h github.com`
   - `gh api user -q .login`
5. Create PRs from a branch with commits ahead of `main`:
   - `gh pr create --base main --head <branch> --draft --fill`
6. If Codex reports invalid token without elevation, re-run the same `gh` command with elevated permissions.
