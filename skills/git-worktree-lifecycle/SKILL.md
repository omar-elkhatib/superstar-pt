---
name: git-worktree-lifecycle
description: Create, inspect, and clean up Git worktrees with predictable branch handling. Use when a user asks to set up parallel feature branches, "get/list current worktrees", create a named branch in a new worktree, or remove worktrees after a pull request is merged.
---

# Git Worktree Lifecycle

## Overview

Create a clean feature worktree from a chosen base branch, keep branch naming explicit, and remove the worktree safely after merge. Prefer non-interactive Git commands and show the exact commands before running destructive cleanup.

## Quick Checks

Run these before creating or removing worktrees:

```bash
git rev-parse --is-inside-work-tree
git status --short
git worktree list
```

Require user confirmation before force-removing dirty worktrees.

## Worktree Location Policy

Place worktrees outside the repository in a sibling directory, not inside the repo and not under `.git`.
If the repo is `/Users/omarelkhatib/Sandbox/superstar-pt`, a valid worktree path is `/Users/omarelkhatib/Sandbox/<worktree-name>` (for example, `/Users/omarelkhatib/Sandbox/my-worktree`).

- Preferred root: `../<worktree-name>` (repo sibling)
- Example path: `../my-worktree`
- Reject paths like `.worktrees/<name>` or `.git/...` unless the user explicitly asks for that location.

## List or Get Worktrees

Use one of the following depending on how much detail is needed:

```bash
git worktree list
git worktree list --porcelain
```

For a branch-specific check:

```bash
git worktree list --porcelain | rg "branch refs/heads/<branch-name>|worktree "
```

## Create Worktree With User-Chosen Branch

1. Confirm inputs: `base_branch`, `new_branch`, `worktree_path`.
2. Require explicit branch name from the user; do not invent one unless asked.
3. Default the worktree to a sibling directory when values are missing:
`base_branch=main`
`worktree_path=../<new-branch>`
4. Create the worktree and branch:

```bash
git fetch origin <base_branch>
git worktree add -b <new_branch> <worktree_path> origin/<base_branch>
```

If the branch already exists locally, attach instead of creating:

```bash
git worktree add <worktree_path> <new_branch>
```

Then verify:

```bash
git -C <worktree_path> branch --show-current
git -C <worktree_path> status --short
```

## Development Handoff

After implementation and tests pass in the worktree:

1. Commit changes on the feature branch.
2. Hand off to `$github-pr-lifecycle` to push and open the PR.

## Remove Worktree After Merge

Run cleanup only after confirming the PR is merged.

1. Confirm merge state (typically from `$github-pr-lifecycle`).
2. Remove the worktree:

```bash
git worktree remove <worktree_path>
```

3. Delete merged local branch from the main checkout:

```bash
git branch -d <new_branch>
```

4. Prune stale worktree metadata:

```bash
git worktree prune
```

Use `git worktree remove --force` or `git branch -D` only with explicit user approval.
