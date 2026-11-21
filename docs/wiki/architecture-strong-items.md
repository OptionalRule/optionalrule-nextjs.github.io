# Architecture: six Strong candidates

Source: architecture review at `b18e4aa`, 2026-11-21 (`/tmp/architecture-review-20261121-141419.html`, handoff `/tmp/handoff-architecture-strong-items-20261121.md`; both in /tmp and may vanish).

| # | Candidate | Area | Status (2026-11-21) |
|---|-----------|------|---------------------|
| 2 | Narrative stage carve-out | star_system_generator | landed `bbde3b7` |
| 1 | Narrative Domain vocabulary module (additive) | star_system_generator | landed `7eb3276` |
| 3 | Delete `graphAware` | star_system_generator | landed `f2e04c8` |
| 6 | Asteroids collision outcomes in one module | asteroids | landed `fd147dc` |
| 7 | Asteroids Game rules core on simulated time | asteroids | landed `75301fb` |
| 8 | KCD2 filter view module | kcd2_alchemy | landed `31e8257` |

Lanes: A = 2→1→3, B = 6→7, C = 8. Lanes are independent.

Constraints: ADR-0001 (seed is the save file) — any generator-output change for existing seeds needs a user decision and ADR.

Decisions: [decision-log](decision-log.md).
