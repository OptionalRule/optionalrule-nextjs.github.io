# Lane brief checklist (for dispatching worktree agents)

From the Lane B retro, 2026-11-21 (Asteroids #7 session).

- Agent worktrees may start on a stale base (Lane B's started on old main merge `3cc345d`). Every brief must say: "first run `git fetch origin && git reset --hard origin/develop` if your HEAD isn't based on origin/develop".
- Worktrees have no `node_modules`. Every brief must say: "symlink the main checkout's `node_modules` into the worktree" (the gitignore covers it).
- The worktree isolation guard rejects compound bash commands. Tell agents to run commands one at a time.
- happy-dom has no 2D canvas context. As of `75301fb`, canvas tests each stub `getContext` themselves. Candidate: a shared `src/test-utils` fake (no new dependency). Not done yet.
- Merges race between lanes: expect a non-fast-forward rejection, then fetch, rebase, retest and push again. Never force-push.

Alternative considered: a WorktreeCreate hook in settings to pin the base and link `node_modules`. Not applied; the user has not approved harness config changes.

See [index](index.md), [asteroids-engine](asteroids-engine.md).
