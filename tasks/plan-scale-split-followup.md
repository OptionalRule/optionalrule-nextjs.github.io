# Plan: Scale-Split Follow-Up

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline cascade matching the A→D commit pattern in `tasks/plan-scale-split.md`). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every deferred item from the scale-split cascade (one regression, distribution tuning, twelve new habitation patterns, four expansion items from plan section 8, plus the user-facing v2 announcement).

**Architecture:** Eight ordered phases (E1–E8) — each one is its own commit with audit-gate output in the body, matching the discipline of phases A–D. The order is dependency-driven: regression → tuning → patterns → prose → encounters → tone → tags → announcement.

**Tech Stack:** Existing — Next.js 15 static export, TypeScript strict, Vitest, the generator's JSON-backed tables. Blog post uses the project's MDX content pipeline + the `optional-writer` skill for voice.

---

## Locked decisions (do NOT re-litigate)

1. **Twelve new habitation patterns**, designed to span the iconic sci-fi vocabulary (Expanse, Culture, Mars Trilogy, classic O'Neill, Schismatrix). The full list with constraints is in the next section.
2. **Distribution target is The Expanse / Culture-series feel** — large urban centers should be common, swarms should be rare-but-iconic, abandoned/automated/exotic patterns under 10% combined except where dictated by site category.
3. **All eight items ship in this plan** — no further deferrals.
4. **Sky platform atmosphere gate**: Sky platform only fires on bodies whose `body.detail.atmosphere.value` is not `'None / hard vacuum'` and not `'Trace exosphere'`. Avoids producing aerostat habitats on airless rocks.
5. **Hub complex stays a habitation pattern, not a data-model change.** The implication of named child outposts shows up in prose + naming, not in the Settlement record. A future plan can promote it to a composite type if play surfaces a need.

---

## Pattern designs (locked)

### Twelve new patterns

| # | Pattern | Triggers on siteCategory | Joint pop constraint | Descriptor | Inspiration |
|---|---|---|---|---|---|
| 1 | `Ring station` | Orbital station, Deep-space platform | floor `1,001-10,000` | `Ring` | Stanford Torus, *Discovery One*, *Cooper Station*. Single rotating torus, not a planet-girdling megastructure |
| 2 | `O'Neill cylinder` | Orbital station, Deep-space platform | floor `10,001-100,000` | `Cylinder` | Babylon 5, Tycho Station, Gundam Side colonies |
| 3 | `Modular island station` | Orbital station, Asteroid or belt base, Deep-space platform, Gate or route node | none | `Cluster` | Loose chain of stations connected by shuttle hops |
| 4 | `Hub complex` | Surface settlement, Orbital station, Asteroid or belt base, Moon base, Deep-space platform, Gate or route node | floor `1,001-10,000` | `Reach` | Major settlement plus named satellite outposts |
| 5 | `Hollow asteroid` | Asteroid or belt base | floor `101-1,000` | `Spinhab` | Tycho, Eros — interior spinhab carved into rock |
| 6 | `Belt cluster` | Asteroid or belt base | floor `101-1,000` | `Chain` | Belter mining string of linked rocks |
| 7 | `Underground city` | Surface settlement, Moon base | floor `101-1,000` | `Warrens` | Ceres, Mars lava-tube colonies, Coober Pedy |
| 8 | `Sealed arcology` | Surface settlement, Moon base | none | `Arcology` | Mars Trilogy, Death Stranding |
| 9 | `Sky platform` | Surface settlement (atmosphere only) | floor `21-100` | `Float` | Bespin, Venus aerostats |
| 10 | `Tethered tower` | Surface settlement, Orbital station | none | `Beanstalk` | Space-elevator anchors; Mars Trilogy |
| 11 | `Drift colony` | Deep-space platform, Mobile site | none | `Drift` | Schismatrix-style untethered habs |
| 12 | `Generation ship` | Mobile site, Deep-space platform | band `1,001-10,000` through `100,001-1 million` | `Ark` | *Aurora* (KSR), *Hyperion*, *Pandora's Star* |

### Existing patterns (unchanged)

`Surface settlement`, `Orbital station`, `Asteroid or belt base`, `Moon base`, `Deep-space platform`, `Gate or route node`, `Distributed swarm`, `Automated`, `Abandoned` — 9 patterns, no constraint changes.

**Total: 21 habitation patterns** in the union after Phase E3.

### Roll allocation per siteCategory

The habitation roll moves from `d12` to `d20` to give the new patterns distinct band positions. Modifier values scale ×2 to preserve the presence-curve shape from Phase B.

```
roll <= 1: Abandoned
roll == 2: Automated
roll == 3: low-band exotic — pickOne(LOW_EXOTICS[siteCategory]) or default if empty
roll == 4-17: siteCategory default
roll == 18: high-band exotic — pickOne(HIGH_EXOTICS[siteCategory]) or default
roll == 19: high-band exotic — pickOne(HIGH_EXOTICS[siteCategory]) or default
roll >= 20: wildcard — Distributed swarm (all non-Mobile categories)
```

Two roll slots for high-band exotics give richer variety on categories with several candidates (Orbital station / Deep-space platform have four each).

| siteCategory | LOW_EXOTICS | HIGH_EXOTICS |
|---|---|---|
| `Surface settlement` | Underground city, Sealed arcology | Tethered tower, Hub complex, **Sky platform if atmosphere** |
| `Orbital station` | Modular island station | Ring station, O'Neill cylinder, Tethered tower, Hub complex |
| `Asteroid or belt base` | Hollow asteroid | Belt cluster, Modular island station, Hub complex |
| `Moon base` | Underground city, Sealed arcology | Hub complex |
| `Deep-space platform` | Drift colony, Modular island station | Ring station, O'Neill cylinder, Generation ship, Hub complex |
| `Gate or route node` | Modular island station | Hub complex |
| `Mobile site` (default `Distributed swarm`) | — | — (10% chance Generation ship, 10% chance Drift colony, else Distributed swarm) |
| `Derelict or restricted site` (default `Abandoned`) | — | — (always Abandoned) |

---

## Distribution targets (locked)

After tuning, on a 96-seed audit (all tone × density × distribution × gu cells, single iteration each, ≈350 settlements), expect:

| Bucket | Old (Phase D) | Target |
|---|---|---|
| Population `Unknown` | 35% | ≤ 12% (forced by Abandoned only; not on organic table) |
| Habitation `Distributed swarm` | 32% | 10–18% (Mobile site default + low-probability wildcard only) |
| Habitation `Abandoned` | 8% | 5–10% |
| Habitation `Automated` | 4% | 3–6% |
| Habitation new patterns combined | 0% | 18–28% |
| Habitation siteCategory defaults | 56% | 50–60% |
| Population `10+ million` | 8% | 12–18% (Earth/Mars-tier centers should be common) |
| Population `Minimal (<5)` | 5% | 4–8% |

These are guidance ranges — the audit logs should land within them but exact values depend on RNG.

---

## File map

Created:
- `content/posts/2026-05-04-star-system-generator-v2.mdx` (E8 announcement)

Modified:
- `src/features/tools/star_system_generator/types.ts` — extend `SettlementHabitationPattern` union (E3)
- `src/features/tools/star_system_generator/data/settlements.json` — populationTable rebalance (E2), `encounterSitesByPopulationBand` + `crisisByPopulationBand` (E5), tag civicScale field (E7), new pattern names referenced by descriptor map
- `src/features/tools/star_system_generator/data/names.json` — population descriptors map (E1), exact habitation descriptors for 12 new patterns (E3)
- `src/features/tools/star_system_generator/lib/generator/data/settlements.ts` — types + exports for new tables (E5)
- `src/features/tools/star_system_generator/lib/generator/data/names.ts` — types for population descriptors (E1)
- `src/features/tools/star_system_generator/lib/generator/index.ts` — `settlementDescriptorForPopulation` (E1), populationTable rebalance (E2), exotic-band data structures + extended habitation roll (E3, E6), `applyHabitationPopulationConstraint` extension (E3), `chooseEncounterSites`/`chooseSettlementCrisis` band-aware (E5), `chooseSettlementTags` band-weighted (E7), tone modifier (E6)
- `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts` — per-pattern pressure sentences for all 12 new patterns (E4)
- `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts` — variant tests for each new pattern (E4)
- `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts` — joint-constraint assertions for the 12 new patterns (E3), tone-distribution test (E6), tag-band test (E7)
- `src/features/tools/star_system_generator/__tests__/settlement-data.test.ts` — assert presence of new tables (E5, E7)
- `scripts/audit-star-system-generator.ts` — extend joint-constraint validator (E3)

---

## Phase E1: Hub naming regression fix

**Files:**
- Modify: `src/features/tools/star_system_generator/data/names.json`
- Modify: `src/features/tools/star_system_generator/lib/generator/data/names.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts`
- Test: `src/features/tools/star_system_generator/__tests__/name-data.test.ts`

The legacy `"million|Regional|Large"` keyword rule fired on the legacy `scale` string `"1-10 million people"`. After Phase B, the descriptor lookup receives a `habitationPattern` instead, so large populations stopped getting `"Hub"` in their names. Fix: add a parallel population-keyed descriptor track.

- [x] **Step 1: Add `population` descriptor section to names.json**

`src/features/tools/star_system_generator/data/names.json` — under `settlementNameDescriptors`, after the `scale` block:

```json
"population": {
  "exact": {
    "10+ million": "Hub",
    "1-10 million": "Hub",
    "100,001-1 million": "Center",
    "10,001-100,000": "District",
    "1,001-10,000": "Town",
    "101-1,000": "Outpost",
    "21-100": "Camp",
    "1-20": "Hold",
    "Minimal (<5)": "Watch",
    "Unknown": "Site"
  },
  "default": "Site"
}
```

- [x] **Step 2: Extend the descriptor type model**

`src/features/tools/star_system_generator/lib/generator/data/names.ts`:

```ts
export interface SettlementNameDescriptors {
  function: RuleBackedDescriptorSet
  category: Record<string, string>
  authority: RuleBackedDescriptorSet
  scale: ScaleDescriptorSet
  population: { exact: Record<string, string>; default: string }
}
```

- [x] **Step 3: Add the descriptor lookup helper in index.ts**

After `settlementDescriptorForHabitationPattern`:

```ts
function settlementDescriptorForPopulation(population: SettlementPopulation): string {
  return (
    settlementNameDescriptors.population.exact[population] ??
    settlementNameDescriptors.population.default
  )
}
```

- [x] **Step 4: Wire the population descriptor into `generateSettlementName`**

```ts
function generateSettlementName(
  rng: SeededRng,
  body: OrbitingBody,
  anchor: SettlementAnchor,
  siteCategory: string,
  settlementFunction: string,
  authority: string,
  population: SettlementPopulation,
  habitationPattern: SettlementHabitationPattern
): string {
  const anchorStem = anchor.name.split(',')[0].replace(/\s+(orbital space|route geometry|traffic pattern|transit geometry)$/i, '')
  const functionDescriptor = settlementDescriptorForFunction(settlementFunction)
  const categoryDescriptor = settlementDescriptorForCategory(siteCategory)
  const authorityDescriptor = settlementDescriptorForAuthority(authority)
  const habitationDescriptor = settlementDescriptorForHabitationPattern(habitationPattern)
  const populationDescriptor = settlementDescriptorForPopulation(population)

  const pattern = rng.int(1, 5)
  if (pattern === 1) return `${anchorStem} ${functionDescriptor}`
  if (pattern === 2) return `${anchorStem} ${categoryDescriptor}`
  if (pattern === 3) return `${body.name.value} ${authorityDescriptor}`
  if (pattern === 4) {
    const useHabitation = rng.chance(0.5)
    return `${anchorStem} ${useHabitation ? habitationDescriptor : populationDescriptor}`
  }
  return `${body.name.value} ${functionDescriptor} ${rng.int(2, 99).toString().padStart(2, '0')}`
}
```

- [x] **Step 5: Update the call site in `generateSettlements`**

```ts
const baseSettlementName = generateSettlementName(
  rng.fork(`settlement-name-${index + 1}`),
  body,
  anchor,
  locationOption.category,
  settlementFunction,
  authority,
  population,
  habitationPattern,
)
```

- [x] **Step 6: Add the name-data test assertions**

`src/features/tools/star_system_generator/__tests__/name-data.test.ts` — extend `has settlement name descriptor fallbacks`:

```ts
expect(settlementNameDescriptors.population).toBeTruthy()
expect(settlementNameDescriptors.population.default).toBeTruthy()
expect(settlementNameDescriptors.population.exact['10+ million']).toBe('Hub')
expect(settlementNameDescriptors.population.exact['1-10 million']).toBe('Hub')
```

- [x] **Step 7: Run audit gates**

```bash
npm run lint && npm run test && npm run build
```

Expected: lint clean, all tests pass (snapshots may need updating). Update with `npx vitest run -u` if changes are benign.

- [x] **Step 8: Commit**

```bash
git add src/features/tools/star_system_generator/data/names.json \
        src/features/tools/star_system_generator/lib/generator/data/names.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/name-data.test.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E1 — restore Hub naming for large populations

The Phase B rename of settlementDescriptorForScale →
settlementDescriptorForHabitationPattern broke the old "million|Large|
Regional → Hub" keyword rule, since the descriptor now sees habitation
patterns instead of legacy scale strings. Large settlements stopped
getting "Hub" in their generated names — a behavior regression caught
in the post-Phase D review.

Fix: parallel settlementNameDescriptors.population descriptor map
keyed on SettlementPopulation values, plus a
settlementDescriptorForPopulation lookup. generateSettlementName
takes population as a new parameter and pattern-4 (anchor +
descriptor) now 50/50-flips between the habitation descriptor and
the population descriptor — large urban centers ("Hub", "Center"),
small outposts ("Camp", "Watch"), and everything between get a name
track that reflects their magnitude.

Audit gates:
- npm run test: <count> tests pass
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E2: Distribution tuning

**Files:**
- Modify: `src/features/tools/star_system_generator/data/settlements.json` (`populationTable`)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (roll functions)

Unknown is too heavy at the d10 high-end. Distributed swarm fires too often on non-Mobile categories. Both pull the corpus away from the Expanse / Culture feel.

**Note:** This phase ships the *interim* tighter d12 habitation roll. Phase E3 then promotes it to d20 with the exotic-band data structures. The interim step keeps the diff reviewable — distribution tuning lands in isolation, then the new patterns layer on top.

- [x] **Step 1: Reorder populationTable**

`data/settlements.json`:

```json
"populationTable": [
  "Minimal (<5)",
  "1-20",
  "21-100",
  "101-1,000",
  "1,001-10,000",
  "10,001-100,000",
  "100,001-1 million",
  "1-10 million",
  "10+ million",
  "10+ million"
]
```

`Unknown` stays in the union (locked) but is no longer organically rolled — it is forced only by the Abandoned joint constraint.

- [x] **Step 2: Update the data-shape comment in `_notes`**

```json
"populationTable": "d10 settlement population table (magnitude only). Top two slots both map to 10+ million so high-presence systems favor large urban centers; Unknown is reserved for the Abandoned joint constraint and never rolled organically."
```

- [x] **Step 3: Tighten settlementHabitationPatternFromRoll (interim, d12)**

```ts
function settlementHabitationPatternFromRoll(
  rng: SeededRng,
  presence: SettlementPresenceScore,
  siteCategory: SettlementSiteCategory,
  population: SettlementPopulation,
): SettlementHabitationPattern {
  const defaultPattern = habitationPatternDefaults[siteCategory]
  if (defaultPattern === 'Distributed swarm' || defaultPattern === 'Abandoned') {
    return defaultPattern
  }

  let roll = d12(rng)
  if (presence.score <= 6) roll -= 2
  if (presence.score === 7 || presence.score === 8) roll -= 1
  if (presence.score >= 12) roll += 1
  if (presence.score >= 15) roll += 2

  if (roll <= 1) return 'Abandoned'
  if (roll === 2) return 'Automated'
  if (roll >= 12) return 'Distributed swarm'
  return defaultPattern
}
```

The Minimal-population secondary trigger for Automated is removed; `population` stays in the signature because Phase E3 reintroduces population-conditioned pattern selection.

- [x] **Step 4: Run gates and capture distribution**

```bash
npm run lint && npm run test && npm run build
npm run audit:star-system-generator:quick 2>&1 | grep -E "Settlement populations|Settlement habitation patterns" -A 2
```

- [x] **Step 5: Update snapshots if needed**

```bash
npx vitest run -u
```

- [x] **Step 6: Commit**

```bash
git add src/features/tools/star_system_generator/data/settlements.json \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E2 — distribution tuning toward Expanse/Culture feel

The Phase D audit showed Unknown population at 35% and Distributed
swarm habitation at 32% — both heavy enough to push the corpus away
from the iconic-sci-fi feel where large urban centers dominate and
exotic forms are rare-but-memorable. This phase rebalances both axes.

populationTable (settlements.json):
- Unknown removed from the organic d10 roll; only emitted via the
  Abandoned joint constraint
- top two slots both map to "10+ million" so a high-presence
  +modifier roll lands on Earth/Mars-tier populations rather than
  Unknown
- table remains 10 entries on d10 (plan section 2 lock preserved)

settlementHabitationPatternFromRoll (interim d12, before Phase E3
promotes to d20):
- Distributed swarm threshold tightened from roll >= 11 to roll == 12
  (was 2/12, now 1/12 on non-Mobile categories)
- the Minimal-population → Automated secondary trigger removed (it
  double-counted with the roll == 2 band)

Measured distribution (96-seed audit, all tone × density × distribution
× gu cells, single iteration each):
- before:  Unknown 35%, Distributed swarm 32%, defaults 56%, ...
- after:   <fill in from grep output>

Audit gates:
- npm run test: <count> tests pass
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E3: Twelve new habitation patterns

**Files:**
- Modify: `src/features/tools/star_system_generator/types.ts` (extend union)
- Modify: `src/features/tools/star_system_generator/data/names.json` (descriptor exact entries for 12 patterns)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (data structures + extended roll function + extended joint constraint)
- Modify: `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts` (per-pattern joint-constraint assertions)
- Modify: `scripts/audit-star-system-generator.ts` (audit-script joint-constraint validator)

- [x] **Step 1: Extend the union**

`src/features/tools/star_system_generator/types.ts`:

```ts
export type SettlementHabitationPattern =
  | 'Surface settlement'
  | 'Orbital station'
  | 'Asteroid or belt base'
  | 'Moon base'
  | 'Deep-space platform'
  | 'Gate or route node'
  | 'Distributed swarm'
  | 'Automated'
  | 'Abandoned'
  | 'Ring station'
  | "O'Neill cylinder"
  | 'Modular island station'
  | 'Hub complex'
  | 'Hollow asteroid'
  | 'Belt cluster'
  | 'Underground city'
  | 'Sealed arcology'
  | 'Sky platform'
  | 'Tethered tower'
  | 'Drift colony'
  | 'Generation ship'
```

- [x] **Step 2: Add descriptor exact entries**

`src/features/tools/star_system_generator/data/names.json` — `settlementNameDescriptors.scale.exact`:

```json
"exact": {
  "Automated": "Array",
  "Abandoned": "Remnant",
  "Distributed swarm": "Swarm",
  "Ring station": "Ring",
  "O'Neill cylinder": "Cylinder",
  "Modular island station": "Cluster",
  "Hub complex": "Reach",
  "Hollow asteroid": "Spinhab",
  "Belt cluster": "Chain",
  "Underground city": "Warrens",
  "Sealed arcology": "Arcology",
  "Sky platform": "Float",
  "Tethered tower": "Beanstalk",
  "Drift colony": "Drift",
  "Generation ship": "Ark"
}
```

- [x] **Step 3: Population-band helpers**

In `src/features/tools/star_system_generator/lib/generator/index.ts`, replace the existing `applyHabitationPopulationConstraint` block with:

```ts
const POPULATION_ORDER: readonly SettlementPopulation[] = [
  'Minimal (<5)',
  '1-20',
  '21-100',
  '101-1,000',
  '1,001-10,000',
  '10,001-100,000',
  '100,001-1 million',
  '1-10 million',
  '10+ million',
]

const POPULATION_BAND_INDEX: Record<SettlementPopulation, number> = {
  'Minimal (<5)': 0,
  '1-20': 1,
  '21-100': 2,
  '101-1,000': 3,
  '1,001-10,000': 4,
  '10,001-100,000': 5,
  '100,001-1 million': 6,
  '1-10 million': 7,
  '10+ million': 8,
  Unknown: -1,
}

function clampPopulationToFloor(population: SettlementPopulation, floorIndex: number): SettlementPopulation {
  const idx = POPULATION_BAND_INDEX[population]
  if (idx < 0) return POPULATION_ORDER[floorIndex]
  if (idx >= floorIndex) return population
  return POPULATION_ORDER[floorIndex]
}

function clampPopulationToBand(
  population: SettlementPopulation,
  floorIndex: number,
  ceilingIndex: number,
  rng: SeededRng,
): SettlementPopulation {
  const idx = POPULATION_BAND_INDEX[population]
  if (idx < 0) {
    return POPULATION_ORDER[rng.int(floorIndex, ceilingIndex)]
  }
  if (idx < floorIndex) return POPULATION_ORDER[floorIndex]
  if (idx > ceilingIndex) return POPULATION_ORDER[ceilingIndex]
  return population
}

function applyHabitationPopulationConstraint(
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
  rng: SeededRng,
): SettlementPopulation {
  if (habitationPattern === 'Abandoned') return 'Unknown'
  if (habitationPattern === 'Automated') return 'Minimal (<5)'
  if (habitationPattern === 'Underground city') return clampPopulationToFloor(population, 3)
  if (habitationPattern === 'Hollow asteroid') return clampPopulationToFloor(population, 3)
  if (habitationPattern === 'Belt cluster') return clampPopulationToFloor(population, 3)
  if (habitationPattern === 'Sky platform') return clampPopulationToFloor(population, 2)
  if (habitationPattern === 'Ring station') return clampPopulationToFloor(population, 4)
  if (habitationPattern === 'Hub complex') return clampPopulationToFloor(population, 4)
  if (habitationPattern === "O'Neill cylinder") return clampPopulationToFloor(population, 5)
  if (habitationPattern === 'Generation ship') return clampPopulationToBand(population, 4, 6, rng)
  return population
}
```

- [x] **Step 4: Exotic-band data structures**

Above the roll function:

```ts
const HABITATION_LOW_EXOTICS: Record<SettlementSiteCategory, readonly SettlementHabitationPattern[]> = {
  'Surface settlement': ['Underground city', 'Sealed arcology'],
  'Orbital station': ['Modular island station'],
  'Asteroid or belt base': ['Hollow asteroid'],
  'Moon base': ['Underground city', 'Sealed arcology'],
  'Deep-space platform': ['Drift colony', 'Modular island station'],
  'Gate or route node': ['Modular island station'],
  'Mobile site': [],
  'Derelict or restricted site': [],
}

const HABITATION_HIGH_EXOTICS_BASE: Record<SettlementSiteCategory, readonly SettlementHabitationPattern[]> = {
  'Surface settlement': ['Tethered tower', 'Hub complex'],
  'Orbital station': ['Ring station', "O'Neill cylinder", 'Tethered tower', 'Hub complex'],
  'Asteroid or belt base': ['Belt cluster', 'Modular island station', 'Hub complex'],
  'Moon base': ['Hub complex'],
  'Deep-space platform': ['Ring station', "O'Neill cylinder", 'Generation ship', 'Hub complex'],
  'Gate or route node': ['Hub complex'],
  'Mobile site': [],
  'Derelict or restricted site': [],
}

function bodyHasAtmosphere(body: OrbitingBody): boolean {
  const atm = body.detail.atmosphere.value
  return atm !== 'None / hard vacuum' && atm !== 'Trace exosphere'
}

function highExoticsFor(siteCategory: SettlementSiteCategory, body: OrbitingBody): readonly SettlementHabitationPattern[] {
  const base = HABITATION_HIGH_EXOTICS_BASE[siteCategory]
  if (siteCategory === 'Surface settlement' && bodyHasAtmosphere(body)) {
    return [...base, 'Sky platform']
  }
  return base
}
```

- [x] **Step 5: Replace the habitation roll function**

```ts
function settlementHabitationPatternFromRoll(
  rng: SeededRng,
  presence: SettlementPresenceScore,
  siteCategory: SettlementSiteCategory,
  body: OrbitingBody,
  population: SettlementPopulation,
): SettlementHabitationPattern {
  const defaultPattern = habitationPatternDefaults[siteCategory]

  if (defaultPattern === 'Distributed swarm') {
    if (rng.chance(0.1)) return 'Generation ship'
    if (rng.chance(0.1)) return 'Drift colony'
    return defaultPattern
  }
  if (defaultPattern === 'Abandoned') return defaultPattern

  let roll = d20(rng)
  if (presence.score <= 6) roll -= 4
  if (presence.score === 7 || presence.score === 8) roll -= 2
  if (presence.score >= 12) roll += 2
  if (presence.score >= 15) roll += 4

  if (roll <= 1) return 'Abandoned'
  if (roll === 2) return 'Automated'

  if (roll === 3) {
    const pool = HABITATION_LOW_EXOTICS[siteCategory]
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll === 18 || roll === 19) {
    const pool = highExoticsFor(siteCategory, body)
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll >= 20) return 'Distributed swarm'

  return defaultPattern
}
```

The `population` param is unused inside the roll function now, but it stays in the signature so the joint-constraint application below the call site has the rolled value to clamp. Add `// eslint-disable-line @typescript-eslint/no-unused-vars` if needed, or remove the param and pass population directly to `applyHabitationPopulationConstraint` only — the simpler form removes it from the function. Use the simpler form: drop `population` from the signature.

```ts
function settlementHabitationPatternFromRoll(
  rng: SeededRng,
  presence: SettlementPresenceScore,
  siteCategory: SettlementSiteCategory,
  body: OrbitingBody,
): SettlementHabitationPattern {
  // ... same body, no population reference
}
```

- [x] **Step 6: Update the call site in `generateSettlements`**

```ts
const rolledPopulation = settlementPopulationFromRoll(rng, presence)
const habitationPattern = settlementHabitationPatternFromRoll(
  rng.fork(`habitation-pattern-${index + 1}`),
  presence,
  locationOption.category,
  body,
)
const population = applyHabitationPopulationConstraint(
  habitationPattern,
  rolledPopulation,
  rng.fork(`population-clamp-${index + 1}`),
)
```

A new `population-clamp-${index+1}` fork keeps the Generation-ship band-clamp deterministic without consuming from the main RNG stream.

- [x] **Step 7: Joint-constraint assertions in determinism test**

`src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts` — extend the `keeps automated and abandoned settlement crises habitationPattern-aware` test, adding inside the for-loop body:

```ts
const POPULATION_BAND_INDEX_TEST: Record<string, number> = {
  'Minimal (<5)': 0, '1-20': 1, '21-100': 2, '101-1,000': 3,
  '1,001-10,000': 4, '10,001-100,000': 5, '100,001-1 million': 6,
  '1-10 million': 7, '10+ million': 8,
}

if (settlement.habitationPattern.value === 'Underground city') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(3)
}
if (settlement.habitationPattern.value === 'Hollow asteroid') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(3)
}
if (settlement.habitationPattern.value === 'Belt cluster') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(3)
}
if (settlement.habitationPattern.value === 'Sky platform') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(2)
}
if (settlement.habitationPattern.value === 'Ring station') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(4)
}
if (settlement.habitationPattern.value === 'Hub complex') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(4)
}
if (settlement.habitationPattern.value === "O'Neill cylinder") {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(5)
}
if (settlement.habitationPattern.value === 'Generation ship') {
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeGreaterThanOrEqual(4)
  expect(POPULATION_BAND_INDEX_TEST[settlement.population.value]).toBeLessThanOrEqual(6)
}
```

(Declare the index map once at the top of the test block.)

- [x] **Step 8: Audit-script joint-constraint extension**

`scripts/audit-star-system-generator.ts` — in the per-settlement validator, add:

```ts
const POPULATION_BAND_INDEX: Record<string, number> = {
  'Minimal (<5)': 0, '1-20': 1, '21-100': 2, '101-1,000': 3,
  '1,001-10,000': 4, '10,001-100,000': 5, '100,001-1 million': 6,
  '1-10 million': 7, '10+ million': 8,
}

const FLOOR_PATTERNS: Array<[string, number]> = [
  ['Underground city', 3],
  ['Hollow asteroid', 3],
  ['Belt cluster', 3],
  ['Sky platform', 2],
  ['Ring station', 4],
  ['Hub complex', 4],
  ["O'Neill cylinder", 5],
]

for (const [pattern, floor] of FLOOR_PATTERNS) {
  if (settlement.habitationPattern.value === pattern) {
    const idx = POPULATION_BAND_INDEX[settlement.population.value]
    if (idx === undefined || idx < floor) {
      addFinding(findings, 'error', seed, `${path}.population`, `${pattern} requires population band >= ${floor}; got "${settlement.population.value}".`)
    }
  }
}

if (settlement.habitationPattern.value === 'Generation ship') {
  const idx = POPULATION_BAND_INDEX[settlement.population.value]
  if (idx === undefined || idx < 4 || idx > 6) {
    addFinding(findings, 'error', seed, `${path}.population`, `Generation ship population must be band 4..6; got "${settlement.population.value}".`)
  }
}
```

(Module-level: declare `POPULATION_BAND_INDEX` and `FLOOR_PATTERNS` once near the existing audit constants.)

- [x] **Step 9: Run gates**

```bash
npm run lint && npm run test && npm run build
npm run audit:star-system-generator:quick 2>&1 | grep -E "Settlement habitation patterns" -A 22
```

- [x] **Step 10: Update snapshots**

```bash
npx vitest run -u
```

- [x] **Step 11: Commit**

```bash
git add src/features/tools/star_system_generator/types.ts \
        src/features/tools/star_system_generator/data/names.json \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts \
        scripts/audit-star-system-generator.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E3 — twelve new habitation patterns

Adds Ring station, O'Neill cylinder, Modular island station, Hub
complex, Hollow asteroid, Belt cluster, Underground city, Sealed
arcology, Sky platform, Tethered tower, Drift colony, and Generation
ship to SettlementHabitationPattern. Each is roll-only (no
siteCategory default change), each gets a name descriptor, and seven
of them carry joint population constraints derived from sci-fi-canon
plausibility:

- Sky platform: floor band 2 (≥21 — small aerostats exist)
- Underground city / Hollow asteroid / Belt cluster: floor band 3
  (≥101 — smaller than that isn't a "city", "spinhab", or "chain")
- Ring station / Hub complex: floor band 4 (≥1,001 — engineering
  scale, satellite-outpost coordination)
- O'Neill cylinder: floor band 5 (≥10,001 — cylinders are bigger)
- Generation ship: band 4..6 (1k-10k through 100k-1M — slow-boats are
  mid-sized, not Earth-tier, not five-person)
- Modular island, Sealed arcology, Tethered tower, Drift colony:
  no constraint (they span scales)

Habitation roll moves d12 → d20 to give all twelve new patterns
distinct band positions. Modifier values scale ×2 to preserve the
presence-curve shape from Phase B.

Roll allocation:
- roll <= 1: Abandoned
- roll == 2: Automated
- roll == 3: low-band exotic via pickOne(LOW_EXOTICS[siteCategory])
- roll == 4..17: siteCategory default
- roll == 18..19: high-band exotic via pickOne(HIGH_EXOTICS[siteCategory])
- roll >= 20: Distributed swarm wildcard

Each siteCategory has its own LOW/HIGH exotic candidate list (data
structure HABITATION_LOW_EXOTICS / HABITATION_HIGH_EXOTICS_BASE).
Sky platform is appended to Surface settlement's HIGH list at runtime
when the body has a non-vacuum atmosphere — keeps aerostat habitats
off airless rocks. Mobile-site categorical defaults gain a 10%/10%
chance to replace Distributed swarm with Generation ship / Drift
colony, giving those iconic forms a path in.

applyHabitationPopulationConstraint now takes a SeededRng (forked at
`population-clamp-${index+1}`) so the Generation-ship band-clamp
re-rolls deterministically when the magnitude axis lands outside its
allowed band.

Joint-constraint coverage:
- generator-determinism.test.ts: per-pattern band assertions added to
  the existing scale-coherence test for all seven floor-constrained
  patterns plus Generation ship's band constraint
- audit-star-system-generator.ts: per-settlement validator gains the
  same eight invariants — they fire across the full audit corpus,
  not just the test seeds

Audit gates:
- npm run test: <count> tests pass
- npm run build: 159 static pages, no TS errors
- npm run lint: clean
- audit:quick joint-constraint scan: 0 violations across <count>
  settlements
- new-pattern combined rate from audit: <fill in>%

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E4: Habitation-pattern-specific prose

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts`
- Modify: `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts`

Today, `settlementHookSynthesis` has only two pattern-specific branches (`Automated`, `Abandoned`). With 21 patterns now in the union, the prose track flattens. This phase adds dedicated pressure-sentence variants for every new pattern plus `Distributed swarm` (which never had its own).

- [x] **Step 1: Extend `settlementHookSynthesis` with all variants**

Replace the `pressure` block:

```ts
const pressure = (() => {
  const site = context.encounterSites[0].toLowerCase()
  switch (context.habitationPattern) {
    case 'Automated':
      return `Automation failure turns ${site} into the key scene.`
    case 'Abandoned':
      return `Salvage pressure centers on ${site}.`
    case 'Distributed swarm':
      return `Coordination drift across the swarm makes ${site} the choke point everyone fights over.`
    case 'Ring station':
      return `Ring-rotation politics — outer-rim labor against axis governance — tip into open conflict at ${site}.`
    case "O'Neill cylinder":
      return `Centripetal-axis politics divide the cylinder, and ${site} is where the floor-and-roof factions actually meet.`
    case 'Modular island station':
      return `The shuttle schedule between modules is the real political weapon, and ${site} is the next bottleneck.`
    case 'Hub complex':
      return `What the main reach decides about ${site} the satellite outposts will refuse to accept by morning.`
    case 'Hollow asteroid':
      return `Spin-axis vibrations and rock-failure rumors converge on ${site}.`
    case 'Belt cluster':
      return `The cluster's tether-bridges are fraying, and ${site} is the chokepoint for everyone trying to cross.`
    case 'Underground city':
      return `Surface signals never reach ${site}; whatever happens there stays buried.`
    case 'Sealed arcology':
      return `Internal-weather faults make ${site} the lung that keeps everyone alive.`
    case 'Sky platform':
      return `One bad updraft drops ${site} into the deck below; everyone here lives one storm from rebuild.`
    case 'Tethered tower':
      return `Tether-tension reports are political theater here — ${site} is where the bracing shows the truth.`
    case 'Drift colony':
      return `There is no gate, no route, and no rescue lane — ${site} is the only place to corner anyone.`
    case 'Generation ship':
      return `Decades of mid-voyage politics converge on ${site} the moment outsiders board.`
    default:
      if (context.guIntensity.includes('fracture') || context.guIntensity.includes('shear')) {
        return crisisPressureSentence(context.crisis, 'makes the GU work impossible to treat as routine')
      }
      return crisisPressureSentence(context.crisis, `keeps ${context.siteCategory.toLowerCase()} politics under stress`)
  }
})()
```

The `default` branch covers the six "ordinary" siteCategory-default patterns (Surface settlement, Orbital station, Asteroid or belt base, Moon base, Deep-space platform, Gate or route node), preserving the existing GU-fracture / generic crisis-pressure shape.

- [x] **Step 2: Add tests for each new branch**

Append to `settlementProse.test.ts`:

```ts
describe('settlementHookSynthesis — habitation-pattern variants', () => {
  const cases: Array<{ pattern: SettlementHabitationPattern; needle: string }> = [
    { pattern: 'Distributed swarm', needle: 'Coordination drift across the swarm' },
    { pattern: 'Ring station', needle: 'Ring-rotation politics' },
    { pattern: "O'Neill cylinder", needle: 'Centripetal-axis politics' },
    { pattern: 'Modular island station', needle: 'shuttle schedule between modules' },
    { pattern: 'Hub complex', needle: 'satellite outposts will refuse to accept' },
    { pattern: 'Hollow asteroid', needle: 'Spin-axis vibrations' },
    { pattern: 'Belt cluster', needle: "tether-bridges are fraying" },
    { pattern: 'Underground city', needle: 'Surface signals never reach' },
    { pattern: 'Sealed arcology', needle: 'Internal-weather faults' },
    { pattern: 'Sky platform', needle: 'one storm from rebuild' },
    { pattern: 'Tethered tower', needle: 'Tether-tension reports' },
    { pattern: 'Drift colony', needle: 'no gate, no route, and no rescue lane' },
    { pattern: 'Generation ship', needle: 'mid-voyage politics' },
  ]

  for (const { pattern, needle } of cases) {
    it(`uses pattern-specific pressure for ${pattern}`, () => {
      const rng = createSeededRng(`pattern-${pattern}`)
      const result = settlementHookSynthesis(rng, 'Gate Shadow', 'Archive War', {
        habitationPattern: pattern,
        siteCategory: 'orbital',
        settlementFunction: 'fueling depot',
        condition: 'Cramped',
        crisis: 'Bleed node changed course',
        hiddenTruth: 'A debt ledger nobody wants audited',
        encounterSites: ['Cargo dock', 'Maintenance airlock'],
        guIntensity: 'normal',
      })
      expect(result).toContain(needle)
    })
  }
})
```

(Add `import type { SettlementHabitationPattern } from '../../../../types'` if not already present.)

- [x] **Step 3: Run gates**

```bash
npm run lint && npm run test && npm run build
```

- [x] **Step 4: Update snapshots**

```bash
npx vitest run -u
```

- [x] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts \
        src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E4 — habitation-pattern-specific hook prose

settlementHookSynthesis previously branched on two patterns (Automated,
Abandoned) and fell through to a generic crisis-pressure sentence for
everything else. With 21 patterns now in the union, the prose track
flattens — a Ring station 1k-person settlement reads identical to a
Sealed arcology 1k-person settlement, even though the physical and
political setup is wildly different.

This phase adds dedicated pressure sentences for all twelve new
patterns plus Distributed swarm (which never had its own). Each
sentence is one line that establishes the defining tension specific
to that habitation form:

- Ring station: outer-rim labor vs axis governance
- O'Neill cylinder: floor-and-roof faction politics
- Modular island station: shuttle schedule as political weapon
- Hub complex: main reach decides, satellite outposts refuse
- Hollow asteroid: spin-axis vibration + rock-failure rumors
- Belt cluster: fraying tether-bridges + crossing chokepoints
- Underground city: surface-blind, whatever happens stays buried
- Sealed arcology: internal-weather-as-life-support fragility
- Sky platform: one-storm-from-rebuild
- Tethered tower: tether-tension as political theater
- Drift colony: no gate / no rescue / corner-of-the-system
- Generation ship: mid-voyage politics meet outsiders
- Distributed swarm: coordination drift + chokepoint fights

The default branch (six siteCategory-default patterns) preserves the
previous gu-fracture / generic crisis-pressure shape — those patterns
already match their siteCategory closely so the contextual sentence
still reads cleanly.

Tests:
- settlementProse.test.ts gains a parameterized variant block: one
  case per new pattern, asserting the pattern-specific needle phrase
  appears in the generated hook.

Audit gates:
- npm run test: <count> tests pass (13 new variant tests)
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E5: Population-scaled encounter sites + crises

**Files:**
- Modify: `src/features/tools/star_system_generator/data/settlements.json` (new dicts + new sites)
- Modify: `src/features/tools/star_system_generator/lib/generator/data/settlements.ts` (types + exports + helper)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (`chooseEncounterSites`, `chooseSettlementCrisis`)
- Modify: `src/features/tools/star_system_generator/__tests__/settlement-data.test.ts`

Large urban populations get distinctive scenes — overflow transit, mass-clinic queues, debt courts. Tiny populations get distinct scenes too — sealed-room politics, single-witness confrontations.

- [x] **Step 1: Add `populationBand` keying to settlements.json**

```json
"encounterSitesByPopulationBand": {
  "urban": [
    "Transit lock overflow",
    "Debt court queue",
    "District triage line",
    "Subway shelter platform",
    "Mass-clinic intake corridor"
  ],
  "town": [
    "Town hall annex",
    "Open-air market dock",
    "Single-bay clinic"
  ],
  "outpost": [
    "Single-room briefing cell",
    "Shared mess that doubles as a hearing",
    "Two-witness sealed lock"
  ]
},
"crisisByPopulationBand": {
  "urban": [
    "District-wide rolling blackouts",
    "Mass shelter lottery riot",
    "Transit grid failure during storm",
    "Debt court mass-eviction order",
    "Civic AI unionizes against operators"
  ],
  "outpost": [
    "Only qualified medic refuses to work",
    "The single backup generator failed in private",
    "One team member is lying about contamination",
    "The relief ship has been quietly diverted"
  ]
}
```

Population-band mapping:
- `urban` ← `100,001-1 million`, `1-10 million`, `10+ million`
- `town` ← `1,001-10,000`, `10,001-100,000`
- `outpost` ← `Minimal (<5)`, `1-20`, `21-100`, `101-1,000`
- `Unknown` → no override (fall through to general pool)

- [x] **Step 2: Append band-specific sites to the top-level `encounterSites` array**

Add every site referenced in `encounterSitesByPopulationBand` to the `encounterSites` array if not already present (so general-pool fallback can still produce them).

- [x] **Step 3: Extend types + exports + helper**

`src/features/tools/star_system_generator/lib/generator/data/settlements.ts`:

```ts
encounterSitesByPopulationBand: Record<string, readonly string[]>
crisisByPopulationBand: Record<string, readonly string[]>
```

```ts
export const encounterSitesByPopulationBand = typedSettlementsData.encounterSitesByPopulationBand
export const settlementCrisisByPopulationBand = typedSettlementsData.crisisByPopulationBand

export type SettlementPopulationBand = 'urban' | 'town' | 'outpost'

export function populationBandFor(population: import('../../../types').SettlementPopulation): SettlementPopulationBand | null {
  switch (population) {
    case '10+ million':
    case '1-10 million':
    case '100,001-1 million':
      return 'urban'
    case '10,001-100,000':
    case '1,001-10,000':
      return 'town'
    case '101-1,000':
    case '21-100':
    case '1-20':
    case 'Minimal (<5)':
      return 'outpost'
    case 'Unknown':
      return null
  }
}
```

- [x] **Step 4: Wire encounter-site selection through the band**

```ts
function chooseEncounterSites(
  rng: SeededRng,
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
  settlementFunction: string,
): string[] {
  const value = settlementFunction.toLowerCase()
  const candidates = new Set<string>()

  encounterSitesByHabitationPattern[habitationPattern]?.forEach((site) => candidates.add(site))
  const band = populationBandFor(population)
  if (band) encounterSitesByPopulationBand[band]?.forEach((site) => candidates.add(site))
  encounterSitesByFunctionKeyword.forEach((pool) => {
    if (pool.keywords.some((keyword) => value.includes(keyword))) {
      pool.sites.forEach((site) => candidates.add(site))
    }
  })
  if (candidates.size < 2) encounterSites.forEach((site) => candidates.add(site))

  const pool = [...candidates]
  const first = pickOne(rng, pool)
  const secondPool = pool.filter((site) => site !== first)
  return [first, pickOne(rng, secondPool.length ? secondPool : pool)]
}
```

Update the call site to pass `population`.

- [x] **Step 5: Wire crisis selection through the band**

```ts
function chooseSettlementCrisis(
  rng: SeededRng,
  habitationPattern: SettlementHabitationPattern,
  population: SettlementPopulation,
): string {
  if (settlementCrisisByHabitationPattern[habitationPattern]) {
    return pickOne(rng, settlementCrisisByHabitationPattern[habitationPattern])
  }
  const band = populationBandFor(population)
  if (band && settlementCrisisByPopulationBand[band] && rng.chance(0.4)) {
    return pickOne(rng, settlementCrisisByPopulationBand[band])
  }
  return pickOne(rng, settlementCrises)
}
```

The 40% chance preserves variety. Update the call site to pass `population`.

- [x] **Step 6: Update settlement-data tests**

Append to `settlement-data.test.ts`:

```ts
expect(encounterSitesByPopulationBand.urban?.length).toBeGreaterThan(0)
expect(encounterSitesByPopulationBand.town?.length).toBeGreaterThan(0)
expect(encounterSitesByPopulationBand.outpost?.length).toBeGreaterThan(0)
expect(settlementCrisisByPopulationBand.urban?.length).toBeGreaterThan(0)
expect(settlementCrisisByPopulationBand.outpost?.length).toBeGreaterThan(0)

for (const sites of Object.values(encounterSitesByPopulationBand)) {
  for (const site of sites) {
    expect(encounterSites).toContain(site)
  }
}
```

Add the imports for `encounterSitesByPopulationBand` and `settlementCrisisByPopulationBand`.

- [x] **Step 7: Run gates**

```bash
npm run lint && npm run test && npm run build
npx vitest run -u
```

- [x] **Step 8: Commit**

```bash
git add src/features/tools/star_system_generator/data/settlements.json \
        src/features/tools/star_system_generator/lib/generator/data/settlements.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/settlement-data.test.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E5 — population-scaled encounter sites + crises

A 10+ million-person settlement and a 12-person outpost previously
drew encounter sites and crises from the same general pools, with
no magnitude-aware override.

This phase introduces:
- encounterSitesByPopulationBand (urban / town / outpost) — 3 bands,
  ~5 sites per band, all also added to the general encounterSites
  pool for backward-compatibility
- crisisByPopulationBand (urban + outpost only — town stays in the
  general pool which already covers mid-magnitude scenarios)
- populationBandFor() helper that maps SettlementPopulation to a band
  (Unknown returns null and falls through to existing pools)

chooseEncounterSites unions encounter sites from habitationPattern,
populationBand, and function-keyword pools. chooseSettlementCrisis
prefers habitation overrides first, then 40%-rolls a band-specific
crisis when one exists, then falls back to the general pool — the
40% probability is tuned so band crises feel distinctive without
dominating rotation.

settlement-data.test.ts asserts each band has content and every
band-scoped site is also in the top-level encounterSites pool.

Audit gates:
- npm run test: <count> tests pass
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E6: Tone-axis joint distribution coloring

**Files:**
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (`settlementHabitationPatternFromRoll`)

Plan section 8 expansion: `cinematic` favors `Abandoned` / `Distributed swarm` / exotic forms; `astronomy` suppresses them. The d20 introduced in E3 supports a clean tone-modifier shift.

- [x] **Step 1: Pass tone into the habitation roll**

```ts
function settlementHabitationPatternFromRoll(
  rng: SeededRng,
  presence: SettlementPresenceScore,
  siteCategory: SettlementSiteCategory,
  body: OrbitingBody,
  tone: GeneratorTone,
): SettlementHabitationPattern {
  const defaultPattern = habitationPatternDefaults[siteCategory]

  if (defaultPattern === 'Distributed swarm') {
    const generationShipRate = tone === 'cinematic' ? 0.18 : tone === 'astronomy' ? 0.04 : 0.1
    const driftColonyRate = tone === 'cinematic' ? 0.18 : tone === 'astronomy' ? 0.04 : 0.1
    if (rng.chance(generationShipRate)) return 'Generation ship'
    if (rng.chance(driftColonyRate)) return 'Drift colony'
    return defaultPattern
  }
  if (defaultPattern === 'Abandoned') return defaultPattern

  let roll = d20(rng)
  if (presence.score <= 6) roll -= 4
  if (presence.score === 7 || presence.score === 8) roll -= 2
  if (presence.score >= 12) roll += 2
  if (presence.score >= 15) roll += 4

  if (tone === 'cinematic' && rng.chance(0.25)) roll -= 2
  if (tone === 'astronomy') roll = Math.max(5, Math.min(18, roll))

  if (roll <= 1) return 'Abandoned'
  if (roll === 2) return 'Automated'

  if (roll === 3) {
    const pool = HABITATION_LOW_EXOTICS[siteCategory]
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll === 18 || roll === 19) {
    const pool = highExoticsFor(siteCategory, body)
    if (pool.length > 0) return pickOne(rng, pool)
    return defaultPattern
  }
  if (roll >= 20) return 'Distributed swarm'

  return defaultPattern
}
```

- [x] **Step 2: Update the call site**

```ts
const habitationPattern = settlementHabitationPatternFromRoll(
  rng.fork(`habitation-pattern-${index + 1}`),
  presence,
  locationOption.category,
  body,
  options.tone,
)
```

- [x] **Step 3: Tone-distribution audit assertion**

Add to `generator-determinism.test.ts`:

```ts
it('tone-axis shifts settlement habitation distribution', () => {
  const settlementsByTone = (tone: GenerationOptions['tone']) =>
    Array.from({ length: 60 }, (_, index) =>
      generateSystem({
        ...options,
        tone,
        settlements: 'crowded',
        seed: `tone-axis-${tone}-${index.toString(16).padStart(4, '0')}`,
      }),
    ).flatMap((sys) => sys.settlements)

  const cinematic = settlementsByTone('cinematic')
  const astronomy = settlementsByTone('astronomy')

  const rate = (settlements: typeof cinematic, pattern: string) =>
    settlements.filter((s) => s.habitationPattern.value === pattern).length / settlements.length

  expect(rate(cinematic, 'Abandoned')).toBeGreaterThan(rate(astronomy, 'Abandoned'))
  expect(rate(cinematic, 'Distributed swarm')).toBeGreaterThan(rate(astronomy, 'Distributed swarm'))
})
```

- [x] **Step 4: Run gates**

```bash
npm run lint && npm run test && npm run build
npx vitest run -u
```

- [x] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E6 — tone-axis habitation distribution coloring

Plan section 8 expansion item: cinematic favors Abandoned, Distributed
swarm, and exotic patterns; astronomy suppresses them.
settlementHabitationPatternFromRoll now takes a GeneratorTone parameter
and applies two tone-specific modifiers on top of the existing
presence shape:

- cinematic: 25% chance of an additional -2 roll shift (pushes the
  d20 toward Abandoned and the siteCategory-specific low-band exotic
  patterns); on Mobile-site categorical defaults, Generation ship and
  Drift colony each bump from 10% to 18%
- astronomy: clamps the d20 roll to [5, 18] (rules out the Abandoned/
  Automated/exotic-low and Distributed-swarm-wildcard bands entirely
  on non-Mobile categories); on Mobile-site, Generation ship and
  Drift colony each drop from 10% to 4%
- balanced: unchanged behavior

Tested with a comparative rate assertion in
generator-determinism.test.ts: across 60 systems per tone, the
cinematic rate of Abandoned is strictly greater than the astronomy
rate, and the same holds for Distributed swarm.

Audit gates:
- npm run test: <count> tests pass (1 new tone-distribution test)
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E7: Population-conditioned tag weighting

**Files:**
- Modify: `src/features/tools/star_system_generator/data/settlements.json` (tag classification)
- Modify: `src/features/tools/star_system_generator/lib/generator/data/settlements.ts` (export)
- Modify: `src/features/tools/star_system_generator/lib/generator/index.ts` (`chooseSettlementTags`)
- Modify: `src/features/tools/star_system_generator/__tests__/settlement-data.test.ts`
- Modify: `src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts`

Plan section 8: very large populations should suppress low-drama tags (`Derelict Yard`) and boost civic-scale ones (`Strikebreaker City`). Data-driven via a `civicScale` axis on each tag.

- [x] **Step 1: Classify tags in settlements.json**

Each tag in the `tags` array gets a new optional field `civicScale: 'civic' | 'remote' | 'neutral'`. Default to `neutral` if not present. Concrete classification (engineer judgment, guidance below):

- **civic** = "implies a city, governance density, mass labor, or urban infrastructure dynamic" (e.g. `Strikebreaker City`, `Air Is Money`, `Triage State`, `Rationed City`)
- **remote** = "implies isolation, abandonment, single-actor scenarios, or a small-cell setup" (e.g. `Abandoned First Wave`, `Hidden Hermitage`, `Derelict Yard`, `Single-Witness Politics`)
- **neutral** = everything else; expect this to be the majority

Spot-check after classification: civic ≤ 30% of tags; remote ≤ 20%.

- [x] **Step 2: Extend the type**

`src/features/tools/star_system_generator/lib/generator/data/settlements.ts`:

```ts
export interface SettlementTagOption {
  id: string
  label: string
  pressure: string
  civicScale?: 'civic' | 'remote' | 'neutral'
}
```

The existing `settlementTagOptions` export already carries the field through the generic `as SettlementsData` cast.

- [x] **Step 3: Weight the tag pool by population band**

Replace `chooseSettlementTags`:

```ts
function chooseSettlementTags(rng: SeededRng, population: SettlementPopulation): [string, string] {
  const band = populationBandFor(population)
  const weighted: string[] = []
  for (const tag of settlementTagOptions) {
    const civicScale = tag.civicScale ?? 'neutral'
    let weight = 1
    if (band === 'urban') {
      if (civicScale === 'civic') weight = 3
      if (civicScale === 'remote') weight = 0
    } else if (band === 'outpost') {
      if (civicScale === 'remote') weight = 3
      if (civicScale === 'civic') weight = 0
    }
    for (let i = 0; i < weight; i++) weighted.push(tag.label)
  }
  if (weighted.length === 0) {
    settlementTagOptions.forEach((tag) => weighted.push(tag.label))
  }
  const obvious = pickOne(rng, weighted)
  const remaining = weighted.filter((label) => label !== obvious)
  const deeper = pickOne(rng, remaining.length > 0 ? remaining : weighted)
  return [obvious, deeper]
}
```

- [x] **Step 4: Update the call site**

In `generateSettlements`, after the population is finalized:

```ts
const tags = chooseSettlementTags(rng, population)
```

(Move `chooseSettlementTags` to after population is finalized so the band lookup has the right value.)

- [x] **Step 5: Update settlement-data tests**

Add to `settlement-data.test.ts`:

```ts
const civicScales = ['civic', 'remote', 'neutral'] as const
for (const tag of settlementTagOptions) {
  if (tag.civicScale !== undefined) {
    expect(civicScales).toContain(tag.civicScale)
  }
}
const civicCount = settlementTagOptions.filter((tag) => tag.civicScale === 'civic').length
const remoteCount = settlementTagOptions.filter((tag) => tag.civicScale === 'remote').length
expect(civicCount).toBeGreaterThan(0)
expect(remoteCount).toBeGreaterThan(0)
expect(civicCount).toBeLessThan(settlementTagOptions.length / 2)
expect(remoteCount).toBeLessThan(settlementTagOptions.length / 2)
```

- [x] **Step 6: Add a determinism-test assertion**

Add to `generator-determinism.test.ts`:

```ts
it('weights settlement tags toward civic at urban scale and remote at outpost scale', () => {
  const allSettlements = Array.from({ length: 200 }, (_, index) =>
    generateSystem({
      ...options,
      settlements: 'crowded',
      seed: `tag-band-${index.toString(16).padStart(4, '0')}`,
    }),
  ).flatMap((sys) => sys.settlements)

  const tagsByLabel = new Map(settlementTagOptions.map((tag) => [tag.label, tag.civicScale ?? 'neutral']))
  const urban = allSettlements.filter((s) => ['10+ million', '1-10 million', '100,001-1 million'].includes(s.population.value))
  const outpost = allSettlements.filter((s) => ['Minimal (<5)', '1-20', '21-100', '101-1,000'].includes(s.population.value))

  if (urban.length > 10) {
    const urbanCivicShare = urban.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'civic').length
    const urbanRemoteShare = urban.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'remote').length
    expect(urbanCivicShare).toBeGreaterThan(urbanRemoteShare)
  }
  if (outpost.length > 10) {
    const outpostCivicShare = outpost.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'civic').length
    const outpostRemoteShare = outpost.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'remote').length
    expect(outpostRemoteShare).toBeGreaterThan(outpostCivicShare)
  }
})
```

(`settlementTagOptions` import added.)

- [x] **Step 7: Run gates**

```bash
npm run lint && npm run test && npm run build
npx vitest run -u
```

- [x] **Step 8: Commit**

```bash
git add src/features/tools/star_system_generator/data/settlements.json \
        src/features/tools/star_system_generator/lib/generator/data/settlements.ts \
        src/features/tools/star_system_generator/lib/generator/index.ts \
        src/features/tools/star_system_generator/__tests__/settlement-data.test.ts \
        src/features/tools/star_system_generator/__tests__/generator-determinism.test.ts \
        src/features/tools/star_system_generator/lib/generator/**/__snapshots__/*.snap
git commit -m "$(cat <<'EOF'
refactor: phase E7 — population-conditioned tag weighting

Plan section 8 expansion item: very large populations suppress
low-drama tags (Derelict Yard, Hidden Hermitage) and boost civic-
scale ones (Strikebreaker City, Air Is Money). Tiny outposts
suppress civic tags that need a city to make sense.

Implementation is fully data-driven:
- each tag in settlements.json gains an optional civicScale field
  ('civic' | 'remote' | 'neutral'); the majority remain neutral
- chooseSettlementTags receives population and computes a
  populationBand via the helper added in phase E5
- on urban-band settlements, civic tags get weight 3 and remote tags
  get weight 0; on outpost-band settlements, remote tags get weight
  3 and civic get weight 0; town and Unknown bands keep uniform
  weighting
- when the weighted pool is empty (shouldn't fire in practice given
  the neutral-default majority), falls back to the unweighted pool

Test coverage:
- settlement-data.test.ts asserts every civicScale value is one of
  the three allowed strings, and that civic+remote each have
  representation but neither dominates (each <50% of the tag pool)
- generator-determinism.test.ts: across 200 crowded systems, urban-
  band settlements show more civic tags than remote, and outpost-band
  settlements show the opposite — both checks gated on having
  enough settlements in each band to be statistically meaningful

Audit gates:
- npm run test: <count> tests pass (1 new dist + 1 new variance test)
- npm run build: 159 static pages, no TS errors
- npm run lint: clean

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase E8: v2 generator announcement

**Files:**
- Create: `content/posts/2026-05-04-star-system-generator-v2.mdx`

Per the locked decision in the original plan section 9.4, the seed-break across Why Here Phase 1 + the entire scale-split cascade ships as one combined "v2 generator" announcement. Channel: the project's main blog (`content/posts/`).

The post must use the **`optional-writer` skill** so it lands in Scott's voice.

- [x] **Step 1: Invoke the optional-writer skill**

In the executing session:

```
Skill: optional-writer
Args: Draft a 600-900 word blog post announcing the v2 release of the
Star System Generator. Audience: TTRPG GMs who use the tool. Cover:

1. The two underlying changes — Why Here graph-aware reshape (per-tone
   templates, hazard+faction blending, tautology guard) and the
   scale-split (population magnitude becomes its own field, habitation
   pattern becomes its own field, plus twelve new patterns:
   Ring station, O'Neill cylinder, Modular island station, Hub
   complex, Hollow asteroid, Belt cluster, Underground city, Sealed
   arcology, Sky platform, Tethered tower, Drift colony, Generation
   ship — covering Expanse, Culture, Mars Trilogy, classic O'Neill,
   Schismatrix vocabulary).

2. What the player-facing experience looks like now — Settlement
   cards show Population and Habitation as separate rows; Hub-class
   names are back for large urban centers; exotic habitation forms
   appear on natural rolls without needing GM intervention; tone
   axis shifts the distribution (cinematic favors Abandoned/Swarm,
   astronomy suppresses them); urban populations get urban-scale
   encounter sites and crises; tags weight toward civic vs remote
   based on magnitude.

3. The seed-break note — old seed strings will produce different
   output. Frame this as a one-time cost for a noticeable jump in
   atmospheric plausibility (Expanse / Culture-series feel) and
   composability of habitation × magnitude.

4. What's next — composite settlement support (Hub complex shipping
   here as a habitation pattern is the seed for it), more habitation
   patterns are now one-file JSON additions, and continued prose
   variation per pattern.

Tone: warm but not breathless. Concrete examples over abstract
descriptions. Match the IBO devlog cadence (e.g.
2026-03-12-ibo-design-diary-characters.mdx) — design-first, not
marketing.

Title slug: star-system-generator-v2
File path: content/posts/2026-05-04-star-system-generator-v2.mdx
```

- [x] **Step 2: Verify frontmatter against the project's conventions**

```bash
ls content/posts/2026-* | tail -3
head -15 content/posts/2026-03-23-ibo-design-diary-the-progressive-resolution-system.mdx
```

Confirm the new post's frontmatter follows the same shape (date format, draft flag, tags, excerpt, featured_image if used).

- [x] **Step 3: Build to verify the post renders**

```bash
npm run build 2>&1 | grep -E "2026-05-04-star-system-generator-v2|error|Error"
```

Expected: the slug appears in the build output's static-pages list, no errors.

- [x] **Step 4: Spot-check the rendered post locally**

```bash
npm run dev &
curl -s http://localhost:3000/2026/05/04/star-system-generator-v2/ | grep -oE '<title>[^<]+</title>'
pkill -f "next dev"
```

(If the URL pattern differs, use whatever the build output reports.)

- [x] **Step 5: Commit**

```bash
git add content/posts/2026-05-04-star-system-generator-v2.mdx
git commit -m "$(cat <<'EOF'
docs: phase E8 — v2 star system generator launch announcement

Combined announcement covering the Why Here graph-aware reshape (Why
Here Phase 0/1/2: bcbadeb / cd453f1 / a649d51) and the scale-split
cascade (scale-split A/B/C/D + E1-E7) as the user-facing v2 release.
Drafted in Scott's voice via the optional-writer skill, with concrete
before/after examples and the documented seed-break warning.

Channel: main blog at content/posts/. Slug
star-system-generator-v2 lands at /2026/05/04/star-system-generator-v2/
in the static export.

Audit gates:
- npm run build: 160 static pages (the new post adds one), no errors
- frontmatter shape matches recent IBO devlog conventions

Closes the deferred-items list from the post-Phase D review.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review checklist

- [x] **Spec coverage:** All 8 deferred items have a phase. E1=Hub regression. E2=distribution tuning. E3=12 new patterns. E4=pattern prose. E5=encounters/crises. E6=tone. E7=tag weighting. E8=announcement.
- [x] **Placeholder scan:** Every code step has actual code. Commit-message bodies have `<count>` and `<fill in from grep output>` placeholders where the engineer must paste actual measured numbers — these are intentional, since the values aren't known until the gate runs.
- [x] **Type consistency:** `applyHabitationPopulationConstraint` signature gains rng in E3; call sites in E5+ use the updated form. `settlementHabitationPatternFromRoll` signature changes twice (gains body in E3, gains tone in E6) — both phases update the call site. `chooseEncounterSites` and `chooseSettlementCrisis` signatures change in E5. `chooseSettlementTags` signature changes in E7. `populationBandFor` is added in E5 and reused in E7.
- [x] **Pattern coverage:** All 12 new patterns are covered in the union (E3), descriptor map (E3), joint-constraint table (E3), prose variants (E4), and announcement copy (E8). Sky platform's atmosphere gate is centralized in `bodyHasAtmosphere` (E3) and only relevant inside `highExoticsFor`.
- [x] **Cross-cascade consistency:** Each phase's diff stands alone. E2 ships an interim d12 roll function that E3 promotes to d20 — this is intentional (keeps the diffs reviewable; Phase E2 is "tuning" and Phase E3 is "expansion", not bundled).
