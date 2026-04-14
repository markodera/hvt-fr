# Contributing to HVT Dashboard

## Scope

This repository contains the React frontend for HVT: the marketing site, authenticated dashboard, and runtime playground. Backend changes belong in the sibling `../hvt` repository unless the work is strictly frontend-only.

## Before You Start

1. Open an issue or discussion for non-trivial work so the change has an agreed direction before implementation.
2. Keep pull requests focused. Small, reviewable changes merge faster than wide refactors.
3. Do not commit local environment files, generated assets, or real API keys.

## Development Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Point `VITE_API_URL` at a running HVT backend, usually `http://localhost:8000`.

## Quality Bar

Before opening a pull request:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Verify the affected flows manually in the browser when UI behavior changes.
4. Update documentation when behavior, setup, or contributor expectations change.

## Pull Request Guidelines

1. Describe the user-facing impact and any backend dependency clearly.
2. Include screenshots or short recordings for meaningful UI changes.
3. Call out follow-up work or known limitations instead of leaving them implicit.
4. Avoid unrelated formatting churn in feature PRs.

## Commit Hygiene

- Use clear commit messages with the intent of the change.
- Keep secrets out of git history.
- Preserve existing user changes in the worktree unless explicitly asked to rewrite them.

## Questions

If you are unsure whether a change belongs here or in another HVT repo, open a discussion first and link the affected repositories.
