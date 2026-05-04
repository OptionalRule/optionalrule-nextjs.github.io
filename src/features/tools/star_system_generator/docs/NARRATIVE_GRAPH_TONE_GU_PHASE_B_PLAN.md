# Tone/GU Phase B: Per-Tone Faction Generation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static 10-faction shared pool (`data/narrative.json:322`, loaded into every system at `lib/generator/index.ts:2789`) with per-tone composable faction generators. Same seed produces same factions deterministically; different tones produce systems with non-overlapping faction registers (cinematic = dramatic English-noir register; astronomy = clinical scientific-bureau register; balanced = current Kestrel/Red Vane mix). Corpus-level outcome: ≥100 unique faction names across 4800 systems instead of 10.

**Architecture:** New module `lib/generator/factions/` with deterministic per-tone generation. Replaces the static load at `lib/generator/index.ts:2789`. The 10 named factions in `data/narrative.json:namedFactions[]` migrate to the `balanced` tone's stem bank (preserving the current register as one of the three options). New per-system faction-cohesion test prevents cross-tone name mixing within a single system.

**Tech Stack:** TypeScript (strict, `isolatedModules: true`), Vitest, ESLint, existing audit scripts.

**Source spec:** [Master plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md) Phases table, row "Phase B".

**Branch:** Work on `develop`. Push to `origin/develop` after every successful task.

**Scope:**
- Task 1: Author per-tone stem banks + suffix banks. Three banks (cinematic, astronomy, balanced). Sized for ≥30 unique combinations per tone.
- Task 2: Implement `generateFactions(seed, tone, count)` in new module `lib/generator/factions/generateFactions.ts`. Deterministic seeding via existing `SeededRng`.
- Task 3: Wire generator into per-system construction at `lib/generator/index.ts:2789`. Replace the static `namedFactions.map(...)` with a per-system generated set.
- Task 4: Migrate or remove `data/narrative.json:namedFactions[]`. Migrated entries become the `balanced` tone's stem bank.
- Task 5: Per-system faction-cohesion test (no mixing dramatic/clinical names in a single system) + faction-name diversity audit check.
- Task 6: Regenerate `proseUnchanged.test.ts` snapshot (deliberate softening of byte-identical-default contract — second one after Phase 8 Task 1's spineSummary). Document explicitly.
- Task 7: Update master overview's Phases table to mark Phase B done.

**Out of scope:**
- Per-tone template variants (Phase C).
- Distribution + density axes (Phase D).
- Rule-file changes (faction-aware rules in `graph/rules/` are not retuned in this phase; the existing rules consume whichever facts the system carries — they don't care that the faction names are now generated).
- Faction backstory or domain authoring (the per-tone generator outputs name + kind + domains using the same shape as the current static factions; backstory enrichment is separate).
- Tagged faction references in `narrativeDomains` (in `data/narrative.json:394+`). Those reference specific faction names ("Helion Debt Synod" appears in `narrativeDomains.law.actors`); the migration in Task 4 either preserves them as the balanced register or removes them and lets domain.actors fall back to generic strings.

---

## Architectural Notes

### Why per-tone generation instead of per-tone larger pools

Three options were considered:

1. **Larger static pools per tone** (e.g., 30 cinematic factions, 30 astronomy, keep 10 balanced). Would technically increase corpus diversity, but every system still draws from the same 30. Two cinematic systems with similar seeds would still tend to share factions.

2. **Generated stems + suffixes per tone (CHOSEN).** Each system draws stems and suffixes deterministically from per-tone banks and composes them. With 12 stems × 8 suffixes = 96 combinations per tone, and per-system selection of 6–10 names, two same-tone systems are very unlikely to share more than 1–2 names. Corpus diversity is structurally bounded by combinations, not by pool size.

3. **Pure procedural names** (e.g., morphology rules, syllable composition). Highest diversity, but loses the authored character of the existing register. A "Carrion Synod" reads richer than a procedurally-generated "Brizenor Cabal."

Option 2 wins on diversity AND character. The stems and suffixes are authored (carry tone character); the composition is procedural (delivers diversity).

### Why this is the highest single-phase leverage in the sequence

The Phase 7 review's user-visible complaint was that "every system reads the same." Phase A fixes structural gates so weights actually fire. Phase C ships per-tone voice. But the name-level repetition — Kestrel here, Kestrel there, Kestrel everywhere — is what readers actually *see* first. Replacing the 10-card deck with hundreds of unique-per-system names dissolves the "everything reads the same" complaint at the corpus level even before voice changes ship in Phase C.

The adversarial reviewer found this; it didn't appear in the original Option A plan at all. This is why Phase B is sequenced second (right after Phase A's plumbing) instead of last.

### Why faction-cohesion-within-system is a required test, not optional

The per-tone bank approach has a subtle failure mode: the per-system `generateFactions(seed, tone, count)` call must consistently use the SAME tone for all factions in that system. If the generator accidentally fans out (e.g., picks each faction's tone independently per-faction), a `balanced` system could end up with `["Brothers of the Last Ledger", "Stellar Survey Cohort 7", "Red Vane Labor Combine"]` — mixing cinematic, astronomy, and balanced register in one system. This would read worse than today's homogeneous-but-repetitive output.

The test pins this contract: assert that all generated factions in a single system come from the same tone's stem+suffix bank. Test failure means the generator fan-out is leaking — fix the generator, not the test.

### Why migrate the 10 existing factions instead of deleting them

The 10 factions in `data/narrative.json:322-393` have authored character: `domains` arrays, `publicFace` descriptions, `kind` labels (banking cartel, megacorp extraction charter, etc.). That authored character would be lost if the generator output bare names. Migration preserves it: the generator's output for `tone='balanced'` includes the same 10 factions plus generated extensions, sharing the existing `domains`/`publicFace`/`kind` shapes for new entries.

This also makes the migration low-risk: existing systems generated with `tone='balanced'` continue to draw recognized factions (Kestrel, Red Vane, etc.) — they just now draw a different subset per system instead of all 10 every time.

### Determinism contract softening (the second one)

Phase 8 Task 1's `composeSpineSummary` fix was the FIRST deliberate softening of the byte-identical-default `proseUnchanged.test.ts` contract — it changed flag-OFF rendered prose for affected seeds.

Phase B is the SECOND. After Phase B, a system generated with `seed='X'` and `tone='balanced'` today produces faction set F = {Kestrel, Red Vane, Glasshouse, Veyra-Locke, Orison, Ninth Ledger, Ash Meridian, Helion, Pale Choir, Sepulcher} (all 10 loaded). After Phase B, the same seed produces faction set F' (a deterministic per-system subset, possibly with new generated entries). The 4 substantive prose surfaces in `proseUnchanged.test.ts` (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) WILL drift because they reference faction names.

Both softenings are intentional. The byte-identical-default contract was written when the surfaces were undergoing churn through Phases 0–7; now that the pipeline is mature, softening it in service of cross-system diversity is the right tradeoff.

The Phase B Task 6 commit must explicitly document the snapshot diff. Reviewers should look at the regenerated snapshot and confirm:
- The new prose still parses as valid English (no broken slot resolution).
- New faction names are recognizable as in-tone (a `balanced` snapshot still reads as Kestrel-register, not Carrion-register).
- The diff isn't masking an unrelated regression.

### Determinism (preserved)

- `generateFactions(seed, tone, count)` uses `SeededRng` forked from the existing `rootRng.fork('factions')` — a new fork point.
- Same seed + same tone + same count produces same faction set, always.
- Faction generation happens BEFORE `narrativeFacts` construction so the generated factions feed into the existing fact ledger via the same `narrativeFact({ kind: 'namedFaction', ... })` shape used today.

---

## File Structure

**Files added:**
- `src/features/tools/star_system_generator/lib/generator/factions/index.ts` — public exports (`generateFactions`, types).
- `src/features/tools/star_system_generator/lib/generator/factions/generateFactions.ts` — the deterministic generator.
- `src/features/tools/star_system_generator/lib/generator/factions/banks/cinematicBank.ts` — stems + suffixes for cinematic tone.
- `src/features/tools/star_system_generator/lib/generator/factions/banks/astronomyBank.ts` — stems + suffixes for astronomy tone.
- `src/features/tools/star_system_generator/lib/generator/factions/banks/balancedBank.ts` — stems + suffixes for balanced tone (migrated from `data/narrative.json:namedFactions[]` plus generated extensions).
- `src/features/tools/star_system_generator/lib/generator/factions/__tests__/generateFactions.test.ts` — unit tests + faction-cohesion-within-system test.

**Files modified:**
- `src/features/tools/star_system_generator/lib/generator/index.ts` — Task 3 (call site at line ~2789 replaces static `namedFactions.map(...)` with per-system generated set).
- `src/features/tools/star_system_generator/data/narrative.json` — Task 4 (remove `namedFactions[]` block at lines 322-393, OR keep with explicit "deprecated, see balancedBank.ts" comment).
- `src/features/tools/star_system_generator/lib/generator/data/narrative.ts` — Task 4 (remove the `namedFactions` export at line 54).
- `scripts/audit-star-system-generator.ts` — Task 5 (`narrative.factionNameDiversity` audit check).
- `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts.snap` — Task 6 (regenerated; deliberate softening).
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` — Task 7 (mark Phase B done).

**Files unchanged:**
- All edge rule files. Rules consume whichever facts the system carries — they don't care that names are generated.
- All template families (Phase C ships per-tone variants).
- Renderer.
- `data/narrative.json:narrativeDomains` — references to specific factions (e.g., `"Helion Debt Synod"` in `narrativeDomains.law.actors`) stay; balanced-tone systems still produce those names so the references remain valid.
- `phase6On.test.ts` — does not pin specific faction names, so byte-identical.

---

## Conventions

- Run `npx tsc --noEmit` as part of every task's verification.
- Commit message style: lowercase `<type>: <subject>` with the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer (HEREDOC for `git commit -m`).
- No comments in code unless WHY is non-obvious. The per-tone register choices in the bank files warrant brief comments explaining the tone intent.
- Push to `origin/develop` after every successful task.
- NEVER use `any`. Use `unknown`, specific interfaces, or union types. Prefix unused params with `_`.
- The `phase6On.test.ts` snapshot must remain stable across all tasks (it doesn't pin faction names). If it regenerates, STOP and diagnose — Phase B should not cascade into the graph-aware prose consumers.
- `proseUnchanged.test.ts` snapshot WILL regenerate at Task 6 — this is the deliberate softening. Inspect the diff manually before committing.
- Per-task quality gate (every task runs all of these and confirms green):
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run audit:star-system-generator:deep` after Task 5.

---

## Task 1: Author per-tone stem and suffix banks

**Why:** The bank size determines the corpus diversity ceiling. With 12 stems × 8 suffixes = 96 combinations per tone, and 6–10 names per system, the chance of two same-tone systems sharing more than 2 faction names is structurally low. Author the banks first; they're the irreducible authoring task.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/factions/banks/cinematicBank.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/factions/banks/astronomyBank.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/factions/banks/balancedBank.ts`

- [ ] **Step 1: Define the bank shape**

  Each bank file exports:
  ```ts
  export interface FactionBank {
    stems: readonly string[]
    suffixes: readonly string[]
    seedFactions: readonly SeedFaction[]  // optional pre-authored entries (used by balancedBank)
    kindByDomain: Record<string, readonly string[]>
  }

  export interface SeedFaction {
    name: string
    kind: string
    domains: readonly string[]
    publicFace: string
  }
  ```

  Place the type in `src/features/tools/star_system_generator/lib/generator/factions/index.ts` so the bank files import it.

- [ ] **Step 2: Author `cinematicBank.ts`**

  Cinematic register: dramatic English-noir. References to violence, debt, betrayal, mystery, religion. Examples:

  ```ts
  // Cinematic register: dramatic, noir-influenced English. Conjures
  // betrayal, debt, ritual, violence. Inspired by classic SF noir
  // (Iain M. Banks's Culture, K.J. Parker's Ironside, Yoon Ha Lee's
  // Hexarchate factions).
  export const cinematicBank: FactionBank = {
    stems: [
      'Carrion', 'Black Comet', 'Last Ledger', 'Crown of Dust',
      'Brothers of', 'Sisters of', 'Salt Wound', 'Iron Crown',
      'Vow-Breaker', 'Pale Saint', 'Red Wake', 'Knife-and-Crown',
    ],
    suffixes: [
      'Synod', 'Run', 'Cabal', 'Crown', 'Compact', 'Brotherhood',
      'Choir', 'Wake',
    ],
    seedFactions: [],
    kindByDomain: {
      war: ['mercenary brotherhood', 'oath-bound naval cabal', 'vendetta order'],
      crime: ['cartel of broken oaths', 'vow-breaker syndicate', 'salt-debt cartel'],
      religion: ['vow-binding cult', 'penitent order', 'last-rites synod'],
      labor: ['debt-bound brotherhood', 'salt-wage compact'],
      governance: ['shadow magistrate', 'witness-court'],
      trade: ['knife-debt cartel', 'salt-broker compact'],
    },
  }
  ```

  Target: 12 stems × 8 suffixes = 96 combinations.

- [ ] **Step 3: Author `astronomyBank.ts`**

  Astronomy register: clinical, scientific, bureaucratic. References to surveys, observatories, instruments, periodic phenomena. Examples:

  ```ts
  // Astronomy register: clinical, scientific-bureau English. Conjures
  // surveys, calibrations, observatory networks, archival authorities.
  // Inspired by NASA mission consortia, ESO operating divisions, IAU
  // working groups.
  export const astronomyBank: FactionBank = {
    stems: [
      'Bonn-Tycho', 'Stellar Survey Cohort', 'Calibration', 'Aperture',
      'Lambda', 'Pulsar Timing', 'Long Baseline', 'Spectral Census',
      'Tau Reticuli', 'Gamma Ledger', 'Catalog', 'Watch-Order',
    ],
    suffixes: [
      'Trust', 'Cohort', 'Bureau', 'Observatory', 'Consortium', 'Authority',
      'Service', 'Council',
    ],
    seedFactions: [],
    kindByDomain: {
      science: ['research consortium', 'survey trust', 'instrument-time authority'],
      governance: ['observational policy bureau', 'spectrum allocation council'],
      trade: ['calibration-licensing trust', 'pulsar-timing service'],
      espionage: ['signal authentication bureau'],
      religion: ['archive-order', 'catalog-keeping society'],
      law: ['standards observatory', 'measurement-court bureau'],
    },
  }
  ```

  Target: 12 stems × 8 suffixes = 96 combinations.

- [ ] **Step 4: Author `balancedBank.ts` (migration)**

  Migrate the existing 10 factions from `data/narrative.json:322-393` as `seedFactions`, plus add stems and suffixes for generated extensions. Examples:

  ```ts
  // Balanced register: the existing Kestrel/Red Vane/Glasshouse mix.
  // 10 seedFactions migrated from data/narrative.json:namedFactions[].
  // Generated extensions composed from the same register.
  export const balancedBank: FactionBank = {
    stems: [
      'Kestrel', 'Red Vane', 'Glasshouse', 'Veyra', 'Orison', 'Ninth Ledger',
      'Ash Meridian', 'Helion', 'Pale', 'Sepulcher', 'Iron Compact',
      'Long Hollow',
    ],
    suffixes: [
      'Compact', 'Combine', 'Concession', 'Office', 'Authority', 'Court',
      'Synod', 'Communion',
    ],
    seedFactions: [
      { name: 'Helion Debt Synod', kind: 'banking cartel', domains: ['trade', 'labor', 'governance'], publicFace: 'a debt-trust court that presents itself as neutral credit infrastructure' },
      { name: 'Veyra-Locke Concession', kind: 'megacorp extraction charter', domains: ['trade', 'ecology', 'labor'], publicFace: 'a concession office that treats resource law as a private operating system' },
      // ...the remaining 8 factions, copied verbatim from data/narrative.json
    ],
    kindByDomain: {
      // ...derived from the 10 seedFactions' kinds
    },
  }
  ```

  All 10 seedFactions copied verbatim. Stems + suffixes give ~96 generated extensions on top.

- [ ] **Step 5: Confirm bank sizes**

  Each bank should produce ≥30 unique combinations (target: ~96 each). Quick check:

  ```bash
  node --import tsx/esm -e "
  import('./src/features/tools/star_system_generator/lib/generator/factions/banks/cinematicBank.ts').then(m => {
    const combos = m.cinematicBank.stems.length * m.cinematicBank.suffixes.length
    console.log('cinematic combinations:', combos)
  })
  "
  ```

  Repeat for astronomy and balanced. All ≥30.

- [ ] **Step 6: Static checks**

  ```bash
  npx tsc --noEmit
  npm run lint
  ```

  Both clean.

- [ ] **Step 7: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: author per-tone faction stem and suffix banks

  Three bank files: cinematic (dramatic English-noir register),
  astronomy (clinical scientific-bureau register), balanced
  (migrated 10-faction Kestrel/Red Vane mix plus generated
  extensions).

  Each bank: ~12 stems × ~8 suffixes = ~96 combinations. With per-
  system selection of 6-10 names, two same-tone systems are
  structurally unlikely to share more than 1-2 faction names.

  Banks consumed by Task 2's generateFactions(). Bank size determines
  corpus diversity ceiling.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: Implement `generateFactions(seed, tone, count)`

**Why:** Task 1 ships the banks. Task 2 ships the deterministic composition logic that consumes them. The generator is pure: given the same seed + tone + count, it produces the same faction set.

**Files:**
- Add: `src/features/tools/star_system_generator/lib/generator/factions/index.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/factions/generateFactions.ts`
- Add: `src/features/tools/star_system_generator/lib/generator/factions/__tests__/generateFactions.test.ts`

- [ ] **Step 1: Define public types in `index.ts`**

  ```ts
  export interface GeneratedFaction {
    id: string
    name: string
    kind: string
    domains: readonly string[]
    publicFace: string
  }

  export { generateFactions } from './generateFactions'
  ```

- [ ] **Step 2: Implement `generateFactions.ts`**

  ```ts
  import type { GeneratorTone } from '../../../types'
  import type { SeededRng } from '../rng'
  import type { GeneratedFaction } from './index'
  import { cinematicBank } from './banks/cinematicBank'
  import { astronomyBank } from './banks/astronomyBank'
  import { balancedBank } from './banks/balancedBank'

  const BANK_BY_TONE = {
    balanced: balancedBank,
    cinematic: cinematicBank,
    astronomy: astronomyBank,
  } as const

  export function generateFactions(
    rng: SeededRng,
    tone: GeneratorTone,
    count: number,
  ): GeneratedFaction[] {
    const bank = BANK_BY_TONE[tone]
    const out: GeneratedFaction[] = []
    const usedNames = new Set<string>()

    // First, draw from seedFactions (preserves authored character at balanced).
    const seedDraws = Math.min(count, bank.seedFactions.length)
    const shuffledSeed = shuffleDeterministic([...bank.seedFactions], rng)
    for (let i = 0; i < seedDraws; i++) {
      const seed = shuffledSeed[i]
      out.push({
        id: nameToId(seed.name),
        name: seed.name,
        kind: seed.kind,
        domains: seed.domains,
        publicFace: seed.publicFace,
      })
      usedNames.add(seed.name)
    }

    // Then generate from stems + suffixes for the remaining count.
    while (out.length < count) {
      const stem = bank.stems[Math.floor(rng.next() * bank.stems.length)]
      const suffix = bank.suffixes[Math.floor(rng.next() * bank.suffixes.length)]
      const name = `${stem} ${suffix}`
      if (usedNames.has(name)) continue
      usedNames.add(name)
      out.push({
        id: nameToId(name),
        name,
        kind: pickKindForGenerated(bank, rng),
        domains: pickDomainsForGenerated(bank, rng),
        publicFace: defaultPublicFace(name, tone),
      })
    }

    return out
  }

  function shuffleDeterministic<T>(arr: T[], rng: SeededRng): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }

  function nameToId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  function pickKindForGenerated(bank: FactionBank, rng: SeededRng): string {
    // Pick a random domain from kindByDomain keys, then a random kind from its array.
    const domains = Object.keys(bank.kindByDomain)
    const domain = domains[Math.floor(rng.next() * domains.length)]
    const kinds = bank.kindByDomain[domain]
    return kinds[Math.floor(rng.next() * kinds.length)]
  }

  function pickDomainsForGenerated(bank: FactionBank, rng: SeededRng): readonly string[] {
    // Pick 2-3 domains from kindByDomain keys.
    const allDomains = Object.keys(bank.kindByDomain)
    const count = 2 + Math.floor(rng.next() * 2)
    const shuffled = shuffleDeterministic([...allDomains], rng)
    return shuffled.slice(0, count)
  }

  function defaultPublicFace(name: string, _tone: GeneratorTone): string {
    return `the public face of ${name} is reserved`
  }
  ```

  Note: the default `publicFace` is a placeholder. Generated factions don't carry the authored character of seedFactions. This is intentional — the priority is name diversity; richer authored character per generated faction is a follow-up.

- [ ] **Step 3: Add unit tests**

  In `__tests__/generateFactions.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { generateFactions } from '../generateFactions'
  import { createRng } from '../../rng'

  describe('generateFactions', () => {
    it('produces deterministic output for same seed + tone + count', () => {
      const a = generateFactions(createRng('seed-x'), 'cinematic', 8)
      const b = generateFactions(createRng('seed-x'), 'cinematic', 8)
      expect(a).toEqual(b)
    })

    it('produces different sets for different tones with same seed', () => {
      const cinematic = generateFactions(createRng('seed-x'), 'cinematic', 8)
      const astronomy = generateFactions(createRng('seed-x'), 'astronomy', 8)
      const cinematicNames = new Set(cinematic.map(f => f.name))
      const astronomyNames = new Set(astronomy.map(f => f.name))
      const overlap = [...cinematicNames].filter(n => astronomyNames.has(n))
      expect(overlap).toEqual([])
    })

    it('preserves seedFactions verbatim at balanced when count <= seedFactions.length', () => {
      const balanced = generateFactions(createRng('seed-y'), 'balanced', 6)
      // All 6 should come from the seedFactions (10 total seeds)
      expect(balanced.every(f => /Helion|Veyra|Orison|Ash Meridian|Glasshouse|Kestrel|Ninth Ledger|Red Vane|Sepulcher|Pale Choir/.test(f.name))).toBe(true)
    })

    it('extends past seedFactions with generated names when count > seedFactions.length', () => {
      const balanced = generateFactions(createRng('seed-z'), 'balanced', 15)
      expect(balanced).toHaveLength(15)
      // At least 5 names should be generated (not in the original 10)
      const seedNames = ['Helion Debt Synod', 'Veyra-Locke Concession', 'Orison Route Authority', 'Ash Meridian Navy', 'Glasshouse Biosafety Compact', 'Kestrel Free Compact', 'Ninth Ledger Office', 'Red Vane Labor Combine', 'Sepulcher Archive Court', 'Pale Choir Communion']
      const generated = balanced.filter(f => !seedNames.includes(f.name))
      expect(generated.length).toBeGreaterThanOrEqual(5)
    })

    it('faction-cohesion-within-system: all generated factions come from one tone bank', () => {
      // For each tone, verify no name from another tone's bank leaks in.
      const cinematic = generateFactions(createRng('cohesion-test'), 'cinematic', 10)
      const astronomyStems = ['Bonn-Tycho', 'Stellar Survey', 'Calibration', 'Aperture', 'Lambda', 'Pulsar Timing']
      const balancedStems = ['Kestrel', 'Red Vane', 'Glasshouse', 'Veyra', 'Orison']
      for (const f of cinematic) {
        expect(astronomyStems.every(s => !f.name.startsWith(s))).toBe(true)
        expect(balancedStems.every(s => !f.name.startsWith(s))).toBe(true)
      }
    })
  })
  ```

- [ ] **Step 4: Run tests**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/factions/__tests__/generateFactions.test.ts
  ```

  All pass.

- [ ] **Step 5: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All clean.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: implement deterministic per-tone generateFactions()

  Pure function: same seed + tone + count produces same faction set.
  Draws first from the bank's seedFactions (preserves authored
  character, esp. at balanced where the 10 migrated factions live),
  then composes from stems + suffixes for the remaining count.

  Faction-cohesion-within-system test pins the contract: all factions
  in a single system come from the same tone's bank. No mixing of
  cinematic/astronomy/balanced register within one system.

  Not yet wired into per-system construction (Task 3).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 3: Wire `generateFactions` into per-system construction

**Why:** Task 2 ships the generator. Task 3 replaces the static load at `lib/generator/index.ts:2789` with the per-system generated set. After this task, every generated system draws factions from per-tone banks instead of the shared 10-card pool.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts`

- [ ] **Step 1: Locate the existing static load**

  ```bash
  grep -n "namedFactions" src/features/tools/star_system_generator/lib/generator/index.ts
  ```

  Confirm:
  - Line 74: `import { humanRemnants, namedFactions, phenomena, remnantHooks } from './data/narrative'`
  - Line 2789: `...namedFactions.map((faction) => narrativeFact({ ... }))`

- [ ] **Step 2: Add the new import**

  Replace the line 74 import with:
  ```ts
  import { humanRemnants, phenomena, remnantHooks } from './data/narrative'
  import { generateFactions } from './factions'
  ```

  (Removes `namedFactions` from the existing import; adds new `generateFactions`.)

- [ ] **Step 3: Generate factions per-system before the narrativeFacts construction**

  Find the function that builds `narrativeFacts` (search for `narrativeFacts = [` or `const narrativeFacts =`). Before that array construction, add:

  ```ts
  const factions = generateFactions(
    rootRng.fork('factions'),
    options.tone,
    8,  // 8 generated factions per system; matches the typical "active cast" size
  )
  ```

  Then replace the `...namedFactions.map(...)` block at line ~2789 with:

  ```ts
  ...factions.map((faction) => narrativeFact({
    id: `faction.${faction.id}`,
    kind: 'namedFaction',
    subjectType: 'faction' as const,
    value: faction.name,
    confidence: 'human-layer',
    source: `${faction.publicFace}; ${faction.kind}`,
    sourcePath: `factions.${faction.id}`,
    tags: ['actor', faction.kind],
    domains: [...faction.domains],
  })),
  ```

  Same shape, just consuming the per-system `factions` instead of the static `namedFactions`.

- [ ] **Step 4: Run tests and capture the regenerated proseUnchanged failure**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts
  ```

  Expected: FAIL. The snapshot regenerates because faction names changed for default-tone seeds. This is the deliberate softening — Task 6 will regenerate the snapshot intentionally.

  For now, leave the snapshot as-is and continue with Task 3's commit. Task 6 lands the snapshot regeneration with explicit documentation.

- [ ] **Step 5: Run other tests**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  Expected: tsc clean, lint clean. Most tests pass except `proseUnchanged.test.ts` (deliberate, deferred to Task 6) and possibly `phase6On.test.ts` if it references specific faction names.

  If `phase6On.test.ts` regenerates: STOP. The graph-aware prose consumers reference faction names by structure (via the graph), not by hardcoded string. If their snapshot regenerates, it should be the same kind of "different faction names → different prose" drift as proseUnchanged. Decide: bundle into Task 6's deliberate softening, or narrow Task 3 scope to fix the cascade. Most likely the right call is bundle into Task 6.

- [ ] **Step 6: Commit (with explicit acknowledgment of the test failure)**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: wire generateFactions into per-system construction

  Replace the static namedFactions load at lib/generator/index.ts:2789
  with a per-system generated set drawn from the tone-conditioned
  banks. Adds rootRng.fork('factions') as a new fork point.

  proseUnchanged.test.ts intentionally fails after this commit (and
  possibly phase6On.test.ts). The deliberate softening is landed in
  Task 6 with explicit documentation of the snapshot diff. Build is
  green; only snapshot tests fail.

  This is the single highest-leverage commit in the Phase B sequence:
  the corpus-level "every system uses the same 10 factions" complaint
  resolves at this moment.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 4: Migrate or remove `data/narrative.json:namedFactions[]`

**Why:** With Task 3 wired, the static `namedFactions` array is dead code. The 10 entries have been migrated to `balancedBank.ts:seedFactions` (Task 1). Remove the JSON entries and the export.

**Files:**
- Modify: `src/features/tools/star_system_generator/data/narrative.json`
- Modify: `src/features/tools/star_system_generator/lib/generator/data/narrative.ts`

- [ ] **Step 1: Verify migration completeness**

  ```bash
  diff <(grep "name" src/features/tools/star_system_generator/data/narrative.json | grep -A1 namedFactions | head -20) <(grep "name:" src/features/tools/star_system_generator/lib/generator/factions/banks/balancedBank.ts | head -20)
  ```

  Visually confirm: all 10 names from `data/narrative.json:namedFactions[]` appear as `seedFactions` entries in `balancedBank.ts`. If any are missing, copy them over before deletion.

- [ ] **Step 2: Remove the JSON block**

  Edit `src/features/tools/star_system_generator/data/narrative.json`. Delete the entire `"namedFactions": [...]` block (lines ~322-393). Preserve the surrounding JSON structure (the `"narrativeDomains": {...}` block at line 394 stays).

- [ ] **Step 3: Remove the export**

  Edit `src/features/tools/star_system_generator/lib/generator/data/narrative.ts`. Find:
  ```ts
  namedFactions?: readonly NamedFaction[]
  ```
  (line ~36) and delete it.

  Find:
  ```ts
  export const namedFactions = typedNarrativeData.namedFactions ?? []
  ```
  (line 54) and delete it.

  Also delete the `NamedFaction` interface if it's defined in this file and no longer referenced.

- [ ] **Step 4: Verify no stragglers**

  ```bash
  grep -rn "namedFactions" src/features/tools/star_system_generator/ scripts/
  ```

  Expected output: only the bank file imports (`balancedBank.ts:seedFactions`) and possibly inert references in the audit script. Investigate any other matches and clean up.

- [ ] **Step 5: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  Expected: tsc clean, lint clean. `proseUnchanged.test.ts` continues to fail (deferred to Task 6).

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  refactor: remove deprecated namedFactions[] from narrative.json

  Task 3 wired generateFactions into per-system construction. The
  static namedFactions array is dead code. The 10 entries are
  preserved as balancedBank.seedFactions (Phase B Task 1 migration).

  Delete the data/narrative.json block (lines ~322-393) and the
  data/narrative.ts export. narrativeDomains' references to specific
  faction names ('Helion Debt Synod', etc.) stay valid because
  balanced-tone systems still produce those names via seedFactions.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Faction-cohesion test + diversity audit check

**Why:** Task 2 includes a per-system faction-cohesion test. Task 5 lifts it to corpus scale (across the deep audit, no system mixes register) and adds the diversity audit check (≥100 unique faction names across 4800 systems).

**Files:**
- Modify: `scripts/audit-star-system-generator.ts`

- [ ] **Step 1: Add the diversity check**

  In `scripts/audit-star-system-generator.ts`, find the corpus-aggregate-checks region. Add:

  ```ts
  // narrative.factionNameDiversity: across the deep-audit corpus, the union
  // of all generated faction names should exceed 100 unique entries (vs. the
  // pre-Phase-B static 10). Catches a regression where the per-tone generator
  // collapses to a small subset.
  const allFactionNames = new Set<string>()
  for (const sys of corpus) {
    for (const fact of sys.narrativeFacts) {
      if (fact.kind === 'namedFaction') {
        allFactionNames.add(fact.value.value)
      }
    }
  }
  if (allFactionNames.size < 100) {
    addFinding(findings, 'warning', 'corpus', 'narrative.factionNameDiversity',
      `Faction name diversity collapsed to ${allFactionNames.size} unique names across the deep-audit corpus (${corpus.length} systems). Expected ≥100 (Phase B per-tone faction generator regression).`)
  }
  ```

- [ ] **Step 2: Add per-system cohesion check**

  ```ts
  // narrative.factionCohesionWithinSystem: a single system's factions should
  // all come from the same tone's bank. Mixed-register names (e.g., a
  // 'balanced' system with 'Brothers of the Last Ledger' + 'Stellar Survey
  // Cohort 7') indicate the per-tone generator is fanning out per-faction
  // instead of per-system.
  const cinematicMarkers = ['Carrion', 'Brothers of', 'Sisters of', 'Pale Saint', 'Vow-Breaker', 'Black Comet']
  const astronomyMarkers = ['Bonn-Tycho', 'Stellar Survey', 'Calibration', 'Aperture', 'Pulsar Timing', 'Spectral Census']
  const factionNames = sys.narrativeFacts.filter(f => f.kind === 'namedFaction').map(f => f.value.value)
  const hasCinematic = factionNames.some(n => cinematicMarkers.some(m => n.includes(m)))
  const hasAstronomy = factionNames.some(n => astronomyMarkers.some(m => n.includes(m)))
  if (hasCinematic && hasAstronomy) {
    addFinding(findings, 'error', seed, 'narrative.factionCohesionWithinSystem',
      `System mixes cinematic and astronomy faction registers: ${factionNames.join(', ')}`)
  }
  ```

- [ ] **Step 3: Run deep audit**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: 0 findings of `narrative.factionNameDiversity` and `narrative.factionCohesionWithinSystem`.

  - If diversity check fails: bank sizes in Task 1 are too small. Add stems to bring combinations to ≥30 per tone.
  - If cohesion check fires: the generator in Task 2 is fanning out per-faction. Fix `generateFactions` to lock the tone for the entire call.

- [ ] **Step 4: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```

  All clean.

- [ ] **Step 5: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: add faction diversity + cohesion audit checks

  narrative.factionNameDiversity: across the deep-audit corpus
  (4800 systems), the union of all generated faction names should
  exceed 100 unique entries (vs. pre-Phase-B static 10).

  narrative.factionCohesionWithinSystem: a single system's factions
  must all come from one tone's bank. No mixing cinematic 'Brothers
  of the Last Ledger' with astronomy 'Stellar Survey Cohort 7'
  within one system.

  Both 0-findings post-Phase-B. Catches future regressions of either
  the bank size or the per-tone generator's locking discipline.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 6: Regenerate `proseUnchanged.test.ts` snapshot (deliberate softening)

**Why:** Tasks 3–5 leave `proseUnchanged.test.ts` failing because faction names changed for default-tone seeds. Task 6 regenerates the snapshot intentionally and documents the softening of the byte-identical-default contract.

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap`
- Possibly modify: `src/features/tools/star_system_generator/lib/generator/__tests__/__snapshots__/phase6On.test.ts.snap` (if Task 3 cascaded)

- [ ] **Step 1: Inspect the snapshot diff before regenerating**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts 2>&1 | head -100
  ```

  Read the diff. Confirm:
  - The drift is exclusively in faction-name-bearing prose (settlement hooks, whyHere, phenomenon notes that reference factions).
  - The drift is NOT in non-faction prose (system names, settlement names — unless the system name happens to reference a faction).
  - New faction names are recognizable as in-tone (the snapshot for `tone='balanced'` seeds still reads as Kestrel-register, not Carrion-register).

  If the diff includes unrelated changes (e.g., changed body[0] structure, missing slot resolution), STOP — Task 3 introduced an unintended cascade. Diagnose before regenerating.

- [ ] **Step 2: Regenerate the snapshot**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/proseUnchanged.test.ts -u
  ```

- [ ] **Step 3: Inspect the regenerated snapshot**

  ```bash
  git diff src/features/tools/star_system_generator/lib/generator/graph/render/__tests__/__snapshots__/proseUnchanged.test.ts.snap | head -200
  ```

  Confirm:
  - All 4 substantive prose surfaces (`systemName`, `settlementTagHooks`, `settlementWhyHere`, `phenomenonNotes`) appear in the diff for affected seeds.
  - The new prose parses as valid English (no broken slot resolution, no `{slot}` placeholders leaking).
  - Faction names in the new snapshot are drawn from the balanced bank's seedFactions for default-tone seeds.

- [ ] **Step 4: Regenerate phase6On.test.ts if it cascaded**

  ```bash
  npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts
  ```

  - If passes: skip the rest of this step.
  - If fails: confirm the same kind of faction-name drift, then regenerate:
    ```bash
    npm run test -- --run src/features/tools/star_system_generator/lib/generator/__tests__/phase6On.test.ts -u
    ```
    Inspect the diff to confirm only faction-name-bearing prose changed.

- [ ] **Step 5: Per-task quality gate**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  npm run audit:star-system-generator:deep
  ```

  All green.

- [ ] **Step 6: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  test: regenerate proseUnchanged snapshot for Phase B faction generation

  Phase B Task 3 replaced the static namedFactions load with per-tone
  generateFactions(). For default-tone seeds (tone='balanced',
  gu='normal'), faction names now draw from balancedBank.seedFactions
  in a deterministic-per-system order rather than loading all 10 every
  time. The 4 substantive prose surfaces (systemName, settlementTag-
  Hooks, settlementWhyHere, phenomenonNotes) regenerate accordingly.

  This is the SECOND deliberate softening of the byte-identical-default
  contract (first was Phase 8 Task 1's composeSpineSummary fix). Both
  softenings are intentional: the byte-identical-default contract was
  written when surfaces were undergoing churn through Phases 0-7; now
  that the pipeline is mature, allowing it to evolve in service of
  cross-system faction diversity is the right tradeoff.

  Snapshot diff inspected manually: drift is exclusively in faction-
  name-bearing prose; faction names in the new snapshot are drawn from
  the balanced bank's seedFactions for default-tone seeds (still Kestrel
  / Red Vane / Glasshouse / etc., just a deterministic per-system
  subset rather than the full 10 every time).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 7: Update master overview's Phases table

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md`

- [ ] **Step 1: Mark Phase B done**

  Edit the master overview's Phases table. Change Phase B's Status cell:
  - From: `⏳ Not yet started — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_B_PLAN.md)`
  - To: `✅ Done — [plan](./NARRATIVE_GRAPH_TONE_GU_PHASE_B_PLAN.md)`

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "$(cat <<'EOF'
  docs: mark phase B complete in tone/gu master overview

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Spec coverage check (self-review)

| Spec requirement (from master overview) | Task |
|---|---|
| Author per-tone faction-name stem + suffix banks | Task 1 |
| Implement deterministic `generateFactions(seed, tone, count)` | Task 2 |
| Live in new `lib/generator/factions/` module | Tasks 1, 2 |
| Wire into per-system construction at line ~2789 | Task 3 |
| Migrate or remove `data/narrative.json:namedFactions[]` | Tasks 1, 4 |
| Snapshot tests: deterministic per seed | Task 2 |
| Faction-cohesion-within-system test | Tasks 2 (unit), 5 (audit) |
| Audit check: ≥100 unique faction names across 4800 systems | Task 5 |
| Document the byte-identical-default contract softening | Task 6 |

**Estimated commits:** 7 (one per task).

**Estimated effort:** ~5–7 days. Tasks 1 and 6 are the two biggest (authoring banks; inspecting snapshot diff).

---

## Risks & deferred items

- **Tagged faction references in `narrativeDomains`.** The `narrativeDomains.law.actors` array references `"Helion Debt Synod"` directly. As long as `balanced` tone produces this name (via `seedFactions`), the reference is valid. For `cinematic` and `astronomy` tones, the reference is to a faction that may not appear in this system — the existing `narrativeDomains.actors` arrays already include generic strings ("salvage court", "compliance judge") that work at any tone. Phase B doesn't break the references; it makes them resolve probabilistically per tone.
- **`publicFace` placeholder for generated factions.** Generated (non-seedFaction) entries get a placeholder `publicFace` string. Richer per-faction publicFace authoring is a follow-up; the priority is name diversity, not character depth per generated faction.
- **`phase6On.test.ts` snapshot cascade.** If Task 3 cascades into the graph-aware prose consumers' snapshots, Task 6 absorbs that regeneration. If the cascade is OUTSIDE the faction-name-bearing surfaces (e.g., body[0] structure changes, slot resolution failures), STOP — that's an unrelated bug surfaced by Phase B and warrants its own diagnosis.
- **Bank tuning.** First-cut stem and suffix banks may produce names that read awkwardly. Iteration loop: regenerate Task 6 snapshot, eyeball 10–20 random faction names, refine the bank. Iteration is bounded — the banks live in three files.
- **Faction-cohesion-within-system regex matching.** The Task 5 cohesion check uses substring markers (`'Carrion'`, `'Stellar Survey'`, etc.). If a balanced bank stem accidentally contains an astronomy marker substring (or vice versa), the check would false-positive. Curate the markers to be unique to their tone bank; if a name from balanced register accidentally matches an astronomy marker, regenerate the bank or tighten the markers.
- **Phase D distribution/density interaction.** Phase D's `distribution` axis (frontier/realistic) might benefit from faction-register variation too (e.g., frontier = scrappier names; realistic = more bureaucratic). That's a Phase D extension, not Phase B work. Keep Phase B's per-tone scoping; revisit if Phase D surveys flag it.
- **Snapshot regeneration discipline.** Task 6 is the second deliberate softening of the proseUnchanged contract. The PR review checklist must include "human-reviewed the regenerated snapshot diff and confirmed: drift is exclusively in faction-name-bearing prose; new faction names are in-tone; no broken slot resolution." Automated `vitest -u` regeneration without human review defeats the audit trail purpose.

---

## Outputs the next phase relies on

After Phase B:
- `lib/generator/factions/` is the canonical home for setting-aware named entities. Phase D could extend it with distribution-conditioned variants if needed.
- Per-tone faction registers are deterministic. Phase C's per-tone template variants will reference these factions via slots and benefit from the per-tone naming.
- `proseUnchanged.test.ts` snapshot is now per-system-faction-aware. Future faction-bank changes will regenerate it deliberately.
- `narrative.factionNameDiversity` and `narrative.factionCohesionWithinSystem` audit checks are live.
- The corpus-level "every system reads the same" complaint (Phase 7 review) is structurally addressed at the name layer. Phase C will finish the win at the voice layer.
