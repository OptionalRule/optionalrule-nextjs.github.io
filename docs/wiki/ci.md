# CI on develop

- 2026-11-21 (Q21): `8515805` added `.github/workflows/ci.yml`. It runs lint and test jobs on Node 24 for pushes and PRs to `develop`, with `cancel-in-progress` concurrency.
- The first completed run was 44955941836 on `c5c1dff`: success in 2m42s, with 219 test files green. The star_system_generator golden hashes held on Node 24, which settles the Node 24/26 risk noted in [star-system-narrative-stage](star-system-narrative-stage.md).
- 2026-11-21, chief-of-staff decision: keep `cancel-in-progress`. When lanes push in bursts, only the last push gets a full run. That's acceptable because each lane runs its tests before pushing.
- Check runs with `gh run list --branch develop` (CLI only; the user is on SSH).
- 2026-11-21: `95d9c79`..`fd2faef` added `tsconfig.test.json` and made `npm run typecheck` check both the production and test configs, with its own CI `typecheck` job. 145+ test type errors were fixed with no `any` and no ts-ignore. Six tests had been importing star-system types from a wrong path, so their fixtures were silently untyped. One real (type-only) bug: `rehypeSanitize` didn't accept readonly schemas. Open: `BodyVisual.surface` is typed as required, but `Body.tsx` treats it as optional.
