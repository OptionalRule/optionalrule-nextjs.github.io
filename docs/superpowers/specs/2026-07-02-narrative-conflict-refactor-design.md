# Narrative Conflict Refactor — Design

**Date:** 2026-07-02
**Scope:** `src/features/tools/star_system_generator/lib/generator/` (graph, prose, hooks, factions, data)
**Status:** Approved direction; this document is the build spec.

## 1. Goal

The generator's physical and relational simulation is strong, but the narrative
text rendered from it is repetitive and generic. Measured across 50 seeds:
the same rumor appeared 16 times, the same NPC 11 times, phenomenon conflict
hooks are byte-identical for 28 of 32 phenomenon types, spine summaries have
one template per edge type, and ~70% of settlements close with "Control of X
decides who has leverage."

Target: every generated system reads as *a particular place where particular
things happen between particular people* (the original NARRATIVE_GRAPH_PLAN
goal), with enough structural and phrasal variety that two systems never feel
like the same text with swapped nouns.

## 2. Diagnosis (root causes, from the 2026-07 pipeline audit)

1. **Starved template pools.** Edge body prose: ~4 balanced sentences per
   relationship type; spine summaries: 1 balanced template per type. Only
   CONTESTS and DESTABILIZES have cinematic/astronomy variants; the other 10
   types render the same balanced sentences in every tone.
2. **Ungrounded stakes.** CONTESTS/CONTRADICTS qualifiers come from abstract
   faction domain tags (`war` → "conflict record") with no referent in the
   generated system.
3. **Static phenomenon prose.** `pickPhenomenonField` returns the single base
   string for 28/32 phenomena — travelEffect/surveyQuestion/conflictHook/
   sceneAnchor never vary.
4. **Faction seed dominance.** 10 balanced seed factions + named-entity spine
   scoring bonus → the same faction names headline most balanced systems.
5. **Hardcoded closers and single-variant rewrites.** `settlementProse.ts`
   closers (4 rotations), `graphAwareSettlementHook.ts` (3 fixed strings).
6. **Edges render as isolated sentences.** A spine edge becomes one sentence;
   there is no party structure, no escalation state, no complication, no
   causal link between a settlement's crisis and its hidden truth.

## 3. Design overview

Keep the graph, rules, scoring, and history modules (good bones). Insert a
**conflict synthesis layer** between edge selection and prose, and rebuild the
prose layer around it.

```
buildRelationshipGraph()                     (unchanged mechanics)
        │  spine + peripheral edges
        ▼
buildConflicts(graph, facts, rng.fork('conflicts'))     ← NEW  lib/generator/conflicts/
        │  Conflict[] (structured, 1 per spine edge, ≤3)
        ▼
renderSystemStory(graph, conflicts, rng.fork('story'))  ← REWORKED renderer
        │  SystemStoryOutput { spineSummary, body[], hooks[] }   (shape unchanged)
        ▼
graphAwareReshape / selectSystemHooks                    ← consume conflicts too
```

`SystemStoryOutput`'s shape is preserved so `SystemStoryPanel.tsx` and all
other UI components need no changes. The `Conflict[]` array is additionally
exposed on `GeneratedSystem.systemStory.conflicts` for future UI use, but no
component work is in scope.

## 4. The Conflict object (creative core)

```ts
interface ConflictParty {
  ref: EntityRef            // must exist in this system's entity inventory
  role: 'aggressor' | 'defender' | 'bystander'
  stake: string             // what this party gains/loses, concrete phrase
}

interface Conflict {
  id: string
  edgeId: string            // spine edge this was promoted from
  pressure: string          // physical/economic cause, derived from system facts
  parties: ConflictParty[]  // 2 principals + (when available) 1 bystander
  stakeRef: EntityRef | null // the contested thing — a real entity, never an abstract domain
  temperature: 'simmering' | 'open' | 'aftermath' | 'frozen'
  complication?: {
    kind: 'secret' | 'deadline' | 'third-party' | 'gu-anomaly'
    text: string
    sourceRef?: EntityRef   // e.g. the settlement whose hiddenTruth this is
  }
  visibleSign: string       // one witnessable scene, present tense, concrete imagery
}
```

Assembly rules (deterministic, drawn from `rng.fork('conflicts')`):

- **Parties/triangles.** Principals come from the edge endpoints. The bystander
  is selected from entities adjacent to either endpoint in the graph
  (peripheral edges), preferring settlements and named factions — someone who
  profits or pays. If no adjacent entity qualifies, the conflict stays two-party.
- **Grounded stakes.** `stakeRef` resolution order: edge qualifier if it names
  a real entity → a DEPENDS_ON/CONTROLS neighbor of either principal → a
  system phenomenon/guResource in the same domain → null (rendered without a
  named stake, never with an abstract domain word). The `concretizeDomain`
  abstract-tag path in `contestsRules`/`contradictsRules` is retired.
- **Temperature.** Weighted by edge type, visibility, and GU preference.
  `frozen` requires a reason and gets one: Gardener interdiction pressure,
  mutual dependency, or a suppressed record (SUPPRESSES/HIDES_FROM edges
  incident on either principal). Setting-native: some wars stay cold because
  winning would look like building an ASI.
- **Load-bearing complications.** If a principal or bystander settlement has a
  `hiddenTruth`, the complication binds it (`kind: 'secret'`) — the secret is
  the cause or the fuse of the conflict, and the settlement's own crisis/
  hiddenTruth prose is regenerated to agree (see §6). Historical edges
  (BETRAYED/FOUNDED_BY/DISPLACED) supply `kind: 'third-party'` complications.
- **Visible sign.** Composed from a new authored pool of concrete scene
  fragments keyed by edge type + temperature, with slots bound to party/stake
  display names.

## 5. Prose rendering (variety mechanics)

- **Beat grammars.** A conflict renders as 2–4 sentences by walking its beats
  in one of several orders per tone (e.g. pressure→parties→sign,
  sign→parties→complication, parties→temperature→sign). Grammar choice is an
  RNG draw; beat text comes from per-beat template pools. This multiplies
  variety structurally instead of relying on leaf-pool size alone.
- **Template pool expansion.** Every edge type gets ≥8 body templates per tone
  (balanced included — it is currently the flattest register) and ≥4 spine
  summary templates per tone. Historical families get ≥6 each. Existing
  strong cinematic/astronomy templates are kept.
- **Anti-repetition within a system.** Variant selection without replacement
  per system (deterministic: shuffle-by-rng then take-in-order), so one system
  never repeats a body template or connective pattern.
- **Known prose bugs fixed in passing** (from SAMPLE_REVIEW_2026-05):
  missing `:article` slot modifiers on phenomenon/ruin names; spine summary
  double-naming (pronominalize second mention); anchor-as-subject in
  `graphAwareSettlementWhyHere` (settlement is the actor, anchor is the place);
  `pickHistoricalEndpoints` identity no-op.

## 6. Settlement conflict integration

- **Crisis ↔ hiddenTruth coherence.** When a settlement participates in a
  conflict with a `secret` complication, its `hiddenTruth` is selected (or
  rewritten) to causally connect to its `crisis` via a new authored
  `crisisTruthPairs` table in `settlements.json` (~40 pairs where the truth
  explains, caused, or is threatened by the crisis). Settlements not in
  conflicts keep independent draws but prefer pair-compatible combinations
  when both draws land in the same pair family.
- **Closer variety.** The 4 hardcoded `settlementProse.ts` closers and 3
  `graphAwareSettlementHook.ts` strings are replaced by per-tone pools (≥6
  each) with slots for conflict parties when the settlement is a participant
  ("The standoff with X…" becomes one option among many, not the only voice).

## 7. Phenomena as conflict engines

Each phenomenon entry in `narrative.json` gains a `livelihoods` block: 2–3
professions/economies the phenomenon created (who lives off it), each with
actor, dependence, and friction strings. `conflictHook` becomes a rendered
composition: livelihood actor + friction + (when the phenomenon is a conflict
party or stake) the conflict's other principal. All 32 phenomena get ≥3
variants for travelEffect/surveyQuestion/sceneAnchor (extending the existing
`variants` mechanism — 4 phenomena already have it; author the remaining 28).

## 8. Hook skeletons

`hooks.json` entries gain optional slots (`{party}`, `{place}`, `{stake}`,
`{phenomenon}`) with a `binds` list describing what each needs. The selector
(`lib/generator/hooks.ts`) binds slots from the system's conflicts and
entities; entries whose bindings can't be satisfied fall back to their
current literal text (every existing entry remains valid — slotting is
additive). Pools also grow: +15 rumors, +10 contracts, +10 encounters,
+10 npcs, +8 twists, written in the established register. Term-resonance
biasing is preserved.

## 9. Faction banks

- Balanced bank: seed factions 10 → 24; stems/suffixes expanded so
  procedural names carry more of the load.
- Spine dominance cap: at most 1 seed-bank faction per system spine;
  scoring prefers procedural/entity-derived parties for remaining slots
  (deterministic tie-breaks preserved).

## 10. Determinism, compatibility, testing

- **Determinism:** all new draws come from dedicated forks
  (`rng.fork('conflicts')`, per-conflict subforks by edge id). Same seed +
  options → same system, always.
- **Seed compatibility: intentionally broken.** Old seeds will generate
  different systems/text. A `GENERATOR_VERSION` constant is added to
  `lib/generator/index.ts` and included in JSON/text exports.
- **Feature flags:** existing `graphAware` reshape flags unchanged. The
  conflict layer is always-on (it replaces spine rendering); rollback lever
  is git revert plus the snapshot suites pinning behavior.
- **Testing:**
  - Unit tests for `buildConflicts` (party selection, stake grounding,
    temperature reasons, complication binding) and beat grammars.
  - Regenerate existing snapshot suites (spine matrices, renderSystemStory,
    prose) on **Node 20** (CI runtime; Node 24 diverges on
    spineFullAxisMatrix).
  - New repetition-metrics test: across a fixed 40-seed corpus, assert
    distinct-ratio floors (spine summaries ≥90% distinct, conflict bodies
    ≥85%, phenomenon conflictHooks ≥60%, no hook entry appearing >4 times).
  - `scripts/audit-star-system-generator.ts` still exits with ~50 known
    baseline content errors; not a gate.

## 11. Phases

1. **Conflict anatomy + spine rendering** — `conflicts/` module, reworked
   `renderSystemStory`, template pool expansion, prose bug sweep, snapshot
   regen. (Headline fix.)
2. **Settlement integration** — crisisTruthPairs, closer pools, whyHere
   re-subjecting.
3. **Phenomena as engines** — livelihoods + variants authoring, conflictHook
   composition.
4. **Hooks + factions** — skeleton slots, pool growth, bank expansion,
   dominance cap, repetition-metrics test finalized.

Each phase lands as its own conventional commit(s) on `develop` with
typecheck/lint/test green before moving on.

## 12. Out of scope

- UI/component changes beyond what type changes force.
- The dead `narrativeStructures`/`narrativeVariablePools` data is removed
  from `narrative.json` (and the audit script updated) but not replaced —
  the conflict layer supersedes it.
- LLM-generated text at runtime. Everything remains deterministic and
  client-side.
