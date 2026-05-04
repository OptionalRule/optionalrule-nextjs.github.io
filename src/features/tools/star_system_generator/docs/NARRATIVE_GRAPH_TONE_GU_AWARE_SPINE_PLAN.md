# Narrative Graph: Input-Aware Output (Tone / GU / Distribution / Settlements) — Master Plan

> **For agentic workers:** This is a master overview. The actual executable work lives in the four per-phase detail plans (A, B, C, D) linked in the Phases table below. Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` against the per-phase docs.

**Status:** Original Option-A plan rewritten as a 4-phase sequence after a team review (4 parallel reviewers: generation-quality, completeness, architecture, adversarial) found that the single-phase Option A plan solved the wrong problem at the wrong layer. See "Why this isn't shipped as the original Option A" below.

---

## Goal

Modulate the star system generator's narrative output along all four user input axes — `tone` (`balanced` / `astronomy` / `cinematic`), `gu` (`low` / `normal` / `high` / `fracture`), `distribution` (`frontier` / `realistic`), and `settlements` (`sparse` / `normal` / `crowded` / `hub`) — to the point where a GM reading two systems generated with different inputs feels like they got two different products, not "the same system with the names rotated."

The bar is **best-in-breed, sourcebook-quality output** that earns the four input controls displayed in the UI. Today those controls produce visually-identical body[0] paragraphs in 15+/20 sampled systems (`PHASE_7_SAMPLE_REVIEW.md`). The end state of this sequence is that the same 20-sample review reads as 20 distinct systems whose differences trace back to the input axes.

---

## Architecture

A 4-phase sequence, ordered by leverage and dependency. Each phase is independently shippable. Phases B, C, D could in principle ship in any order after Phase A, but the recommended order maximizes user-visible quality per week of work.

```
A (plumbing + structural gate fix)
  │
  ├─► B (per-tone faction generation)        ← highest single-phase leverage
  │
  ├─► C (per-tone voice + per-tone era pools)  ← finishes the "reads different" win
  │
  └─► D (distribution + density axes)        ← extends the same channel to the last 2 axes
```

Phase A is gating: it builds the threading channel (`BuildGraphOptions`) that B/C/D rely on, AND fixes a structural gate in `score.ts` that today causes most "tone bias" attempts to be no-ops. Without A, the most promising weights are dead letters.

Phases B, C, D are logically independent of each other. They can be sequenced for engineering convenience.

---

## Phases

| Phase | Work | Effort | Verifiable end state | Status |
|---|---|---|---|---|
| **A** | Add `BuildGraphOptions` (NEW interface in `graph/types.ts`), thread it through `buildRelationshipGraph` alongside `EntityInventoryInput`. Expand `NAMED_KINDS` in `score.ts` to include `phenomenon` + `guHazard` so DESTABILIZES can reach the spine. Implement `toneMultiplier(tone, edgeType)` and `isSpineEligibleForGu(edge, gu)`. Matrix snapshot test pinning STRUCTURAL fields only (no prose strings). Audit check `narrative.spineToneSensitivity`. | ~5 days | Tone weights actually fire (no longer dead letters on phenomenon-anchored edges). `gu='fracture'` widens spine pool. `tone='balanced'` + `gu='normal'` byte-identical to pre-feature. | ⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_A_PLAN.md) |
| **B** | Author per-tone faction-name stem + suffix banks. Implement deterministic `generateFactions(seed, tone, count)` in `lib/generator/factions/` (NEW module). Wire into per-system construction at `lib/generator/index.ts:2789` (replace static `namedFactions` load). Migrate or remove `data/narrative.json:namedFactions[]`. Per-system faction-cohesion test (no mixing dramatic/clinical names). Audit: ≥100 unique faction names across 4800 systems (today: 10). | ~5–7 days | Per-tone factions drawn from 100s of stems instead of the 10-card shared deck. The "Kestrel/Red Vane everywhere" complaint dissolves at the corpus level. `proseUnchanged.test.ts` regenerated — second deliberate softening of the byte-identical-default contract. | ⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_B_PLAN.md) |
| **C** | Author per-tone era pools (3 tones × 8–12 eras). Per-tone body[0] template variants for top-4 spine-eligible edge types (CONTESTS, CONTROLS, DESTABILIZES, one of {CONTRADICTS, BETRAYED}): ~36–48 strings. Per-tone spineSummary variants for the same 4 types: ~24–36 strings. Per-tone connective banks in `connectives.ts`. Renderer wiring in `renderClause` / `renderSpineSummary`. Cross-tone snapshot test for the top-4 edge types showing visibly different prose voice. | ~6–8 days | Even when two systems pick the same edge type for the spine, body[0] reads in a different voice (cinematic vs astronomy vs balanced). The Phase 7 "every system reads template-shuffled" complaint is resolved. | ⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_C_PLAN.md) |
| **D** | Extend `BuildGraphOptions` to carry `distribution` + `settlements`. Distribution-axis weights in `INPUT_WEIGHTS` (frontier boosts `visibility: 'contested'`; realistic boosts `visibility: 'open'`). Density-conditioned cluster pulling in `clusters.ts` (hub pulls more CONTROLS/DEPENDS_ON; sparse drops multi-faction edges). Matrix snapshot extension: 16 representative cells (diagonal subset of the 96 full Cartesian product). | ~3–4 days | All four input axes produce distinguishable output. The PHASE_7_SAMPLE_REVIEW.md "20-sample review reads as 20 distinct systems" bar is achieved. | ⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_D_PLAN.md) |

**Total: ~3–4 weeks** of focused work.

---

## Architectural Notes

### Three structural problems the team review surfaced

The generation-quality, adversarial, and architecture reviewers converged on three findings that the original single-phase Option A plan did not address. These are the rationale for the 4-phase rewrite.

#### 1. The structural gate problem (generation-quality reviewer)

`score.ts:66-68` defines `SPINE_ELIGIBLE_TYPES = {CONTESTS, DESTABILIZES, DEPENDS_ON, CONTROLS}`. `score.ts:20-22` defines `NAMED_KINDS` excluding `phenomenon`, `guHazard`, and `guResource`. The selection filter at `score.ts:83-87` requires **both** named-on-named AND eligible-type. The intersection today is effectively just CONTESTS-on-named and CONTROLS-on-named — the only edge families that survive the named-on-named requirement at scale.

The original plan's `TONE_WEIGHTS` table proposed:
- `astronomy`: DESTABILIZES 1.5×, HOSTS 1.2×, HIDES_FROM 1.3×
- `cinematic`: CONTESTS 1.5×, CONTRADICTS 1.4×, BETRAYED 1.3×

Of those 6 weights, **5 are dead letters** at the spine layer: DESTABILIZES, HOSTS, HIDES_FROM, CONTRADICTS, BETRAYED can't reach the spine because they either fail the named-on-named gate (DESTABILIZES typically subjects a phenomenon) or fail the eligible-type gate (HOSTS, HIDES_FROM, CONTRADICTS, BETRAYED are not in `SPINE_ELIGIBLE_TYPES`). The only weight that fires is `cinematic` boosting CONTESTS — but CONTESTS already wins 12/12 cells in the survey, so boosting it is a no-op.

**Phase A's response:** widen `NAMED_KINDS` to include `phenomenon` and `guHazard` so DESTABILIZES becomes a real spine candidate. Run a pre-task survey to confirm the rule corpus actually produces phenomenon-anchored eligible-type edges at meaningful frequency (≥10% of seeds); if not, escalate to authoring 2–3 new rules before shipping the predicate widening.

#### 2. The 10-faction problem (adversarial reviewer)

`data/narrative.json:322` ships a **10-faction shared pool**: Kestrel Free Compact, Red Vane Labor Combine, Glasshouse Biosafety Compact, Veyra-Locke Concession, Orison Route Authority, Ninth Ledger Office, Ash Meridian Navy, Helion Debt Synod, Pale Choir Communion, Sepulcher Archive Court. Loaded into every system's `narrativeFacts` at `lib/generator/index.ts:2789`. **Every system reshuffles the same 10 cards regardless of tone.**

No tone weight, no scoring tweak, no eligibility predicate fixes this — the cast is locked in before any selection logic runs. A reader looking at any 10 systems sees the same 10 names appearing across all of them. This is the actual root cause of the "everything reads the same" Phase 7 finding.

**Phase B's response:** per-tone composable faction generators. `cinematic` stems (Carrion, Black Comet, Last Ledger…) + suffixes (Synod, Run, Cabal, Crown…). `astronomy` stems (Bonn-Tycho, Stellar Survey Cohort, Calibration…) + suffixes (Trust, Cohort, Bureau, Observatory…). `balanced` keeps the current Kestrel/Red Vane register. Replaces the 10-card shared deck with deterministic per-system / per-tone generation. Expected corpus diversity: ≥100 unique names across 4800 systems instead of 10.

#### 3. The threading mismatch (architecture reviewer)

The original plan extended `EntityInventoryInput` with `tone` + `gu`. But `EntityInventoryInput` is the contract for `buildEntityInventory(input: EntityInventoryInput): EntityRef[]` — a function that builds entity refs from the post-generation entity state. Adding stylistic preferences (tone/gu) to that contract is a semantic mismatch: `tone` doesn't change what entities exist, it changes how the renderer prefers to talk about them.

**Phase A's response:** dedicated `BuildGraphOptions` interface. `buildRelationshipGraph` takes `(input: EntityInventoryInput, options: BuildGraphOptions, facts, rng)` instead of overloading the inventory input. Future axes (Phase D's `distribution` and `settlements`) live in the same options object naturally.

### The body[0] template-voice problem (generation-quality reviewer)

Even after Phase A widens spine eligibility and Phase B varies the faction names, body[0] **template voice** is identical per edge type regardless of tone. `renderSystemStory.ts:170-181` picks a body variant via single-RNG-pick from `family.body[]` — the variants in `contestsTemplates.ts:5-10` are voice-neutral. A `cinematic` CONTESTS spine and a `balanced` CONTESTS spine produce the same template family with the same RNG-picked variant logic. Different factions, same prose shape.

`clusters.ts:13-44` further compounds this: `spineCluster` pulls in **structural** edges that touch any spine endpoint (HOSTS, CONTROLS, DEPENDS_ON), so even when the spine edge varies, the same supporting structural sentences arrive in body[0]. The reader sees: different faction names, same scaffolding, same template phrasing.

**Phase C's response:** per-tone body[0] template variants for the top-4 spine-eligible edge types (CONTESTS, CONTROLS, DESTABILIZES, one of {CONTRADICTS, BETRAYED}). Per-tone era pools so historical bridges read in voice. Per-tone connective banks. Renderer routes to tone-appropriate variant first, then RNG-picks within tone.

### What Phase D adds

Phase 7's review explicitly cited that `distribution` (frontier/realistic) and `settlements` (sparse/normal/crowded/hub) also produce visually-identical output. The original Option A plan deferred both to "future work" — but once Phase A's `BuildGraphOptions` channel exists, adding distribution + density is a few more weights in the same `INPUT_WEIGHTS` table, not a new architecture. Phase D claims that ground.

### Determinism (preserved across all phases)

- No new RNG forks. All per-phase additions are pure functions of `(scored candidates, options)` or `(seed, tone)` for the faction generator.
- Same seed + same options produce same output across the entire sequence.
- Same seed + different tone produces different output — that is the entire point of the feature.

### Snapshot contract evolution

Two deliberate softenings of the `proseUnchanged.test.ts` byte-identical-default contract:

1. **Phase 8 Task 1 (already shipped):** `composeSpineSummary` lowercase-faction fix changed flag-OFF rendered prose for affected seeds. The snapshot doesn't pin `spineSummary` so the test stayed green, but rendered prose users see is different.
2. **Phase B (this sequence):** per-system faction generation regenerates the snapshot for default inputs. A `seed='X'` `tone='balanced'` system today produces faction set F; after Phase B it produces faction set F' (drawn from generated stems instead of the static 10). The 4 substantive prose surfaces (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) WILL drift — documented explicitly in the Phase B plan.

Both softenings are intentional. The byte-identical-default contract was written when the surfaces were undergoing churn through Phases 0–7; now that the pipeline is mature, allowing it to evolve in service of cross-system diversity is the right tradeoff.

---

## Why this isn't shipped as the original Option A

The original `NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` was a single-phase Option A (~4 days, 6 tasks). The team review found three category-1 problems with it:

| Original Plan's Position | Team Review Finding | Sequence Response |
|---|---|---|
| `TONE_WEIGHTS` table biases edge-type selection per tone | 5/6 weights are dead letters because of `NAMED_KINDS` + `SPINE_ELIGIBLE_TYPES` filters upstream of scoring | Phase A widens `NAMED_KINDS` to include `phenomenon` + `guHazard` so DESTABILIZES can actually reach the spine. Pre-task survey confirms the rule corpus produces real candidates. |
| Spine selection variance is the user-visible problem | `data/narrative.json:322` ships 10 factions for the entire universe — every system reshuffles the same 10 cards regardless of tone | Phase B replaces the static 10-faction pool with per-tone composable generators. ≥100 unique faction names across the corpus. |
| Body[0] sameness gets fixed when the spine edge varies | `renderSystemStory.ts:170-181` body[0] is single-RNG-pick from voice-neutral templates; same edge type → same prose shape regardless of tone | Phase C ships per-tone template variants for the top-4 edge types + per-tone era pools + per-tone connectives. |
| `EntityInventoryInput` is the right place to thread tone + gu | `EntityInventoryInput` is the contract for entity construction; adding stylistic preferences is a semantic mismatch | Phase A introduces dedicated `BuildGraphOptions` parameter object. Phase D extends it to `distribution` + `settlements`. |
| Matrix snapshot pins `spineSummary` + `body[0]` prose strings | Prose strings are fragile; pin structural fields (`spineEdgeType`, `spineSubjectKind`, `spineObjectKind`) instead | Phase A's matrix snapshot pins structural only. Phase C's adds prose snapshots once the per-tone voice exists to pin. |
| Settlements axis quietly omitted | Phase 7 review flagged settlement density as a sameness axis too; original plan had no acknowledgement | Phase D claims the settlements + distribution ground. |
| GU `low`/`normal`/`high` are functionally identical (only `fracture` widens) | Original plan didn't acknowledge — design rationale promised differentiation that the implementation didn't deliver | Phase A makes an explicit decision: `low` tightens (named-on-named only, no GU bonuses), `normal` baseline, `high` weights HOSTS/DESTABILIZES involving guHazard, `fracture` widens predicate. Decision documented in the Phase A plan. |
| Effort: ~4 days | Three structural problems to address; plan would have shipped green metrics while user-visible problem stayed | Effort: ~3–4 weeks across 4 phases. Each phase ships independently with verifiable end state. |

The original plan's success metric (matrix snapshot shows ≥3 distinct edge types across 12 cells) would have been green WITH THE USER-VISIBLE PROBLEM STILL PRESENT. Because the spine pool is structurally restricted to CONTESTS/CONTROLS today, the matrix would have shown CONTESTS dominating most cells with a few CONTROLS sprinkled in — technically ≥3 distinct values if you count subtle ties, technically green metric, no user-felt change. This is the textbook "Goodhart's Law" failure mode for a metric without root-cause grounding.

---

## Risks & deferred items

- **Phase A's `NAMED_KINDS` widening depends on rule-corpus availability.** If the pre-task survey (Phase A Task 1) finds <10% of seeds produce phenomenon-anchored eligible-type edges, the plan forks a sub-task to author 2–3 named-on-named DESTABILIZES rules. Without the rules, widening the predicate has no mechanism behind it.
- **Phase B's faction-cohesion-within-system test is critical.** Without it, a `balanced` system could end up with mixed cinematic/astronomy names because faction generation is per-system but the variant pool is per-tone. Documented as a required test in the Phase B plan, not optional.
- **Phase C scope discipline.** Per-tone templates fan out fast: 12 edge types × 3 tones × 4 surfaces × 4 variants = 576 strings. The plan rejects that. Scoped to: top-4 edge types × body[0] surface ONLY × 3 tones × 3-4 variants = ~36–48 strings. Spine summary variants similar scope. If post-Phase-C surveys show non-top-4 edge types still read same-voiced, that warrants a separate plan.
- **Phase D's matrix snapshot scope.** Full Cartesian product is 3 × 4 × 2 × 4 = 96 cells. The plan ships 16 representative cells covering the diagonal (frontier × normal × {tones}, realistic × crowded × {tones}, etc.). Full-matrix coverage is deferred.
- **Snapshot regeneration discipline.** Phase B's `proseUnchanged.test.ts` regeneration is the second deliberate softening of the byte-identical-default contract. Both Phase B and Phase C must explicitly document the snapshot diff in their commit messages and PR descriptions — automated `vitest -u` regeneration without human review defeats the audit trail purpose.
- **Tuning iteration.** Each per-phase plan includes its own tuning loop (Phase A's tone weights, Phase B's stem-bank sizes, Phase C's variant counts, Phase D's distribution weights). Each phase's matrix snapshot is the calibration artifact. Don't expect first-cut weights to ship — the per-phase plans build the iteration loop in.
- **Settlements `crowded` vs `normal` distinction.** Phase D's density axis treats `sparse` and `hub` as the two strong end-states (most user-visible). `crowded` and `normal` differ subtly in real-world generation; if post-Phase-D surveys can't distinguish them, document as a known limitation rather than over-engineer.

---

## Outputs the Phase D end state relies on

After the full sequence ships:
- `BuildGraphOptions` is the canonical channel for any future input axis (e.g., a hypothetical `era` axis later). New axes land as new fields + new entries in `INPUT_WEIGHTS`.
- `lib/generator/factions/` is the canonical home for setting-aware named entities. Adding a setting flavor (Hard SF, Sword & Planet) becomes a new tone + new stem bank.
- The four-axis matrix snapshot is the regression contract. Future feature work that touches scoring, eligibility, faction generation, or template selection is required to keep the matrix's cross-axis variance ≥ baseline.
- The `narrative.spineToneSensitivity` audit check is live — any future change that re-collapses the spine to a single edge type is caught at audit time before reaching review.
- `proseUnchanged.test.ts` becomes per-tone-aware: instead of pinning byte-identical default-input prose, it pins byte-identical PER-TONE-AND-PER-GU prose.
