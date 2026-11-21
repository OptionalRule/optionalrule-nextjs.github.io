# Graphify tooling

- 2026-11-21: `npm run graph:update` found 0 files under graphify 0.8.32. Cause: rules starting with `/` are matched with `fnmatch`, where `*` also matches `/`. So `/*` ignored every nested path, and `!/src/` re-included only the `src` directory itself, not its contents. Fixed in `2bc8778` by adding `!/src/**`. The graph then held about 3.2k–3.6k nodes, all `.ts`/`.tsx` under `src/`.
- Lesson: after upgrading graphify, run `graph:update` and check the node count is non-zero. Subagents had silently fallen back to grep.

See [index](index.md).
