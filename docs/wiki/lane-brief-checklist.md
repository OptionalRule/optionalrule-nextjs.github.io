# Lane brief checklist (for dispatching worktree agents)

From the Lane B retro, 2026-11-21 (Asteroids #7 session).

- Agent worktrees may start on a stale base (Lane B's started on old main merge `3cc345d`). Every brief must say: "first run `git fetch origin && git reset --hard origin/develop` if your HEAD isn't based on origin/develop".
- Worktrees have no `node_modules`. Every brief must say: "symlink the main checkout's `node_modules` into the worktree" (the gitignore covers it).
- The worktree isolation guard rejects compound bash commands. Tell agents to run commands one at a time.
- happy-dom has no 2D canvas context. As of `75301fb`, canvas tests each stub `getContext` themselves. Candidate: a shared `src/test-utils` fake (no new dependency). Not done yet.
- Merges race between lanes: expect a non-fast-forward rejection, then fetch, rebase, retest and push again. Never force-push.

Alternative considered: a WorktreeCreate hook in settings to pin the base and link `node_modules`. Not applied; the user has not approved harness config changes.

See [index](index.md), [asteroids-engine](asteroids-engine.md).

## 2026-11-21 update (supersedes the first two bullets and the "Not applied" note above)
- `c202f29` added a committed `.claude/settings.json` with `worktree.baseRef: "head"` and `symlinkDirectories: ["node_modules"]`. Agent worktrees now branch from the main checkout's HEAD and get `node_modules` linked. This was verified: HEAD matched origin/develop, vitest was present, and the worktree was cleaned up afterwards.
- A WorktreeCreate hook was rejected because it replaces the built-in creation and loses auto-cleanup.
- Remaining caveat: `baseRef: head` does no fetch. Briefs only need: "confirm `git merge-base --is-ancestor origin/develop HEAD`". The main checkout must stay on develop and be pulled.
- 2026-11-21: the reviewer subagent type that was used had no shell, so it read files rather than `git diff`. Briefs should ask for a reviewer that has Bash (general-purpose), or should pass the commit range.
- 2026-11-21: Turbopack refuses to build in agent worktrees because `node_modules` is a symlink outside the worktree. Use `next build --webpack` there; CI is unaffected.
- 2026-11-21: when merging to `main`, merge the exact CI-green SHA from a temporary worktree, not the moving tip of `develop`.

## 2026-11-21 defect-sweep lessons
- Untracking a file (`git rm --cached`) in a lane deletes the main checkout's copy on the next `git pull`. Before pulling such a commit, back the file up and restore it afterwards (this was done for `.claude/settings.local.json`, `9eb815a`).
- After a lane deletes a route, stale `.next/types` from an earlier local build break `npm run typecheck` in that worktree. Delete `.next/` and rerun; CI is unaffected.
- Tell reviewers the expected commit trailer. One reviewer flagged the correct Opus trailer as wrong because it assumed its own model's trailer.
- Doc-fix lanes need "change only the stale claims". A README fix deleted about 50 lines of valid sections, and the reviewer caught it (restored in `1516e61`).
