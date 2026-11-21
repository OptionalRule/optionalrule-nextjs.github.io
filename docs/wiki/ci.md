# CI on develop

- 2026-11-21 (Q21): `8515805` added `.github/workflows/ci.yml`. It runs lint and test jobs on Node 24 for pushes and PRs to `develop`, with `cancel-in-progress` concurrency.
- The first completed run was 44955941836 on `c5c1dff`: success in 2m42s, with 219 test files green. The star_system_generator golden hashes held on Node 24, which settles the Node 24/26 risk noted in [star-system-narrative-stage](star-system-narrative-stage.md).
- 2026-11-21, chief-of-staff decision: keep `cancel-in-progress`. When lanes push in bursts, only the last push gets a full run. That's acceptable because each lane runs its tests before pushing.
- Check runs with `gh run list --branch develop` (CLI only; the user is on SSH).
