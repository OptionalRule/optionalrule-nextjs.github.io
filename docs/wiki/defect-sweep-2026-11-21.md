# Defect sweep, 2026-11-21

A one-pass discovery, one triage round and batched fixes, run from the [handoff](../superpowers/plans/2026-11-21-defect-sweep-handoff.md). The rows and their statuses are in the [ledger](../superpowers/plans/2026-11-21-defect-ledger.md). Decisions Q39–Q62 are in the [decision-log](decision-log.md).

## Discovery (base `cca9439`)
Nine read-only sweeps ran in parallel. Rows per sweep: A 0, B 16, C 8, D 6, E 16, F 8, G 20, H 19, I 8, plus 7 known items (K). That is 108 rows. Later, N1 and N2 were found during fixes.
- Sweep A (strict TS flags) found no new bugs. noUncheckedIndexedAccess reported 333 errors in prod and 940 in tests; exactOptionalPropertyTypes reported 102 and 127. All the production hits outside the generator were guarded.
- The worst user-visible finds: 7 sitemap tag URLs with spaces were 404s; `/search/` re-ran its search every 300 ms and its query couldn't be edited; the Torch Tracker clock lost time on re-render; 5 posts had broken links; `/test-pagination/` was live; two headings had the id `object-object`.

## Outcome (released 2026-11-22)
- Status counts: 92 fixed (including I5, I6 and N2), 1 partly fixed (I3), 10 deferred (including N1), 2 won't fix, 4 dup, 1 recorded.
- There were 5 worktree lanes (repo, features, site, ssg, tooling). A fresh general-purpose reviewer passed each one before it pushed. Reviewers caught a repo-lane README deletion that was out of scope, and two weak spots in the tooling lane (the audit key normalisation and the validate-config ignore).
- No generator output changed: the golden tests were untouched.
- Released: CI-green `95695aa` was merged to `main` as `5f422e8`, and deploy run 44972972890 succeeded. Checked live with curl: `/test-pagination/` returns 404, the sitemap tag URLs have no spaces, the styled 404 has the title "Page Not Found | Optional Rule", `#spells` exists, `places-of-power` has `rare-universal`, `-1`, `-2` and `-3`, and `/downloads/*` returns 200.
- Cleanup: 18 agent worktrees, their merged branches, `lane-a` and two stale dependabot branches were removed.

## Deferred
- v4 generator: D1, D2, D3, K1 (Q44), and D4 joins hook variety (Q45). See [worth-exploring-items](worth-exploring-items.md).
- B15 (unused `export`s, Q48), I8 (eslint 10, TS 7, @types/node 26 majors, Q54), H9 (draft placeholders, Q51), N1 (viewer moon layout with a wide companion, Q61).

## Notes for the next sweep
- Running all nine sweeps in parallel, with a merge agent writing the ledger, kept the coordinator's context small. Holding every lane until review passed caught 3 real problems.
- Some rows came only from reading the code (F4–F8). Requiring a failing test first confirmed all five.

See [ci](ci.md), [lane-brief-checklist](lane-brief-checklist.md).
