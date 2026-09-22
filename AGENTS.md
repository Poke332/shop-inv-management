# Project: web-mobile-project (shop-inv-management)

Online store + integrated stock-management panel. Stack: React.js + Express.js + SQL + Tailwind CSS. This repo currently holds the frontend design/docs; the backend is planned, not yet built.

## Git branch & PR policy (STANDING — applies to all work, now and future)

`main` is **PR-protected** on origin (`https://github.com/Poke332/shop-inv-management`). You cannot push to `main` directly — every change must land through a pull request.

Rules for any git work in this repo:
1. **Never commit to or push `main` directly.** Always create a feature branch first.
2. Branch naming: `docs/<topic>`, `feat/<topic>`, `fix/<topic>` (lowercase, kebab-case).
3. Commit the change on that branch, push the branch to origin, then open a PR to `main` (`gh pr create`; a draft PR is acceptable).
4. **Scope the commit to the change.** Stage only the files relevant to the task; leave unrelated untracked files (scratch, working notes) alone.
5. **No force-push. Do not merge into `main` yourself.** The user opens/merges PRs and does the pushes — stop at a committed, verified branch and report that the PR still needs opening.

If git remote / `gh` auth is unavailable, stop at the committed feature branch and report it — never fall back to committing or pushing `main`.

> Note: a few early local `main` commits (the round-1 docs tree) predate this policy and are already local — that is a one-time pre-existing state. Going forward, all new changes are branch + PR.

## Inputs (do not modify)
- `COLORS-draft.md` — "Sunset Glow" palette (source of truth for color names).
- `Sheets-report.md` — requirements understanding of the `plan-web` Google Sheet (pages, RBAC, checkout flow, open decisions).
