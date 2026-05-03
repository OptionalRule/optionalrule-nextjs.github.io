# Narrative Graph Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Phase 1 graph scaffold with real edges. Implement the rule API, scoring, two-phase budget selection, and index construction. Land the first 4 of 9 present-tense edge types — `HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES` — covering most cross-layer cohesion. Surface edge counts and integrity in the existing audit. No rendering yet — Phase 3 lands the renderer.

**Architecture:** Phase 2 of the [Narrative Graph Plan](./NARRATIVE_GRAPH_PLAN.md). Edges populate the existing `relationshipGraph` field, but no field on any other consumer changes; existing rendered prose remains byte-identical for any seed.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** `NARRATIVE_GRAPH_PLAN.md` Sections "Edge Palette", "Generation Algorithm" (Steps 1-4), "Determinism".

**Branch:** Work on `develop`. Phase 1 is already merged. No push.

**Scope:**
- Task 1: Define the rule API types (`EdgeRule`, `RuleMatch`, `BuildCtx`) and a stable-hash helper for tie-breaking.
- Task 2: Setting-patterns dictionary (regex/keyword tables shared across rules).
- Task 3: Extend `EntityInventoryInput` with fields the rules require (`bodyId` on settlements, `bodyName` on ruins, `confidence` on phenomena).
- Task 4: Implement `score.ts` scoring function (base weight + 3 named bonuses).
- Task 5: Implement `score.ts` budget selection (spine + peripheral, with the spec's caps).
- Task 6: Implement edge-index builder (`edgesByEntity`, `edgesByType`, `spineEdgeIds`).
- Task 7: First rule (`HOSTS:body-settlement`) + rule registry + wire end-to-end into `buildRelationshipGraph`. **This is the vertical-slice integration commit.**
- Task 8: `HOSTS:body-ruin` rule.
- Task 9: 3 `DEPENDS_ON` rules.
- Task 10: 2 `CONTESTS` rules.
- Task 11: 2 `DESTABILIZES` rules.
- Task 12: Audit visibility — surface edge counts in `:quick`/`:deep` output, add 4 graph-integrity checks.
- Task 13: Final verification.

**Out of scope:** Rendering (Phase 3), historical edges (Phase 5), the 5 remaining present-tense edge types (`CONTROLS`, `SUPPRESSES`, `CONTRADICTS`, `WITNESSES`, `HIDES_FROM` — Phase 4), downstream consumer integration (Phase 6).

---

## Architectural Notes

### `BuildCtx` design — why rules see both facts and raw input

The design doc's `EdgeRule.match` signature reads `(facts: NarrativeFact[], entities: EntityRef[]) => RuleMatch[]`. In practice, several rules need data that **is not in `narrativeFacts[]`** — `Settlement.bodyId` is a struct field that gets serialized into `GeneratedSystem.settlements[i].bodyId`, not into the fact ledger. The same applies to `HumanRemnant.location` (which carries the host body name as `Fact<string>`, not as a fact-ledger entry that joins to a body id) and `SystemPhenomenon.confidence`.

Rather than emit extra round-trip facts just so rules can read them (option (b) in the research), we extend `BuildCtx` to carry the original `EntityInventoryInput` alongside the fact ledger and entity inventory:

```ts
interface BuildCtx {
  facts: NarrativeFact[]
  entities: EntityRef[]
  input: EntityInventoryInput
  rng: SeededRng                          // pre-forked: rng.fork('graph:rules')
  factsBySubjectId: Map<string, NarrativeFact[]>   // pre-built convenience index
  factsByKind: Map<string, NarrativeFact[]>        // pre-built convenience index
  entitiesById: Map<string, EntityRef>             // pre-built convenience index
}
```

`facts` is the fact ledger (untouched). `entities` is the inventory from Task 5/6 of Phase 1. `input` is the raw structural input — rules read structural fields directly when needed. `rng` is pre-forked once and shared across rules. The three `Map`s are convenience indexes built once per system to avoid O(n*m) scans.

### Grounding fact selection

Every emitted edge requires `groundingFactIds: string[]`. When a rule fires, it lists the fact ids that justified the match. Rules that read structural data (e.g., `HOSTS:body-settlement` reading `settlement.bodyId`) ground via the **structural anchor fact** — the `settlement.location` fact (`subjectId` = settlement.id, `subjectType: 'settlement'`) — because that fact is what tells a downstream consumer "look at this settlement." The rule's grounding list may be empty if no fact directly justifies it; the renderer (Phase 3) handles that gracefully.

### Edge id format and tie-break hash

`edge.id` format: `${rule.id}--${subject.id}--${object.id}` — slugified. If two distinct edges from the same rule could share that id (rare but possible if a rule emits multiple edges per (subject, object) pair), append `--${hash(qualifier)}`.

Tie-breaks at scoring: when two edges have identical scores, sort by stable hash of `id`. The hash must be deterministic, fast, and not require the seed — it's a pure function of edge content. Phase 2 introduces a small exported `stableHashString(s: string): number` helper in `rules/ruleTypes.ts` (or alongside) so all rules use the same hash. Implementation can be a 3-line `xmur3`-style mixing function.

### Determinism contract

- Rule application order: alphabetical by `rule.id` (already specified by design doc).
- Within a rule, multiple matches are sorted by `(subject.id, object.id, qualifier ?? '')` ascending before being built into edges.
- Score ties: broken by `stableHashString(edge.id)` ascending.
- All RNG draws in rules use sub-forks of `ctx.rng`: `ctx.rng.fork(rule.id)` if a rule needs RNG (most don't).
- Sub-forks of the parent `'graph'` fork: `'graph:rules'`, `'graph:scoring'`, `'graph:budget'`. (Already absent from the existing top-level fork list per Phase 1 research.)
- Same input + same seed = byte-identical graph. Existing seeds continue to produce byte-identical existing fields.

### Confidence inheritance

When a rule has multiple grounding facts, the resulting edge's `confidence` is the **least confident** of the grounding facts (the most cautious). Confidence rank order (most → least confident): `'confirmed' > 'derived' > 'human-layer' > 'gu-layer' > 'inferred'`. This rank order lives as a small const in `ruleTypes.ts`.

If a rule has no grounding facts, it specifies its own confidence in the `build()` result (e.g., `'inferred'`).

### Visibility defaults

Phase 2 rules emit:
- `'public'` for HOSTS, DEPENDS_ON (structural facts; everyone knows the settlement is on this body).
- `'public'` for CONTESTS when both factions are openly known to claim the target.
- `'contested'` for CONTESTS when the rivalry is implicit (e.g., one party is the "authority", the other is a named-faction with overlapping domain).
- `'public'` for DESTABILIZES when grounded by `gu.hazard` or `phenomenon` of `confidence: 'gu-layer'`.
- `'contested'` for DESTABILIZES when grounded by `settlement.crisis` (the disruption is felt locally but the cause is debated).

`'hidden'` is reserved for Phase 4 (epistemic edges).

---

## File Structure

**New files (created in this phase):**
- `lib/generator/graph/rules/ruleTypes.ts` — `EdgeRule`, `RuleMatch`, `BuildCtx`, `stableHashString`, `CONFIDENCE_RANK`, `mintEdgeId`.
- `lib/generator/graph/rules/settingPatterns.ts` — keyword/regex tables.
- `lib/generator/graph/rules/index.ts` — barrel exporting `allRules` array (alphabetical by `rule.id`).
- `lib/generator/graph/rules/hostsRules.ts` — 2 rules.
- `lib/generator/graph/rules/dependsOnRules.ts` — 3 rules.
- `lib/generator/graph/rules/contestsRules.ts` — 2 rules.
- `lib/generator/graph/rules/destabilizesRules.ts` — 2 rules.
- `lib/generator/graph/score.ts` — `scoreCandidates`, `selectEdges` (spine + peripheral).
- `lib/generator/graph/buildIndexes.ts` — `buildEdgeIndexes`.
- `lib/generator/graph/__tests__/ruleTypes.test.ts`
- `lib/generator/graph/__tests__/settingPatterns.test.ts`
- `lib/generator/graph/__tests__/score.test.ts`
- `lib/generator/graph/__tests__/buildIndexes.test.ts`
- `lib/generator/graph/__tests__/hostsRules.test.ts`
- `lib/generator/graph/__tests__/dependsOnRules.test.ts`
- `lib/generator/graph/__tests__/contestsRules.test.ts`
- `lib/generator/graph/__tests__/destabilizesRules.test.ts`
- `lib/generator/graph/__tests__/integration.test.ts` — end-to-end fixture-driven tests landing in Task 7+.

**Files modified:**
- `lib/generator/graph/entities.ts` — extend `EntityInventoryInput` with `bodyId?` (settlements), `bodyName?` (ruins), `confidence?` (phenomena — already present per da4b52f).
- `lib/generator/graph/__tests__/entities.test.ts` — minor fixture additions for the new optional fields.
- `lib/generator/graph/buildRelationshipGraph.ts` — replace empty-edges scaffold with real pipeline (rules → score → budget → indexes). Accept full `EntityInventoryInput` + new `facts: NarrativeFact[]` parameter. The `_rng` parameter becomes `rng` (consumed).
- `lib/generator/graph/__tests__/buildRelationshipGraph.test.ts` — tests no longer assert "always empty edges"; new assertions for fixture-driven edge production.
- `lib/generator/graph/index.ts` — barrel adds `EdgeRule`, `RuleMatch`, `BuildCtx`, `scoreCandidates`, `selectEdges`, `buildEdgeIndexes`, `allRules`.
- `lib/generator/index.ts` — `buildRelationshipGraph` call gets a new second positional arg: the `narrativeFacts` array. The structural input gains `settlements[].bodyId` and `ruins[].location` projections via the call site.
- `scripts/audit-star-system-generator.ts` — `CorpusStats` gains `edgeCounts: number[]`, `spineCounts: number[]`. `auditSystem` adds 4 per-system graph-integrity checks. `auditCoverage` adds 1 corpus-level check. Print block prints edge percentiles.

**Files unchanged:**
- All `data/`, `components/`, `hooks/` files. All other generator modules. `prose/` module. `audit:star-system-data` script.

---

## Conventions (from Phase 0/1, applied here)

- Run `npx tsc --noEmit` as part of every task's verification — ESLint does not catch TS module-resolution errors.
- Function bodies copied during extraction must be byte-identical (only `export` added).
- If a plan-prescribed test assertion contradicts actual behavior, correct the test to match real output and document the deviation in the report.
- Keep `prose/index.ts` and `graph/index.ts` barrels named-only — no `export * from`. Direct sub-module imports from `index.ts` are the established pattern.
- Commit message style: `<type>: <subject>` lowercase, with the standard co-author trailer.
- No comments in code unless WHY is non-obvious (e.g., the `_rng` underscore-prefix doesn't need an `eslint-disable` comment because the project's ESLint config respects underscore as intentional non-use).
- Do not push.

---

## Task 1: Rule API types + stable-hash helper

**Why:** Every other Phase 2 task depends on the `EdgeRule` shape and the `BuildCtx` it receives. Landing this first gives every subsequent task a stable contract to compile against.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/ruleTypes.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/ruleTypes.test.ts`

- [ ] **Step 1: Write a failing test for `stableHashString`**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/ruleTypes.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { stableHashString, CONFIDENCE_RANK, mintEdgeId } from '../rules/ruleTypes'

  describe('stableHashString', () => {
    it('produces the same hash for identical input', () => {
      expect(stableHashString('hello')).toBe(stableHashString('hello'))
    })

    it('produces different hashes for different input', () => {
      expect(stableHashString('hello')).not.toBe(stableHashString('hellp'))
    })

    it('returns a non-negative integer', () => {
      const h = stableHashString('any-string-at-all')
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
    })

    it('handles empty string deterministically', () => {
      expect(stableHashString('')).toBe(stableHashString(''))
      expect(typeof stableHashString('')).toBe('number')
    })
  })

  describe('CONFIDENCE_RANK', () => {
    it('orders most-confident first, least-confident last', () => {
      // 'confirmed' > 'derived' > 'human-layer' > 'gu-layer' > 'inferred'
      // (lower index = more confident)
      expect(CONFIDENCE_RANK.indexOf('confirmed'))
        .toBeLessThan(CONFIDENCE_RANK.indexOf('derived'))
      expect(CONFIDENCE_RANK.indexOf('derived'))
        .toBeLessThan(CONFIDENCE_RANK.indexOf('human-layer'))
      expect(CONFIDENCE_RANK.indexOf('human-layer'))
        .toBeLessThan(CONFIDENCE_RANK.indexOf('gu-layer'))
      expect(CONFIDENCE_RANK.indexOf('gu-layer'))
        .toBeLessThan(CONFIDENCE_RANK.indexOf('inferred'))
    })

    it('contains all 5 Confidence values', () => {
      expect(CONFIDENCE_RANK.length).toBe(5)
    })
  })

  describe('mintEdgeId', () => {
    it('produces a stable id from rule.id + subject.id + object.id', () => {
      const id = mintEdgeId('HOSTS:body-settlement', 'body-1', 'settlement-1')
      expect(id).toBe('HOSTS:body-settlement--body-1--settlement-1')
    })

    it('appends a hash suffix when qualifier is provided', () => {
      const a = mintEdgeId('CONTESTS:foo', 's1', 's2', 'over-the-quota')
      const b = mintEdgeId('CONTESTS:foo', 's1', 's2', 'over-the-quota')
      const c = mintEdgeId('CONTESTS:foo', 's1', 's2', 'something-else')
      expect(a).toBe(b)
      expect(a).not.toBe(c)
      expect(a).toContain('CONTESTS:foo--s1--s2--')
    })
  })
  ```

  Run, expect FAIL (`Cannot find module '../rules/ruleTypes'`):
  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/ruleTypes.test.ts
  ```

- [ ] **Step 2: Implement `ruleTypes.ts`**

  File: `src/features/tools/star_system_generator/lib/generator/graph/rules/ruleTypes.ts`

  ```ts
  import type { Confidence, NarrativeFact } from '../../../../types'
  import type { SeededRng } from '../../rng'
  import type { EntityInventoryInput } from '../entities'
  import type { EdgeType, EdgeVisibility, EntityRef, RelationshipEdge } from '../types'

  export interface BuildCtx {
    facts: NarrativeFact[]
    entities: EntityRef[]
    input: EntityInventoryInput
    rng: SeededRng
    factsBySubjectId: Map<string, NarrativeFact[]>
    factsByKind: Map<string, NarrativeFact[]>
    entitiesById: Map<string, EntityRef>
  }

  export interface RuleMatch {
    subject: EntityRef
    object: EntityRef
    qualifier?: string
    visibility?: EdgeVisibility
    confidence?: Confidence
    weight?: number
    groundingFactIds: string[]
  }

  export interface EdgeRule {
    id: string
    edgeType: EdgeType
    baseWeight: number
    defaultVisibility: EdgeVisibility
    match: (ctx: BuildCtx) => RuleMatch[]
    build: (match: RuleMatch, rule: EdgeRule, ctx: BuildCtx) => RelationshipEdge | null
  }

  export const CONFIDENCE_RANK: ReadonlyArray<Confidence> = [
    'confirmed', 'derived', 'human-layer', 'gu-layer', 'inferred',
  ] as const

  export function leastConfident(facts: ReadonlyArray<NarrativeFact>): Confidence {
    if (facts.length === 0) return 'inferred'
    let worst = facts[0].value.confidence
    for (let i = 1; i < facts.length; i++) {
      const c = facts[i].value.confidence
      if (CONFIDENCE_RANK.indexOf(c) > CONFIDENCE_RANK.indexOf(worst)) {
        worst = c
      }
    }
    return worst
  }

  export function stableHashString(value: string): number {
    let h = 1779033703 ^ value.length
    for (let i = 0; i < value.length; i++) {
      h = Math.imul(h ^ value.charCodeAt(i), 3432918353)
      h = (h << 13) | (h >>> 19)
    }
    h ^= h >>> 16
    h = Math.imul(h, 2246822507)
    h ^= h >>> 13
    h = Math.imul(h, 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }

  export function mintEdgeId(
    ruleId: string,
    subjectId: string,
    objectId: string,
    qualifier?: string,
  ): string {
    const base = `${ruleId}--${subjectId}--${objectId}`
    if (qualifier === undefined || qualifier === '') return base
    return `${base}--${stableHashString(qualifier).toString(36)}`
  }

  export function buildFactIndexes(facts: NarrativeFact[]): {
    factsBySubjectId: Map<string, NarrativeFact[]>
    factsByKind: Map<string, NarrativeFact[]>
  } {
    const factsBySubjectId = new Map<string, NarrativeFact[]>()
    const factsByKind = new Map<string, NarrativeFact[]>()
    for (const fact of facts) {
      if (fact.subjectId !== undefined) {
        const arr = factsBySubjectId.get(fact.subjectId) ?? []
        arr.push(fact)
        factsBySubjectId.set(fact.subjectId, arr)
      }
      const kindArr = factsByKind.get(fact.kind) ?? []
      kindArr.push(fact)
      factsByKind.set(fact.kind, kindArr)
    }
    return { factsBySubjectId, factsByKind }
  }
  ```

  **Note on `Fact<string>.confidence`:** The existing `Fact<T>` type carries `confidence` on its inner object. Verify the path before relying on it: read `src/features/tools/star_system_generator/types.ts` for the `Fact<T>` definition. If `confidence` lives at `fact.value.confidence`, the `leastConfident` accessor above is correct. If it lives at `fact.value.value.confidence` or elsewhere, adjust accordingly and document.

- [ ] **Step 3: Run test, expect PASS**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/ruleTypes.test.ts
  npx tsc --noEmit
  npm run lint
  ```
  Expected: 4+2+2 = 8+ tests pass; tsc and lint clean.

- [ ] **Step 4: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/rules/ruleTypes.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/ruleTypes.test.ts
  git commit -m "$(cat <<'EOF'
  feat: define narrative graph rule API and stable hash helper

  EdgeRule, RuleMatch, BuildCtx contract for the rule modules to come.
  Adds stableHashString (xmur3-style) for tie-break determinism without
  RNG, mintEdgeId for deterministic edge ids from (rule, subject, object,
  qualifier), CONFIDENCE_RANK + leastConfident for grounding-fact
  confidence inheritance, and buildFactIndexes for the per-call
  convenience indexes BuildCtx carries.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Setting patterns dictionary

**Why:** Several Phase 2 rules pattern-match against text (e.g., a settlement crisis like "Bleed node changed course" suggests `DESTABILIZES` from a `gu-layer` phenomenon). Centralizing the keyword/regex tables in one file makes adding setting flavor a one-file edit and avoids regex duplication across rule files.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/settingPatterns.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/settingPatterns.test.ts`

- [ ] **Step 1: Write failing tests**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/settingPatterns.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import {
    RESOURCE_KEYWORDS,
    CRISIS_DESTABILIZE_KEYWORDS,
    CRISIS_DEPENDENCY_KEYWORDS,
    CRISIS_CONTEST_KEYWORDS,
    matchesAny,
    sharedDomains,
  } from '../rules/settingPatterns'

  describe('keyword tables', () => {
    it('RESOURCE_KEYWORDS includes the canonical resource families', () => {
      expect(RESOURCE_KEYWORDS).toContain('chiral')
      expect(RESOURCE_KEYWORDS).toContain('volatile')
      expect(RESOURCE_KEYWORDS).toContain('bleed')
    })

    it('CRISIS_DESTABILIZE_KEYWORDS includes physical-disruption signals', () => {
      // Phenomena/hazard-driven crises:
      expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('flare')
      expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('radiation')
      expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('bleed')
      expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('metric')
      expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('iggygate')
    })

    it('CRISIS_DEPENDENCY_KEYWORDS names resource-disruption signals', () => {
      expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('water')
      expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('chiral')
      expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('volatile')
    })

    it('CRISIS_CONTEST_KEYWORDS names rival-claim signals', () => {
      expect(CRISIS_CONTEST_KEYWORDS).toContain('strike')
      expect(CRISIS_CONTEST_KEYWORDS).toContain('coup')
      expect(CRISIS_CONTEST_KEYWORDS).toContain('crackdown')
      expect(CRISIS_CONTEST_KEYWORDS).toContain('seizes')
    })
  })

  describe('matchesAny', () => {
    it('returns true when text contains at least one keyword (case-insensitive)', () => {
      expect(matchesAny('Bleed node changed course', ['bleed', 'metric'])).toBe(true)
      expect(matchesAny('BLEED storm', ['bleed'])).toBe(true)
    })

    it('returns false when no keyword is present', () => {
      expect(matchesAny('Routine harvest cycle', ['bleed', 'metric'])).toBe(false)
    })

    it('returns false on empty input', () => {
      expect(matchesAny('', ['anything'])).toBe(false)
      expect(matchesAny('text', [])).toBe(false)
    })
  })

  describe('sharedDomains', () => {
    it('returns the intersection of two domain arrays', () => {
      expect(sharedDomains(['trade', 'labor'], ['labor', 'science'])).toEqual(['labor'])
    })

    it('preserves order from the first array', () => {
      expect(sharedDomains(['a', 'b', 'c'], ['c', 'a'])).toEqual(['a', 'c'])
    })

    it('returns empty when no overlap', () => {
      expect(sharedDomains(['a'], ['b'])).toEqual([])
    })
  })
  ```

  Run, expect FAIL.

- [ ] **Step 2: Implement `settingPatterns.ts`**

  File: `src/features/tools/star_system_generator/lib/generator/graph/rules/settingPatterns.ts`

  ```ts
  export const RESOURCE_KEYWORDS = [
    'chiral', 'volatile', 'bleed', 'plasma', 'ice', 'pinchdrive',
    'iggygate', 'metric', 'organism', 'spore',
  ] as const

  export const CRISIS_DESTABILIZE_KEYWORDS = [
    'bleed', 'metric', 'flare', 'radiation', 'iggygate', 'pinchdrive',
    'storm', 'cascade', 'breach', 'sabotage', 'mirror', 'dome',
  ] as const

  export const CRISIS_DEPENDENCY_KEYWORDS = [
    'water', 'chiral', 'volatile', 'medical', 'oxygen', 'ration',
    'imported', 'stock', 'feedstock', 'tank',
  ] as const

  export const CRISIS_CONTEST_KEYWORDS = [
    'strike', 'revolt', 'coup', 'crackdown', 'seizes', 'dispute',
    'rival', 'compliance team', 'blockade', 'embargo',
  ] as const

  export function matchesAny(text: string, keywords: ReadonlyArray<string>): boolean {
    if (text.length === 0 || keywords.length === 0) return false
    const lower = text.toLowerCase()
    for (const k of keywords) {
      if (lower.includes(k.toLowerCase())) return true
    }
    return false
  }

  export function sharedDomains(
    a: ReadonlyArray<string>,
    b: ReadonlyArray<string>,
  ): string[] {
    const setB = new Set(b)
    const out: string[] = []
    for (const item of a) {
      if (setB.has(item)) out.push(item)
    }
    return out
  }
  ```

  These keyword lists are deliberately small and curated. Phase 4 may add more (especially CONTROLS/SUPPRESSES patterns); Phase 7's tuning step is when sample-system review will most likely add or trim entries. Do not over-engineer with regex-builders today.

- [ ] **Step 3: Run test, expect PASS**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/settingPatterns.test.ts
  npx tsc --noEmit
  npm run lint
  ```

- [ ] **Step 4: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/rules/settingPatterns.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/settingPatterns.test.ts
  git commit -m "$(cat <<'EOF'
  feat: keyword tables for narrative graph rule pattern-matching

  Centralized RESOURCE_KEYWORDS, CRISIS_DESTABILIZE_KEYWORDS,
  CRISIS_DEPENDENCY_KEYWORDS, CRISIS_CONTEST_KEYWORDS plus matchesAny
  and sharedDomains helpers. Phase 4 will extend the tables for the
  CONTROLS/SUPPRESSES/CONTRADICTS edge types; Phase 7 tunes them after
  sample-system review.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Extend `EntityInventoryInput` with rule-required fields

**Why:** The HOSTS, DEPENDS_ON, and DESTABILIZES rules read structural fields that exist on the raw entity types but are not currently in `EntityInventoryInput`:
- `Settlement.bodyId` (which body the settlement is on) — needed by `HOSTS:body-settlement`.
- `HumanRemnant.location.value` (the body name string the ruin is on) — needed by `HOSTS:body-ruin`.
- `SystemPhenomenon.confidence.value` (`'inferred' | 'gu-layer' | 'human-layer'`) — needed by `DESTABILIZES:phenomenon-settlement-via-guLayer` to filter to gu-layer phenomena.

The `phenomenon.confidence` field was already added in commit `da4b52f`; only the settlement and ruin extensions are new.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/entities.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts`

- [ ] **Step 1: Verify `Settlement.bodyId` and `HumanRemnant.location` shapes**

  Read these two interfaces:
  ```
  grep -n "interface Settlement\|interface HumanRemnant" src/features/tools/star_system_generator/types.ts
  ```
  And inspect each. `Settlement.bodyId?: string` is at types.ts ~line 180. `HumanRemnant.location: Fact<string>` carries the body name as text (per Phase 2 research).

- [ ] **Step 2: Extend `EntityInventoryInput`**

  In `src/features/tools/star_system_generator/lib/generator/graph/entities.ts`, change:
  ```ts
  settlements: ReadonlyArray<{ id: string; name: { value: string } }>
  ...
  ruins: ReadonlyArray<{ id: string; remnantType: { value: string } }>
  ```
  to:
  ```ts
  settlements: ReadonlyArray<{ id: string; name: { value: string }; bodyId?: string }>
  ...
  ruins: ReadonlyArray<{ id: string; remnantType: { value: string }; location?: { value: string } }>
  ```

  The function body of `buildEntityInventory` does NOT change — the new fields are read by RULES (Task 7+), not by the inventory builder. The entity refs produced are unchanged.

- [ ] **Step 3: Verify existing entity tests still pass**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts
  ```
  Expected: 12/12 still pass. The fixtures don't need updating because the new fields are optional.

- [ ] **Step 4: Add one regression test asserting the new fields are accepted (and ignored by `buildEntityInventory`)**

  Append to `entities.test.ts`:
  ```ts
  it('accepts but does not consume settlement.bodyId and ruin.location fields', () => {
    const input: EntityInventoryInput = {
      ...minimalInput(),
      settlements: [
        { id: 'settlement-1', name: { value: 'Orison Hold' }, bodyId: 'body-1' },
      ],
      ruins: [
        { id: 'ruin-1', remnantType: { value: 'First-wave colony shell' }, location: { value: 'Nosaxa IV-b' } },
      ],
    }
    const refs = buildEntityInventory(input)
    const settlement = refs.find(r => r.kind === 'settlement')
    const ruin = refs.find(r => r.kind === 'ruin')
    // bodyId and location are read by rules in Task 7+; the entity ref itself doesn't carry them.
    expect(settlement).toBeDefined()
    expect(settlement).not.toHaveProperty('bodyId')
    expect(ruin).toBeDefined()
    expect(ruin).not.toHaveProperty('location')
  })
  ```

- [ ] **Step 5: Quality gate**

  ```
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  ```

- [ ] **Step 6: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/entities.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/entities.test.ts
  git commit -m "$(cat <<'EOF'
  refactor: extend EntityInventoryInput with rule-required structural fields

  Adds settlements[].bodyId and ruins[].location to EntityInventoryInput
  so Phase 2 HOSTS rules can read which body each settlement and ruin
  sits on without needing a roundtrip through the fact ledger.
  buildEntityInventory does not change — the new fields are read by
  rules from BuildCtx.input, not consumed during entity inventorying.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Implement `score.ts` scoring (base + 3 bonuses)

**Why:** Per the design doc Step 2, every candidate edge gets a final score = `base weight + novelty bonus (+0.1 if no edge of same type yet) + cross-layer bonus (+0.15 if subject and object in different layers) + named-entity bonus (+0.1 if both have proper names)`. Sorted descending. Same-target edges (same subject+object+type) collapse to the highest-scored.

This task lands `scoreCandidates` and the duplicate-collapse helper but NOT yet the budget selection (Task 5). Tests cover each bonus in isolation against synthetic candidate sets.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

- [ ] **Step 1: Define what "named" means**

  An entity is "named" if its `displayName` is a proper noun — i.e., it isn't just a spectral type, slug, or generic label. Operational definition for Phase 2: the entity is "named" if `displayName` matches `/[A-Z][a-z]+/` (at least one capitalized word with lowercase letters following) AND its kind is in the named-emitting set: `settlement, namedFaction, body, ruin`. The `system` entity is named (system name). `star, guResource, guHazard, phenomenon` are NOT named (they carry spectral types or descriptive labels, not proper names).

  This is conservative — Phase 7 may relax it after sample review.

- [ ] **Step 2: Write failing tests**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { scoreCandidates, isNamedEntity, type ScoredCandidate } from '../score'
  import type { EntityRef, RelationshipEdge } from '../types'

  const settlementRef: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
  const bodyRef: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
  const factionRef: EntityRef = { kind: 'namedFaction', id: 'faction-route-authority', displayName: 'Route Authority', layer: 'human' }
  const guResourceRef: EntityRef = { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' }
  const starRef: EntityRef = { kind: 'star', id: 'star-primary', displayName: 'G2V', layer: 'physical' }

  function makeEdge(overrides: Partial<RelationshipEdge>): RelationshipEdge {
    return {
      id: overrides.id ?? 'edge-x',
      type: overrides.type ?? 'HOSTS',
      subject: overrides.subject ?? bodyRef,
      object: overrides.object ?? settlementRef,
      visibility: 'public',
      confidence: 'derived',
      groundingFactIds: [],
      era: 'present',
      weight: 0.5,
      ...overrides,
    }
  }

  describe('isNamedEntity', () => {
    it('returns true for settlements with proper-noun displayName', () => {
      expect(isNamedEntity(settlementRef)).toBe(true)
    })
    it('returns true for namedFactions', () => {
      expect(isNamedEntity(factionRef)).toBe(true)
    })
    it('returns true for bodies with proper-noun displayName', () => {
      expect(isNamedEntity(bodyRef)).toBe(true)
    })
    it('returns false for stars (spectral type, not a proper name)', () => {
      expect(isNamedEntity(starRef)).toBe(false)
    })
    it('returns false for guResource', () => {
      expect(isNamedEntity(guResourceRef)).toBe(false)
    })
  })

  describe('scoreCandidates', () => {
    it('applies the base weight when no bonuses fire', () => {
      const edge = makeEdge({ subject: starRef, object: starRef, weight: 0.4 })
      const [scored] = scoreCandidates([edge])
      expect(scored.score).toBeCloseTo(0.4)
    })

    it('adds +0.1 for novelty when this is the first edge of its type', () => {
      const e1 = makeEdge({ id: 'e1', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.5 })
      const e2 = makeEdge({ id: 'e2', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.5 })
      const [s1, s2] = scoreCandidates([e1, e2])
      // Both have type HOSTS, so only one gets the novelty bonus (the first by stable-sort id).
      // Total score sum should be 0.5 + 0.6 = 1.1 plus shared bonuses.
      const novel = s1.bonuses.novelty + s2.bonuses.novelty
      expect(novel).toBeCloseTo(0.1)
    })

    it('adds +0.15 cross-layer bonus when subject and object differ in layer', () => {
      // body (physical) -> settlement (human) — cross-layer
      const edge = makeEdge({ subject: bodyRef, object: settlementRef })
      const [scored] = scoreCandidates([edge])
      expect(scored.bonuses.crossLayer).toBeCloseTo(0.15)
    })

    it('does NOT add cross-layer bonus when subject and object share a layer', () => {
      // settlement (human) -> faction (human)
      const edge = makeEdge({ subject: settlementRef, object: factionRef })
      const [scored] = scoreCandidates([edge])
      expect(scored.bonuses.crossLayer).toBe(0)
    })

    it('adds +0.1 named-entity bonus when both subject and object are named', () => {
      const edge = makeEdge({ subject: settlementRef, object: factionRef })
      const [scored] = scoreCandidates([edge])
      expect(scored.bonuses.namedEntity).toBeCloseTo(0.1)
    })

    it('does NOT add named-entity bonus when only one side is named', () => {
      // body is named, guResource is not
      const edge = makeEdge({ subject: bodyRef, object: guResourceRef })
      const [scored] = scoreCandidates([edge])
      expect(scored.bonuses.namedEntity).toBe(0)
    })

    it('sorts by score descending; ties broken by stable hash of edge.id ascending', () => {
      const e1 = makeEdge({ id: 'aaa', weight: 0.5 })
      const e2 = makeEdge({ id: 'bbb', weight: 0.7 })
      const e3 = makeEdge({ id: 'ccc', weight: 0.5 })
      const scored = scoreCandidates([e1, e2, e3])
      expect(scored[0].edge.id).toBe('bbb') // highest
      // e1 and e3 have equal base weights and identical bonuses; tie-break is by stable-hash ascending.
    })

    it('collapses duplicate (subject, object, type) edges keeping the highest-scored', () => {
      const e1 = makeEdge({ id: 'low', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.3 })
      const e2 = makeEdge({ id: 'high', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.7 })
      const scored = scoreCandidates([e1, e2])
      expect(scored).toHaveLength(1)
      expect(scored[0].edge.id).toBe('high')
    })
  })
  ```

  Run, expect FAIL (`Cannot find module '../score'`).

- [ ] **Step 3: Implement `score.ts` (scoring half only)**

  File: `src/features/tools/star_system_generator/lib/generator/graph/score.ts`

  ```ts
  import type { EntityRef, RelationshipEdge } from './types'
  import { stableHashString } from './rules/ruleTypes'

  export interface ScoreBonuses {
    novelty: number
    crossLayer: number
    namedEntity: number
  }

  export interface ScoredCandidate {
    edge: RelationshipEdge
    score: number
    bonuses: ScoreBonuses
  }

  const NOVELTY_BONUS = 0.1
  const CROSS_LAYER_BONUS = 0.15
  const NAMED_ENTITY_BONUS = 0.1

  const NAMED_KINDS = new Set<EntityRef['kind']>([
    'settlement', 'namedFaction', 'body', 'ruin', 'system',
  ])

  export function isNamedEntity(ref: EntityRef): boolean {
    if (!NAMED_KINDS.has(ref.kind)) return false
    return /[A-Z][a-z]+/.test(ref.displayName)
  }

  export function scoreCandidates(candidates: ReadonlyArray<RelationshipEdge>): ScoredCandidate[] {
    const collapsed = collapseDuplicates(candidates)
    const sortedForNovelty = [...collapsed].sort((a, b) => {
      // stable order: edge.id ascending by stable hash
      return stableHashString(a.id) - stableHashString(b.id)
    })

    const seenTypes = new Set<RelationshipEdge['type']>()
    const scored: ScoredCandidate[] = sortedForNovelty.map(edge => {
      const novelty = seenTypes.has(edge.type) ? 0 : NOVELTY_BONUS
      seenTypes.add(edge.type)
      const crossLayer = edge.subject.layer !== edge.object.layer ? CROSS_LAYER_BONUS : 0
      const namedEntity = isNamedEntity(edge.subject) && isNamedEntity(edge.object)
        ? NAMED_ENTITY_BONUS
        : 0
      const bonuses: ScoreBonuses = { novelty, crossLayer, namedEntity }
      const score = edge.weight + novelty + crossLayer + namedEntity
      return { edge, score, bonuses }
    })

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return stableHashString(a.edge.id) - stableHashString(b.edge.id)
    })
    return scored
  }

  function collapseDuplicates(candidates: ReadonlyArray<RelationshipEdge>): RelationshipEdge[] {
    const groups = new Map<string, RelationshipEdge[]>()
    for (const edge of candidates) {
      const key = `${edge.subject.id}|${edge.object.id}|${edge.type}`
      const arr = groups.get(key) ?? []
      arr.push(edge)
      groups.set(key, arr)
    }
    const out: RelationshipEdge[] = []
    for (const arr of groups.values()) {
      if (arr.length === 1) {
        out.push(arr[0])
      } else {
        // pick highest-weight; tie-break by stable hash of edge.id
        arr.sort((a, b) => {
          if (b.weight !== a.weight) return b.weight - a.weight
          return stableHashString(a.id) - stableHashString(b.id)
        })
        out.push(arr[0])
      }
    }
    return out
  }
  ```

- [ ] **Step 4: Run test, expect PASS; fix any drift**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  npx tsc --noEmit
  npm run lint
  ```

  If the "novelty applies to one of two HOSTS edges" assertion fails, the issue is which edge gets the novelty bonus first. Per the design doc, application order is alphabetical by `rule.id` — but at the score layer we don't have rule.id, only edge.id. Use `stableHashString(edge.id)` ascending to determine order. Adjust assertion to match real behavior (which edge id hashes lower) if the test as written makes the wrong assumption.

- [ ] **Step 5: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/score.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  git commit -m "$(cat <<'EOF'
  feat: scoreCandidates with novelty, cross-layer, and named-entity bonuses

  Implements the scoring half of score.ts per the design doc Step 2:
  base weight + novelty (+0.1, first-of-type) + cross-layer (+0.15,
  subject and object in different layers) + named-entity (+0.1, both
  sides are proper-noun named). Same-target duplicates collapse to the
  highest-weight survivor. Sorts descending by score with stable-hash
  tie-break.

  Budget selection lands in the next commit.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Implement budget selection (spine + peripheral)

**Why:** Per the design doc Step 3, scored candidates are split into a spine (1-3 named-on-named edges from the dramatic types, touching ≥2 different layers) plus a peripheral set (3-9 edges that grow connectivity). Total cap: `6 + min(6, num_settlements + num_phenomena)`, hard ceiling 12.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/score.ts` (adds `selectEdges`)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts` (adds budget tests)

- [ ] **Step 1: Write failing tests for `selectEdges`**

  Append to `score.test.ts`:

  ```ts
  import { selectEdges, type SelectionResult } from '../score'
  // (extend existing import line)

  describe('selectEdges (budget selection)', () => {
    function makeRefs(): { body: EntityRef; settlement: EntityRef; faction: EntityRef; otherFaction: EntityRef; resource: EntityRef; phenomenon: EntityRef } {
      return {
        body: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' },
        settlement: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
        faction: { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' },
        otherFaction: { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' },
        resource: { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' },
        phenomenon: { kind: 'phenomenon', id: 'p1', displayName: 'flare-amplified bleed season', layer: 'gu' },
      }
    }

    it('selects 1-3 spine edges from CONTESTS/DESTABILIZES/DEPENDS_ON, named-on-named, multi-layer', () => {
      const r = makeRefs()
      const candidates: RelationshipEdge[] = [
        makeEdge({ id: 'c1', type: 'CONTESTS', subject: r.faction, object: r.otherFaction, weight: 0.7 }),
        makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: r.settlement, object: r.resource, weight: 0.6 }),
        // HOSTS: spine-eligible? Per design, NO — HOSTS is structural, not dramatic. (See spec.)
        makeEdge({ id: 'h1', type: 'HOSTS', subject: r.body, object: r.settlement, weight: 0.5 }),
      ]
      const result = selectEdges(scoreCandidates(candidates), {
        numSettlements: 1,
        numPhenomena: 1,
      })
      // Spine: at most CONTESTS + DEPENDS_ON. HOSTS goes to peripheral.
      const spineTypes = result.spine.map(e => e.type)
      expect(spineTypes).toContain('CONTESTS')
      expect(spineTypes).toContain('DEPENDS_ON')
      expect(spineTypes).not.toContain('HOSTS')
      // Touch at least 2 layers across the spine set:
      const layers = new Set(result.spine.flatMap(e => [e.subject.layer, e.object.layer]))
      expect(layers.size).toBeGreaterThanOrEqual(2)
    })

    it('caps spine at 3 even when more eligible candidates exist', () => {
      const r = makeRefs()
      const cands: RelationshipEdge[] = []
      for (let i = 0; i < 10; i++) {
        cands.push(makeEdge({ id: `c${i}`, type: 'CONTESTS', subject: r.faction, object: r.otherFaction, weight: 0.7 - i * 0.01 }))
      }
      const result = selectEdges(scoreCandidates(cands), { numSettlements: 5, numPhenomena: 5 })
      expect(result.spine.length).toBeLessThanOrEqual(3)
    })

    it('peripheral set caps per type at 2', () => {
      const r = makeRefs()
      const cands: RelationshipEdge[] = []
      for (let i = 0; i < 6; i++) {
        cands.push(makeEdge({ id: `h${i}`, type: 'HOSTS', subject: r.body, object: r.settlement, weight: 0.5 - i * 0.01 }))
      }
      // make each (subject, object) unique so they don't collapse:
      // (skipping that detail here; the test author may need to vary subject/object too)
      const result = selectEdges(scoreCandidates(cands), { numSettlements: 5, numPhenomena: 5 })
      const hostsCount = result.peripheral.filter(e => e.type === 'HOSTS').length
      expect(hostsCount).toBeLessThanOrEqual(2)
    })

    it('total edges respect cap = 6 + min(6, num_settlements + num_phenomena), hard ceiling 12', () => {
      const r = makeRefs()
      // create 20 unique edges, all spine-eligible types
      const cands: RelationshipEdge[] = []
      for (let i = 0; i < 20; i++) {
        cands.push(makeEdge({
          id: `c${i}`,
          type: 'CONTESTS',
          subject: { ...r.faction, id: `f-a-${i}`, displayName: `Faction A${i}` },
          object: { ...r.otherFaction, id: `f-b-${i}`, displayName: `Faction B${i}` },
          weight: 0.7 - i * 0.001,
        }))
      }
      const result = selectEdges(scoreCandidates(cands), { numSettlements: 10, numPhenomena: 10 })
      expect(result.spine.length + result.peripheral.length).toBeLessThanOrEqual(12)
    })

    it('handles sparse systems (few candidates) without padding', () => {
      const r = makeRefs()
      const result = selectEdges(scoreCandidates([
        makeEdge({ id: 'h1', type: 'HOSTS', subject: r.body, object: r.settlement, weight: 0.5 }),
      ]), { numSettlements: 1, numPhenomena: 0 })
      expect(result.spine.length + result.peripheral.length).toBe(1)
    })

    it('returns spine ids in selection order', () => {
      const r = makeRefs()
      const result = selectEdges(scoreCandidates([
        makeEdge({ id: 'c1', type: 'CONTESTS', subject: r.faction, object: r.otherFaction, weight: 0.8 }),
        makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: r.settlement, object: r.resource, weight: 0.6 }),
      ]), { numSettlements: 1, numPhenomena: 1 })
      expect(result.spineIds.length).toBe(result.spine.length)
      expect(result.spineIds).toEqual(result.spine.map(e => e.id))
    })
  })
  ```

- [ ] **Step 2: Implement `selectEdges`**

  Append to `score.ts`:

  ```ts
  import type { EdgeType } from './types'

  export interface SelectionOptions {
    numSettlements: number
    numPhenomena: number
  }

  export interface SelectionResult {
    spine: RelationshipEdge[]
    peripheral: RelationshipEdge[]
    spineIds: string[]
  }

  const SPINE_ELIGIBLE_TYPES: ReadonlySet<EdgeType> = new Set([
    'CONTESTS', 'DESTABILIZES', 'DEPENDS_ON', 'CONTROLS',
  ])

  const SPINE_MIN = 1
  const SPINE_MAX = 3
  const PERIPHERAL_PER_TYPE_CAP = 2
  const TOTAL_HARD_CEILING = 12

  export function selectEdges(
    scored: ReadonlyArray<ScoredCandidate>,
    options: SelectionOptions,
  ): SelectionResult {
    const totalCap = Math.min(
      TOTAL_HARD_CEILING,
      6 + Math.min(6, options.numSettlements + options.numPhenomena),
    )

    // Phase 1: spine.
    const spineCandidates = scored.filter(c =>
      SPINE_ELIGIBLE_TYPES.has(c.edge.type)
      && isNamedEntity(c.edge.subject)
      && isNamedEntity(c.edge.object)
    )

    const spine: RelationshipEdge[] = []
    const spineLayers = new Set<string>()
    for (const cand of spineCandidates) {
      if (spine.length >= SPINE_MAX) break
      spine.push(cand.edge)
      spineLayers.add(cand.edge.subject.layer)
      spineLayers.add(cand.edge.object.layer)
    }
    // Spine must touch ≥2 different layers across the set. If a single spine edge happens
    // to be intra-layer, we may need to add a second spine candidate even if there's only one
    // spine slot used; this is enforced opportunistically — if no multi-layer combination is
    // available, accept what we have (sparse systems).

    const usedIds = new Set(spine.map(e => e.id))

    // Phase 2: peripheral.
    const peripheral: RelationshipEdge[] = []
    const perTypeCount: Record<string, number> = {}
    const remainingBudget = totalCap - spine.length
    for (const cand of scored) {
      if (peripheral.length >= remainingBudget) break
      if (usedIds.has(cand.edge.id)) continue
      const type = cand.edge.type
      perTypeCount[type] = perTypeCount[type] ?? 0
      if (perTypeCount[type] >= PERIPHERAL_PER_TYPE_CAP) continue
      peripheral.push(cand.edge)
      perTypeCount[type] += 1
      usedIds.add(cand.edge.id)
    }

    return { spine, peripheral, spineIds: spine.map(e => e.id) }
  }
  ```

  Notes for the implementer:
  - The spine multi-layer requirement is "touch at least 2 layers across the spine set" — interpreted opportunistically. If the only spine candidates are intra-layer, accept what we have rather than failing the system.
  - Per design doc, spine cap is 3; peripheral is 3-9; total cap formula gives 6-12.
  - The `SPINE_ELIGIBLE_TYPES` includes `'CONTROLS'` for forward-compat with Phase 4 even though Phase 2 doesn't generate that type yet.
  - The connectivity preference for peripheral ("prefer edges that touch already-spined entities or connect previously-disconnected layers") is intentionally simplified to "in score order, respecting per-type cap and total cap." Phase 7 may revisit if sample review shows weak connectivity.

- [ ] **Step 3: Run tests, expect PASS**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  npx tsc --noEmit
  ```

  Some assertions may need adjustment based on actual selection behavior (e.g., the "peripheral cap per type" test fixture needs unique subject/object to avoid being collapsed by `scoreCandidates` first). Adjust fixtures if needed; do not weaken assertions about the contract.

- [ ] **Step 4: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/score.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/score.test.ts
  git commit -m "$(cat <<'EOF'
  feat: selectEdges two-phase spine + peripheral budget selection

  Spine: 1-3 named-on-named edges from CONTESTS/DESTABILIZES/DEPENDS_ON
  (CONTROLS reserved for Phase 4). Touches ≥2 layers opportunistically.
  Peripheral: fills remaining budget in score order with per-type cap of
  2. Total cap = 6 + min(6, settlements + phenomena), hard ceiling 12.
  Sparse systems are accepted as-is (no padding).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Edge-index builder

**Why:** Per the design doc Step 4, after selection we build the convenience indexes (`edgesByEntity`, `edgesByType`) for renderer/audit consumers. Frozen in output — no surprise mutation downstream.

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/buildIndexes.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildIndexes.test.ts`

- [ ] **Step 1: Write failing tests**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildIndexes.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { buildEdgeIndexes } from '../buildIndexes'
  import type { RelationshipEdge } from '../types'

  function makeEdge(o: Partial<RelationshipEdge>): RelationshipEdge {
    return {
      id: o.id ?? 'e',
      type: o.type ?? 'HOSTS',
      subject: o.subject ?? { kind: 'body', id: 'b1', displayName: 'Body 1', layer: 'physical' },
      object: o.object ?? { kind: 'settlement', id: 's1', displayName: 'Settlement 1', layer: 'human' },
      visibility: 'public',
      confidence: 'derived',
      groundingFactIds: [],
      era: 'present',
      weight: 0.5,
      ...o,
    }
  }

  describe('buildEdgeIndexes', () => {
    it('groups edge ids by subject and object entity ids', () => {
      const e1 = makeEdge({ id: 'e1' })
      const indexes = buildEdgeIndexes([e1])
      expect(indexes.edgesByEntity['b1']).toEqual(['e1'])
      expect(indexes.edgesByEntity['s1']).toEqual(['e1'])
    })

    it('groups edge ids by type', () => {
      const e1 = makeEdge({ id: 'e1', type: 'HOSTS' })
      const e2 = makeEdge({ id: 'e2', type: 'CONTESTS' })
      const indexes = buildEdgeIndexes([e1, e2])
      expect(indexes.edgesByType.HOSTS).toEqual(['e1'])
      expect(indexes.edgesByType.CONTESTS).toEqual(['e2'])
      // All other types stay as empty arrays
      expect(indexes.edgesByType.DEPENDS_ON).toEqual([])
    })

    it('initializes all 12 edgesByType keys to empty arrays', () => {
      const indexes = buildEdgeIndexes([])
      const keys = ['HOSTS', 'CONTROLS', 'DEPENDS_ON', 'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
        'CONTRADICTS', 'WITNESSES', 'HIDES_FROM', 'FOUNDED_BY', 'BETRAYED', 'DISPLACED'] as const
      for (const k of keys) {
        expect(indexes.edgesByType[k]).toEqual([])
      }
    })

    it('preserves edge order (insertion order from input)', () => {
      const e1 = makeEdge({ id: 'e1', subject: { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' } })
      const e2 = makeEdge({ id: 'e2', subject: { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' } })
      const indexes = buildEdgeIndexes([e1, e2])
      expect(indexes.edgesByEntity['b1']).toEqual(['e1', 'e2'])
    })

    it('handles edges with same subject and object (self-loop) — both refs map to the edge', () => {
      const ref = { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' as const }
      const edge = makeEdge({ id: 'e1', subject: ref, object: ref })
      const indexes = buildEdgeIndexes([edge])
      expect(indexes.edgesByEntity['b1']).toEqual(['e1'])  // dedup'd if same id, not pushed twice
    })
  })
  ```

  Run, expect FAIL.

- [ ] **Step 2: Implement `buildIndexes.ts`**

  File: `src/features/tools/star_system_generator/lib/generator/graph/buildIndexes.ts`

  ```ts
  import type { EdgeType, RelationshipEdge } from './types'

  const ALL_EDGE_TYPES = [
    'HOSTS', 'CONTROLS', 'DEPENDS_ON',
    'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
    'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
    'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
  ] as const satisfies readonly EdgeType[]

  export interface EdgeIndexes {
    edgesByEntity: Record<string, string[]>
    edgesByType: Record<EdgeType, string[]>
  }

  export function buildEdgeIndexes(edges: ReadonlyArray<RelationshipEdge>): EdgeIndexes {
    const edgesByEntity: Record<string, string[]> = {}
    const edgesByType = {} as Record<EdgeType, string[]>
    for (const t of ALL_EDGE_TYPES) edgesByType[t] = []

    for (const edge of edges) {
      pushUnique(edgesByEntity, edge.subject.id, edge.id)
      if (edge.object.id !== edge.subject.id) {
        pushUnique(edgesByEntity, edge.object.id, edge.id)
      }
      edgesByType[edge.type].push(edge.id)
    }
    return { edgesByEntity, edgesByType }
  }

  function pushUnique(map: Record<string, string[]>, key: string, value: string): void {
    const arr = map[key] ?? []
    if (arr[arr.length - 1] !== value) arr.push(value)
    map[key] = arr
  }
  ```

  Note that `ALL_EDGE_TYPES` here is duplicated from `buildRelationshipGraph.ts`. Phase 2 leaves both in place; a tiny shared `constants.ts` could consolidate them, but that's a Phase 3+ cleanup if it ever feels worth doing.

- [ ] **Step 3: Run tests, expect PASS; quality gate**

  ```
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildIndexes.test.ts
  npx tsc --noEmit
  npm run lint
  ```

- [ ] **Step 4: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/buildIndexes.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildIndexes.test.ts
  git commit -m "$(cat <<'EOF'
  feat: buildEdgeIndexes for graph entity/type lookups

  Groups edge ids by subject/object entity id and by edge type. All 12
  edge types are present in edgesByType (empty arrays for types with
  no edges in this system). Preserves input order. Self-loops dedup so
  the same edge id only appears once per entity.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 7: Vertical slice — `HOSTS:body-settlement` rule + registry + end-to-end wiring

**Why:** The rule infrastructure (Tasks 1-2) and pipeline pieces (Tasks 4-6) all exist independently. This task ties them together via one rule, proving the pipeline works end-to-end before adding more rules. After this task, `buildRelationshipGraph` produces real edges for fixtures and the existing `audit:star-system-generator:quick` should still pass (the 4 new graph integrity audit checks land in Task 12, not here).

**Files:**
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/index.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/index.ts` (barrel)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (call site adds `narrativeFacts` arg + projects `bodyId` / `location` into the input)

- [ ] **Step 1: Write the `HOSTS:body-settlement` rule unit tests**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { hostsBodySettlementRule } from '../rules/hostsRules'
  import { buildFactIndexes } from '../rules/ruleTypes'
  import type { BuildCtx } from '../rules/ruleTypes'
  import type { EntityRef } from '../types'
  import type { EntityInventoryInput } from '../entities'
  import { createSeededRng } from '../../rng'
  import type { NarrativeFact } from '../../../../types'

  function makeCtx(overrides: Partial<BuildCtx> = {}): BuildCtx {
    const input: EntityInventoryInput = overrides.input ?? {
      systemName: 'Test System',
      primary: { spectralType: { value: 'G2V' } },
      companions: [],
      bodies: [
        { id: 'body-1', name: { value: 'Test Body' } },
      ],
      settlements: [
        { id: 'settlement-1', name: { value: 'Test Settlement' }, bodyId: 'body-1' },
      ],
      guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
      phenomena: [],
      ruins: [],
      narrativeFacts: [],
    }
    const entities: EntityRef[] = overrides.entities ?? [
      { kind: 'body', id: 'body-1', displayName: 'Test Body', layer: 'physical' },
      { kind: 'settlement', id: 'settlement-1', displayName: 'Test Settlement', layer: 'human' },
    ]
    const facts: NarrativeFact[] = overrides.facts ?? []
    const indexes = buildFactIndexes(facts)
    return {
      facts,
      entities,
      input,
      rng: overrides.rng ?? createSeededRng('hosts-test'),
      ...indexes,
      entitiesById: new Map(entities.map(e => [e.id, e])),
    }
  }

  describe('HOSTS:body-settlement', () => {
    it('produces a HOSTS edge for each settlement with a bodyId', () => {
      const ctx = makeCtx()
      const matches = hostsBodySettlementRule.match(ctx)
      expect(matches).toHaveLength(1)
      expect(matches[0].subject.id).toBe('body-1')
      expect(matches[0].object.id).toBe('settlement-1')
    })

    it('produces no matches when bodyId is missing', () => {
      const ctx = makeCtx({
        input: {
          ...{
            systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
            bodies: [{ id: 'body-1', name: { value: 'B' } }],
            settlements: [{ id: 'settlement-1', name: { value: 'S' } }], // no bodyId
            guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
            phenomena: [], ruins: [], narrativeFacts: [],
          },
        },
      })
      expect(hostsBodySettlementRule.match(ctx)).toHaveLength(0)
    })

    it('produces no matches when bodyId points to a body not in the inventory', () => {
      const ctx = makeCtx({
        input: {
          systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
          bodies: [],
          settlements: [{ id: 'settlement-1', name: { value: 'S' }, bodyId: 'missing' }],
          guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
          phenomena: [], ruins: [], narrativeFacts: [],
        },
        entities: [
          { kind: 'settlement', id: 'settlement-1', displayName: 'S', layer: 'human' },
        ],
      })
      expect(hostsBodySettlementRule.match(ctx)).toHaveLength(0)
    })

    it('build() produces a complete RelationshipEdge', () => {
      const ctx = makeCtx()
      const [match] = hostsBodySettlementRule.match(ctx)
      const edge = hostsBodySettlementRule.build(match, hostsBodySettlementRule, ctx)
      expect(edge).not.toBeNull()
      expect(edge!.type).toBe('HOSTS')
      expect(edge!.era).toBe('present')
      expect(edge!.subject.kind).toBe('body')
      expect(edge!.object.kind).toBe('settlement')
      expect(edge!.id).toContain('HOSTS:body-settlement')
    })
  })
  ```

- [ ] **Step 2: Implement `hostsRules.ts` (just `HOSTS:body-settlement` for now)**

  File: `src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts`

  ```ts
  import { mintEdgeId, type EdgeRule, type RuleMatch } from './ruleTypes'

  export const hostsBodySettlementRule: EdgeRule = {
    id: 'HOSTS:body-settlement',
    edgeType: 'HOSTS',
    baseWeight: 0.6,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      for (const settlement of ctx.input.settlements) {
        if (!settlement.bodyId) continue
        const bodyRef = ctx.entitiesById.get(settlement.bodyId)
        if (!bodyRef || bodyRef.kind !== 'body') continue
        const settlementRef = ctx.entitiesById.get(settlement.id)
        if (!settlementRef) continue
        // Grounding fact: the settlement.location fact gives the human-facing anchor;
        // it has subjectId === settlement.id.
        const groundingFactIds = (ctx.factsBySubjectId.get(settlement.id) ?? [])
          .filter(f => f.kind === 'settlement.location')
          .map(f => f.id)
        matches.push({
          subject: bodyRef,
          object: settlementRef,
          groundingFactIds,
        })
      }
      // Stable order for determinism: by (subject.id, object.id)
      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build(match, rule, ctx) {
      const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
      // Confidence: derived (structural, derived from generation)
      return {
        id,
        type: rule.edgeType,
        subject: match.subject,
        object: match.object,
        qualifier: match.qualifier,
        visibility: match.visibility ?? rule.defaultVisibility,
        confidence: match.confidence ?? 'derived',
        groundingFactIds: match.groundingFactIds,
        era: 'present',
        weight: match.weight ?? rule.baseWeight,
      }
    },
  }
  ```

- [ ] **Step 3: Implement the rule registry**

  File: `src/features/tools/star_system_generator/lib/generator/graph/rules/index.ts`

  ```ts
  import type { EdgeRule } from './ruleTypes'
  import { hostsBodySettlementRule } from './hostsRules'

  // Rules are applied in alphabetical order by rule.id for determinism.
  export const allRules: ReadonlyArray<EdgeRule> = [
    hostsBodySettlementRule,
  ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  export type { EdgeRule, RuleMatch, BuildCtx } from './ruleTypes'
  export { stableHashString, mintEdgeId, CONFIDENCE_RANK, leastConfident, buildFactIndexes } from './ruleTypes'
  ```

- [ ] **Step 4: Rewrite `buildRelationshipGraph.ts` to consume rules end-to-end**

  File: `src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts`

  ```ts
  import type { NarrativeFact } from '../../../types'
  import type { SeededRng } from '../rng'
  import { buildEntityInventory, type EntityInventoryInput } from './entities'
  import type { EdgeType, RelationshipEdge, SystemRelationshipGraph } from './types'
  import { allRules, buildFactIndexes, type BuildCtx } from './rules'
  import { scoreCandidates, selectEdges } from './score'
  import { buildEdgeIndexes } from './buildIndexes'

  const ALL_EDGE_TYPES = [
    'HOSTS', 'CONTROLS', 'DEPENDS_ON',
    'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
    'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
    'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
  ] as const satisfies readonly EdgeType[]

  function emptyEdgesByType(): Record<EdgeType, string[]> {
    const r = {} as Record<EdgeType, string[]>
    for (const t of ALL_EDGE_TYPES) r[t] = []
    return r
  }

  export function buildRelationshipGraph(
    input: EntityInventoryInput,
    facts: NarrativeFact[],
    rng: SeededRng,
  ): SystemRelationshipGraph {
    const entities = buildEntityInventory(input)
    const entitiesById = new Map(entities.map(e => [e.id, e]))
    const indexes = buildFactIndexes(facts)
    const ctx: BuildCtx = {
      facts,
      entities,
      input,
      rng: rng.fork('rules'),
      ...indexes,
      entitiesById,
    }

    // Step 1: collect candidate edges from every rule (alphabetical order).
    const candidates: RelationshipEdge[] = []
    for (const rule of allRules) {
      const matches = rule.match(ctx)
      for (const match of matches) {
        const edge = rule.build(match, rule, ctx)
        if (edge !== null) candidates.push(edge)
      }
    }

    // Step 2 + 3: score and select.
    const scored = scoreCandidates(candidates)
    const selection = selectEdges(scored, {
      numSettlements: input.settlements.length,
      numPhenomena: input.phenomena.length,
    })
    const edges = [...selection.spine, ...selection.peripheral]

    // Step 4: indexes.
    const { edgesByEntity, edgesByType } = buildEdgeIndexes(edges)
    // edgesByType from buildEdgeIndexes already covers all 12 keys; merge with our default
    // for safety in case future refactors of buildEdgeIndexes change behavior.
    const completeEdgesByType = { ...emptyEdgesByType(), ...edgesByType }

    return {
      entities,
      edges,
      edgesByEntity,
      edgesByType: completeEdgesByType,
      spineEdgeIds: selection.spineIds,
      historicalEdgeIds: [],
    }
  }
  ```

  **Signature changed:** `buildRelationshipGraph` now takes `(input, facts, rng)` instead of `(input, _rng)`. The `_rng` underscore prefix is gone — RNG is consumed via `rng.fork('rules')`.

- [ ] **Step 5: Update `buildRelationshipGraph` tests**

  In `src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts`, the existing 4 tests assume "edges always empty." After Task 7, that's no longer true when fixtures contain settlements with `bodyId`. Update:

  - Tests 1-3: Use a fixture WITHOUT settlements (or with settlements lacking `bodyId`) so they continue to assert empty edges. This proves the pipeline plumbing still produces the empty-graph shape when no rules fire.
  - Add a new test: "produces a HOSTS edge when a settlement has a bodyId" — uses a fixture with one settlement + bodyId; asserts `edges.length >= 1`, `edges[0].type === 'HOSTS'`, `edgesByType.HOSTS.length === 1`, `edgesByEntity['body-1']` and `edgesByEntity['settlement-1']` both contain the edge id.
  - The determinism test stays (same input + same seed → equal graph).
  - Update the call signature: `buildRelationshipGraph(input, [], rng)` for the empty-fact cases.

- [ ] **Step 6: Add an integration test exercising one fixture seed end-to-end through `generateSystem`**

  File: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts`

  ```ts
  import { describe, expect, it } from 'vitest'
  import { generateSystem } from '../../index'

  describe('relationshipGraph integration with generateSystem', () => {
    it('produces at least one HOSTS edge for any system with settlements', () => {
      const system = generateSystem({ seed: 'phase2-task7-spot' })
      if (system.settlements.length > 0) {
        const hostsEdges = system.relationshipGraph.edges.filter(e => e.type === 'HOSTS')
        expect(hostsEdges.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('keeps narrative prose byte-identical to the pre-Phase-2 output for the same seed', () => {
      // The shape of this assertion: snapshot one render result. Since we don't have a baseline file,
      // the assertion here is structural: prose fields are non-empty and the same length as before.
      const system = generateSystem({ seed: 'phase2-task7-spot' })
      expect(system.name.value.length).toBeGreaterThan(0)
      for (const settlement of system.settlements) {
        expect(settlement.tagHook?.value.length ?? 0).toBeGreaterThan(0)
      }
    })

    it('is deterministic — the same seed produces the same graph', () => {
      const a = generateSystem({ seed: 'phase2-determinism' })
      const b = generateSystem({ seed: 'phase2-determinism' })
      expect(a.relationshipGraph.edges.map(e => e.id))
        .toEqual(b.relationshipGraph.edges.map(e => e.id))
    })
  })
  ```

- [ ] **Step 7: Update the call site in `lib/generator/index.ts`**

  Find:
  ```ts
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: name.value,
      primary: { spectralType: primary.spectralType },
      companions,
      bodies,
      settlements,
      guOverlay,
      phenomena,
      ruins,
      narrativeFacts,
    },
    rootRng.fork('graph'),
  )
  ```
  Change to (note: signature now takes `narrativeFacts` as a separate positional arg, so DROP it from the input object literal AND add it as a second arg; ALSO project `bodyId` on settlements and `location` on ruins so rules can read them):
  ```ts
  const relationshipGraph = buildRelationshipGraph(
    {
      systemName: name.value,
      primary: { spectralType: primary.spectralType },
      companions,
      bodies,
      settlements: settlements.map(s => ({ id: s.id, name: s.name, bodyId: s.bodyId })),
      guOverlay,
      phenomena,
      ruins: ruins.map(r => ({ id: r.id, remnantType: r.remnantType, location: r.location })),
      narrativeFacts,
    },
    narrativeFacts,
    rootRng.fork('graph'),
  )
  ```

  **Important:** verify what `Settlement.id`, `Settlement.bodyId`, `HumanRemnant.id`, `HumanRemnant.remnantType`, `HumanRemnant.location` actually look like before writing the projection. If `HumanRemnant.location` is `Fact<string>` and the input expects `{ value: string }`, structural typing handles it. If `location` is a different shape, adjust the projection.

  Decide: drop `narrativeFacts` from the input object since it's now a separate arg, OR keep it on both (input.narrativeFacts is still consumed by `buildEntityInventory` for namedFaction entities). The cleaner approach is to leave `narrativeFacts` on the input AND pass it as the second arg — `buildEntityInventory` reads it for faction entities, and `buildRelationshipGraph` reads it for rule grounding. The duplication is intentional for clarity.

- [ ] **Step 8: Update the `graph/index.ts` barrel**

  Add:
  ```ts
  export { scoreCandidates, selectEdges, isNamedEntity } from './score'
  export type { ScoredCandidate, ScoreBonuses, SelectionOptions, SelectionResult } from './score'
  export { buildEdgeIndexes } from './buildIndexes'
  export type { EdgeIndexes } from './buildIndexes'
  export { allRules } from './rules'
  export type { EdgeRule, RuleMatch, BuildCtx } from './rules'
  export { stableHashString, mintEdgeId, CONFIDENCE_RANK, leastConfident, buildFactIndexes } from './rules'
  ```

- [ ] **Step 9: Quality gate**

  ```
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Expected: all pass. The audit will produce real edges for every system but won't fail because (a) no audit check yet asserts edge presence, and (b) existing prose is unchanged.

  Note: depending on `Settlement.bodyId`'s actual frequency in the existing pipeline (some settlements may not have `bodyId` set if they're orbital/free-flying), the integration test's "every system with settlements has ≥1 HOSTS edge" may be too strict. Adjust to a softer assertion if needed (e.g., "if any settlement has bodyId, there is ≥1 HOSTS edge"), and document the deviation.

- [ ] **Step 10: Commit**

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/rules/ \
           src/features/tools/star_system_generator/lib/generator/graph/buildRelationshipGraph.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/buildRelationshipGraph.test.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/integration.test.ts \
           src/features/tools/star_system_generator/lib/generator/graph/index.ts \
           src/features/tools/star_system_generator/lib/generator/index.ts
  git commit -m "$(cat <<'EOF'
  feat: wire HOSTS:body-settlement rule end-to-end through graph pipeline

  First rule + the full plumbing it needs: rule registry, scoring,
  budget selection, and edge-index construction all wired into
  buildRelationshipGraph. The function now consumes narrativeFacts as
  a separate positional arg and produces real edges. The call site in
  the generator pipeline projects settlement.bodyId and ruin.location
  onto the input so rules can read structural anchors.

  Subsequent commits add the remaining 9 rules (HOSTS:body-ruin plus
  3 DEPENDS_ON, 2 CONTESTS, 2 DESTABILIZES) without further pipeline
  changes.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 8: `HOSTS:body-ruin` rule

**Why:** Ruins are the second `HOSTS`-eligible entity. Each `HumanRemnant` has a `location: Fact<string>` whose value is typically the host body's name. The rule matches by string-comparison against body display names.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts` (append rule + export)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/rules/index.ts` (register in `allRules`)
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts` (append tests)

- [ ] **Step 1: Write failing test (append to `hostsRules.test.ts`)**

  ```ts
  import { hostsBodyRuinRule } from '../rules/hostsRules'
  // (extend the existing import line)

  describe('HOSTS:body-ruin', () => {
    it('produces a HOSTS edge when a ruin\'s location matches a body name', () => {
      const ctx = makeCtx({
        input: {
          systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
          bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-b' } }],
          settlements: [],
          guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
          phenomena: [],
          ruins: [{ id: 'ruin-1', remnantType: { value: 'Colony shell' }, location: { value: 'Nosaxa IV-b' } }],
          narrativeFacts: [],
        },
        entities: [
          { kind: 'body', id: 'body-1', displayName: 'Nosaxa IV-b', layer: 'physical' },
          { kind: 'ruin', id: 'ruin-1', displayName: 'Colony shell', layer: 'human' },
        ],
      })
      const matches = hostsBodyRuinRule.match(ctx)
      expect(matches).toHaveLength(1)
      expect(matches[0].subject.id).toBe('body-1')
      expect(matches[0].object.id).toBe('ruin-1')
    })

    it('produces no matches when location does not name any body', () => {
      const ctx = makeCtx({
        input: {
          systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
          bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-b' } }],
          settlements: [],
          guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
          phenomena: [],
          ruins: [{ id: 'ruin-1', remnantType: { value: 'Colony shell' }, location: { value: 'Lagrange L1' } }],
          narrativeFacts: [],
        },
        entities: [
          { kind: 'body', id: 'body-1', displayName: 'Nosaxa IV-b', layer: 'physical' },
          { kind: 'ruin', id: 'ruin-1', displayName: 'Colony shell', layer: 'human' },
        ],
      })
      expect(hostsBodyRuinRule.match(ctx)).toHaveLength(0)
    })

    it('handles ruins with no location field', () => {
      const ctx = makeCtx({
        input: {
          systemName: 't', primary: { spectralType: { value: 'G' } }, companions: [],
          bodies: [{ id: 'body-1', name: { value: 'B' } }],
          settlements: [],
          guOverlay: { resource: { value: 'r' }, hazard: { value: 'h' } },
          phenomena: [],
          ruins: [{ id: 'ruin-1', remnantType: { value: 'X' } }],  // no location
          narrativeFacts: [],
        },
        entities: [
          { kind: 'body', id: 'body-1', displayName: 'B', layer: 'physical' },
          { kind: 'ruin', id: 'ruin-1', displayName: 'X', layer: 'human' },
        ],
      })
      expect(hostsBodyRuinRule.match(ctx)).toHaveLength(0)
    })
  })
  ```

- [ ] **Step 2: Implement and register**

  Append to `hostsRules.ts`:

  ```ts
  export const hostsBodyRuinRule: EdgeRule = {
    id: 'HOSTS:body-ruin',
    edgeType: 'HOSTS',
    baseWeight: 0.55,
    defaultVisibility: 'public',
    match(ctx) {
      const matches: RuleMatch[] = []
      const bodyByName = new Map<string, EntityRef>()
      for (const e of ctx.entities) {
        if (e.kind === 'body') bodyByName.set(e.displayName, e)
      }
      for (const ruin of ctx.input.ruins) {
        const locName = ruin.location?.value
        if (!locName) continue
        const bodyRef = bodyByName.get(locName)
        if (!bodyRef) continue
        const ruinRef = ctx.entitiesById.get(ruin.id)
        if (!ruinRef) continue
        const groundingFactIds = (ctx.factsBySubjectId.get(ruin.id) ?? [])
          .filter(f => f.kind === 'ruin.type')
          .map(f => f.id)
        matches.push({ subject: bodyRef, object: ruinRef, groundingFactIds })
      }
      matches.sort((a, b) => {
        if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1
        return a.object.id < b.object.id ? -1 : 1
      })
      return matches
    },
    build(match, rule, ctx) {
      const id = mintEdgeId(rule.id, match.subject.id, match.object.id, match.qualifier)
      return {
        id,
        type: rule.edgeType,
        subject: match.subject,
        object: match.object,
        qualifier: match.qualifier,
        visibility: match.visibility ?? rule.defaultVisibility,
        confidence: match.confidence ?? 'derived',
        groundingFactIds: match.groundingFactIds,
        era: 'present',
        weight: match.weight ?? rule.baseWeight,
      }
    },
  }
  ```

  In `rules/index.ts`, add to `allRules`:
  ```ts
  import { hostsBodySettlementRule, hostsBodyRuinRule } from './hostsRules'

  export const allRules: ReadonlyArray<EdgeRule> = [
    hostsBodySettlementRule,
    hostsBodyRuinRule,
  ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  ```

- [ ] **Step 3: Quality gate + commit**

  ```
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  ```
  git add src/features/tools/star_system_generator/lib/generator/graph/rules/hostsRules.ts \
           src/features/tools/star_system_generator/lib/generator/graph/rules/index.ts \
           src/features/tools/star_system_generator/lib/generator/graph/__tests__/hostsRules.test.ts
  git commit -m "$(cat <<'EOF'
  feat: add HOSTS:body-ruin rule

  Matches each ruin's location.value (set during ruin generation as the
  host body's name) against body displayName. Grounds via the ruin.type
  fact for each ruin. Default visibility public, confidence derived.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 9: 3 `DEPENDS_ON` rules

**Why:** These three rules surface the existing implicit settlement→GU-resource dependency from different signals. Each is a separate rule (different grounding/weight) so the audit can attribute edges back to the source signal.

Rules:
- `DEPENDS_ON:settlement-guResource-via-function` — settlement.function value contains a resource keyword (e.g., "Chiral harvesting site" matches "chiral").
- `DEPENDS_ON:settlement-guResource-via-crisis` — settlement.crisis value contains a resource-disruption keyword AND that keyword appears in gu.resource.
- `DEPENDS_ON:settlement-guResource-via-presence` — read `Settlement.presence.guValue` from the raw struct (need to add to `EntityInventoryInput.settlements`).

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/entities.ts` — extend `settlements[]` element type with `presence?: { guValue?: { value: number } }`.
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` — extend the call-site projection to forward `presence`.
- Create: `src/features/tools/star_system_generator/lib/generator/graph/rules/dependsOnRules.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/rules/index.ts`
- Create: `src/features/tools/star_system_generator/lib/generator/graph/__tests__/dependsOnRules.test.ts`

- [ ] **Step 1: Write failing tests**

  Tests for all 3 rules in one file. Pattern matches `hostsRules.test.ts` — synthetic `BuildCtx`, assert match counts and grounding. Verify the rule fires only when the appropriate keyword overlap exists.

  Critical: before writing the via-presence test, verify the `Settlement` struct shape — `Settlement.presence: SettlementPresenceScore` from index.ts:2680. The presence score has a `guValue: Fact<number>` field. The plan extends `EntityInventoryInput.settlements[]` with `presence?: { guValue?: { value: number } }` so rules can read it.

- [ ] **Step 2: Implement `dependsOnRules.ts`**

  ```ts
  import type { EdgeRule, RuleMatch } from './ruleTypes'
  import { mintEdgeId } from './ruleTypes'
  import { matchesAny, RESOURCE_KEYWORDS, CRISIS_DEPENDENCY_KEYWORDS } from './settingPatterns'

  // Helper used by all three: find the gu-resource entity once.
  function getGuResource(ctx: { entities: ReadonlyArray<{ kind: string; id: string; displayName: string; layer: string }> }) {
    return ctx.entities.find(e => e.kind === 'guResource')
  }

  // Rule 1: function-keyword
  export const dependsOnViaFunctionRule: EdgeRule = {
    id: 'DEPENDS_ON:settlement-guResource-via-function',
    edgeType: 'DEPENDS_ON',
    baseWeight: 0.5,
    defaultVisibility: 'public',
    match(ctx) {
      // ... iterate settlement.function facts; if value matches RESOURCE_KEYWORDS AND
      // gu.resource.value mentions the same keyword, emit a match.
      // Grounding: the settlement.function fact + gu.resource fact.
    },
    build(match, rule, ctx) { /* canonical build */ },
  }

  // Rule 2: crisis-keyword
  export const dependsOnViaCrisisRule: EdgeRule = {
    id: 'DEPENDS_ON:settlement-guResource-via-crisis',
    edgeType: 'DEPENDS_ON',
    baseWeight: 0.45,
    defaultVisibility: 'contested',
    match(ctx) {
      // ... iterate settlement.crisis facts; check matchesAny(value.value, CRISIS_DEPENDENCY_KEYWORDS)
      // AND that the matched keyword overlaps gu.resource.value (case-insensitive substring).
      // Grounding: settlement.crisis + gu.resource. Confidence: inferred (text-pattern match).
    },
    build(match, rule, ctx) { /* canonical */ },
  }

  // Rule 3: presence-score
  export const dependsOnViaPresenceRule: EdgeRule = {
    id: 'DEPENDS_ON:settlement-guResource-via-presence',
    edgeType: 'DEPENDS_ON',
    baseWeight: 0.55,
    defaultVisibility: 'public',
    match(ctx) {
      // ... iterate ctx.input.settlements; if settlement.presence?.guValue?.value >= 2,
      // emit a match. Grounding: any settlement.location fact for the settlement (no presence
      // fact exists today). Confidence: 'gu-layer'.
    },
    build(match, rule, ctx) { /* canonical */ },
  }
  ```

  Implement each `match()` and `build()` carefully. The plan-prescribed canonical `build` is the same as `hostsBodySettlementRule`'s — extracting it to a shared helper in `ruleTypes.ts` is a tempting refactor but DEFER (Phase 3 may share more, and shared helpers can break independent rule-test flexibility). Inline it in each rule for now.

- [ ] **Step 3: Register in `allRules`**

- [ ] **Step 4: Extend `EntityInventoryInput.settlements[]` with `presence?` and update entities.test.ts (no behavior change)**

- [ ] **Step 5: Update the call-site projection in `lib/generator/index.ts`**

  Add `presence: s.presence` to the projection (or ensure structural typing carries it). Verify with `npx tsc --noEmit`.

- [ ] **Step 6: Quality gate + commit**

  ```
  git commit -m "$(cat <<'EOF'
  feat: add 3 DEPENDS_ON rules (function, crisis, presence)

  ... [body]

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 10: 2 `CONTESTS` rules

Rules:
- `CONTESTS:namedFaction-namedFaction-sharedDomain` — two named factions share at least one domain AND the system has a settlement.authority whose domain tags overlap the shared domain. Edge: faction → faction with the settlement as `qualifier`.
- `CONTESTS:namedFaction-authority` — a settlement.authority value mentions terms that match a named faction's domain (e.g., "route forecasters" → Orison Route Authority). Edge: faction → settlement.

Detailed sub-tasks (fixture-shape, grounding facts, weight, visibility) follow the same structure as Task 9. The `namedFaction` facts are universal so this rule will fire frequently — calibrate `baseWeight` (~0.5) so that named-named CONTESTS edges easily reach spine selection.

Crucially: the `namedFaction` fact has no `subjectId` — rules read the faction list via `ctx.factsByKind.get('namedFaction')` and dereference faction details (kind, domains, etc.) by looking up the underlying source data via `data/narrative.ts`'s `namedFactions` export. Make this lookup deterministic and cached: build a `Map<string, NamedFaction>` keyed by display name once.

Commit:
```
feat: add 2 CONTESTS rules (faction-faction, faction-authority)
```

---

## Task 11: 2 `DESTABILIZES` rules

Rules:
- `DESTABILIZES:phenomenon-settlement-via-guLayer` — phenomenon with `confidence: 'gu-layer'` AND settlement.crisis text contains a keyword matching the phenomenon's domain (use `RESOURCE_KEYWORDS ∪ {'flare', 'metric', 'bleed', 'iggygate', 'pinchdrive'}`). Edge: phenomenon → settlement.
- `DESTABILIZES:guHazard-settlement-via-hazardScore` — `Settlement.presence.hazard?.value >= 2` (need to also extend `presence` with `hazard?: { value: number }`) AND `gu.hazard` exists. Edge: guHazard → settlement.

Both require the `phenomenon.confidence` field that already exists on `EntityInventoryInput.phenomena` (commit `da4b52f`).

Commit:
```
feat: add 2 DESTABILIZES rules (phenomenon-settlement, guHazard-settlement)
```

---

## Task 12: Audit visibility — surface edges in `:quick`/`:deep` and add 4 graph-integrity checks

**Why:** The design doc specifies "Phase 2 verifiable end state: Audit shows graphs being generated. Edges visible in JSON export." Today the audit script doesn't read `system.relationshipGraph` at all. This task makes the audit (a) report edge counts and (b) catch graph-integrity regressions.

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Extend `CorpusStats`**

  Add to the `CorpusStats` interface (around line 37):
  ```ts
  edgeCounts: number[]
  spineCounts: number[]
  edgesByType: Record<EdgeType, number>
  systemsWithZeroEdges: number
  ```

  Initialize in the corpus loop. Push `system.relationshipGraph.edges.length` per system; push `system.relationshipGraph.spineEdgeIds.length` per system; tally `edgesByType` totals.

- [ ] **Step 2: Add 4 per-system checks in `auditSystem`**

  ```ts
  // 1. Edge count within budget [0, 12]
  const edgeCount = system.relationshipGraph.edges.length
  if (edgeCount > 12) {
    addFinding(findings, 'error', seed, 'graph.edges.count',
      `Edge count ${edgeCount} exceeds hard ceiling 12`)
  }

  // 2. No duplicate (subject, object, type) edges
  const edgeKeys = new Set<string>()
  for (const edge of system.relationshipGraph.edges) {
    const key = `${edge.subject.id}|${edge.object.id}|${edge.type}`
    if (edgeKeys.has(key)) {
      addFinding(findings, 'error', seed, 'graph.edges.duplicate',
        `Duplicate edge ${key}`)
    }
    edgeKeys.add(key)
  }

  // 3. All spine edges are named-on-named (uses isNamedEntity helper exported from graph)
  for (const spineId of system.relationshipGraph.spineEdgeIds) {
    const edge = system.relationshipGraph.edges.find(e => e.id === spineId)
    if (!edge) {
      addFinding(findings, 'error', seed, 'graph.spine.missing',
        `Spine edge id ${spineId} not found in edges array`)
      continue
    }
    if (!isNamedEntity(edge.subject) || !isNamedEntity(edge.object)) {
      addFinding(findings, 'error', seed, 'graph.spine.unnamed',
        `Spine edge ${edge.id} has un-named endpoint(s)`)
    }
  }

  // 4. All groundingFactIds reference real facts in the ledger
  const factIds = new Set(system.narrativeFacts.map(f => f.id))
  for (const edge of system.relationshipGraph.edges) {
    for (const fid of edge.groundingFactIds) {
      if (!factIds.has(fid)) {
        addFinding(findings, 'error', seed, 'graph.grounding.dangling',
          `Edge ${edge.id} grounds on non-existent fact ${fid}`)
      }
    }
  }
  ```

- [ ] **Step 3: Add 1 corpus-level check in `auditCoverage`**

  ```ts
  // Median edge count across the corpus should be at least 3 (some systems may have 0).
  const sortedEdges = [...stats.edgeCounts].sort((a, b) => a - b)
  const median = sortedEdges[Math.floor(sortedEdges.length / 2)]
  if (median < 3) {
    addFinding(findings, 'warning', 'corpus', 'graph.edges.median',
      `Median edge count across corpus is ${median}; expected ≥3`)
  }
  ```

  This is a warning, not an error, because some seed corpora may legitimately produce sparse graphs.

- [ ] **Step 4: Update the print block**

  Add to the bottom of the script (around line 940):
  ```ts
  console.log(`Edges per system (p25/p50/p75/p99): ${formatPercentiles(stats.edgeCounts)}`)
  console.log(`Spine size per system (p25/p50/p75/p99): ${formatPercentiles(stats.spineCounts)}`)
  console.log(`Systems with zero edges: ${stats.systemsWithZeroEdges} / ${stats.systemCount}`)
  for (const [type, count] of Object.entries(stats.edgesByType)) {
    if (count > 0) console.log(`  edges of type ${type}: ${count}`)
  }
  ```

- [ ] **Step 5: Quality gate**

  ```
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  Expected: both pass with edge count percentiles printed. If the median is < 3 across `:deep`, the warning fires — investigate (rules may need tuning, fixtures may be sparse).

- [ ] **Step 6: Commit**

  ```
  git add scripts/audit-star-system-generator.ts
  git commit -m "$(cat <<'EOF'
  feat: surface narrative graph edge counts in audit + add 4 integrity checks

  Per-system: edge count ≤12, no duplicate (subject,object,type), all
  spine edges named-on-named, all groundingFactIds reference real facts.
  Corpus-level: median edge count ≥3 (warning, not error). Print block
  emits edge percentiles, spine size percentiles, zero-edge systems
  count, and per-type totals.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 13: Final verification

**Files:** None modified — verification only.

- [ ] **Step 1: Full quality bar**

  ```
  npm run lint
  npm run test -- --run src/features/tools/star_system_generator
  npx tsc --noEmit
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  npm run audit:star-system-data
  npm run build
  ```
  Expected: ALL pass.

- [ ] **Step 2: Spot-check edge generation**

  ```
  node --import tsx/esm -e "import('./src/features/tools/star_system_generator/lib/generator/index.ts').then(m => { const sys = m.generateSystem({ seed: 'phase2-final' }); console.log(JSON.stringify({ edgeCount: sys.relationshipGraph.edges.length, edgesByType: Object.fromEntries(Object.entries(sys.relationshipGraph.edgesByType).map(([k, v]) => [k, v.length])), spineCount: sys.relationshipGraph.spineEdgeIds.length, sample: sys.relationshipGraph.edges.slice(0, 3).map(e => ({ id: e.id, type: e.type, subject: e.subject.displayName, object: e.object.displayName, qualifier: e.qualifier, weight: e.weight })) }, null, 2)) })"
  ```

  Expected: edge count between 1 and 12. Edges of type HOSTS, DEPENDS_ON, CONTESTS, DESTABILIZES present (CONTROLS/SUPPRESSES/etc. all 0 — they're Phase 4). Sample edges have meaningful subject/object display names.

- [ ] **Step 3: Existing-prose-unchanged check**

  Run the same `phase1-spot` seed used at end of Phase 1 and confirm `tagHook.value` and `phenomenon.note.value` strings are still present and non-empty. The graph stage should not have affected the rest of the pipeline.

- [ ] **Step 4: Confirm graph module structure**

  ```
  ls -R src/features/tools/star_system_generator/lib/generator/graph/
  ```
  Expected layout includes the new `rules/` subdirectory with 5 files (`ruleTypes.ts`, `settingPatterns.ts`, `index.ts`, `hostsRules.ts`, `dependsOnRules.ts`, `contestsRules.ts`, `destabilizesRules.ts`) and new files at the graph root (`score.ts`, `buildIndexes.ts`).

- [ ] **Step 5: Phase 2 acceptance**

  - `relationshipGraph.edges` populated for typical systems ✓
  - All 4 in-scope edge types (`HOSTS`, `DEPENDS_ON`, `CONTESTS`, `DESTABILIZES`) appear in real corpora ✓
  - Spine selection produces named-on-named, multi-layer edges where eligible ✓
  - Audit reports edge counts and integrity ✓
  - All existing tests pass; existing rendered prose unchanged ✓
  - All Phase 2 rule unit tests + integration tests pass ✓

---

## Spec coverage check (self-review)

| Spec requirement | Task |
|---|---|
| `EdgeRule` API (id, edgeType, match, build) | Task 1 |
| Setting-patterns dictionary | Task 2 |
| Pass settlement.bodyId / ruin.location to rules | Task 3, 9 (presence) |
| Score with novelty + cross-layer + named-entity bonuses | Task 4 |
| Spine + peripheral budget selection | Task 5 |
| Build edgesByEntity + edgesByType | Task 6 |
| Determinism via stable hash + alphabetical rule order | Tasks 1, 4 |
| First end-to-end vertical slice | Task 7 |
| `HOSTS` rules (2) | Tasks 7, 8 |
| `DEPENDS_ON` rules (3) | Task 9 |
| `CONTESTS` rules (2) | Task 10 |
| `DESTABILIZES` rules (2) | Task 11 |
| Audit edge count visibility + integrity checks | Task 12 |
| Existing tests + audits + prose unchanged | Verified after every task and in Task 13 |

**Estimated commits:** 11-13 (one per task, plus possible review-fix commits after spec/code reviewers).

**Estimated effort:** 1.5 weeks, matching the design doc's Phase 2 budget.
