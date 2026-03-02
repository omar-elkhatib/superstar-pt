---
name: github-pr-lifecycle
description: Create, inspect, and merge GitHub pull requests from an existing feature branch with the GitHub CLI. Use when a user asks to open a PR, update PR metadata, monitor CI/reviews, merge a PR, or confirm merge status before post-merge worktree cleanup.
---

# GitHub PR Lifecycle

## Overview

Open a pull request from the current feature branch, track its lifecycle, and complete merge cleanly. After merge, hand off deletion of local worktrees to `$git-worktree-lifecycle`.

## Preconditions

Check repository and CLI readiness:

```bash
git rev-parse --is-inside-work-tree
gh --version
gh auth status
git remote -v
```

If `gh auth status` fails, stop and ask the user to authenticate first.

## Gather PR Inputs

Collect or infer:

- `head_branch` (current branch unless user says otherwise)
- `base_branch` (default: `main`)
- PR title
- PR body content aligned to template sections:
  - `### Motivation`
  - `### Changes`
  - `### Testing`
  - visual evidence note when relevant

Use these checks:

```bash
git branch --show-current
git status --short
```

If there are uncommitted changes, ask before creating the PR.

## Create PR

1. Push branch upstream:

```bash
git push -u origin <head_branch>
```

2. Build PR body from template:

- If `.github/pull_request_template.md` exists, use it as the required scaffold.
- Fill each section with the gathered content before creating the PR.
- Keep the template headings unchanged.

3. Create the PR with a body file:

```bash
gh pr create --base <base_branch> --head <head_branch> --title "<title>" --body-file <path_to_filled_template>
```

Use `--draft` when requested.

## Inspect PR Status

Get canonical status and URL:

```bash
gh pr view --json number,state,isDraft,mergeStateStatus,headRefName,baseRefName,url
gh pr checks
```

Optional review summary:

```bash
gh pr view --comments
```

## Merge PR

After checks and approvals are complete, merge using requested strategy:

```bash
gh pr merge --squash --delete-branch
```

Alternative strategies:

```bash
gh pr merge --merge --delete-branch
gh pr merge --rebase --delete-branch
```

## Post-Merge Handoff

After merge succeeds:

1. Confirm merged state:

```bash
gh pr view --json state,mergedAt,url
```

2. Hand off local cleanup to `$git-worktree-lifecycle` with:
- `worktree_path`
- `head_branch`
- merged confirmation
