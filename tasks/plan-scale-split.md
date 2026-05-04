# Plan: Split `settlement.scale` into `population` + `habitationPattern`

## Problem

`settlement.scale` mixes two unrelated axes in one flat table. Current entries
in `data/settlements.json scaleTable`:

```
"Abandoned"
"Automated only"
"1-20 people" … "10+ million people"
"Distributed swarm settlement"
"Population unknown or deliberately falsified"
```

UI renders raw via `<InlineDetail label="Scale" value={settlement.scale.value} />`
in `SettlementCard.tsx:32`. User sometimes sees magnitude, sometimes habitation
type — under one label.

## Decided fix

Split into two orthogonal `Fact<>` fields on `Settlement`:

- `population` — magnitude only
- `habitationPattern` — habitation type/state

---

## 1. Categorization

| Current entry | population | habitationPattern | Notes |
|---|---|---|---|
| `Abandoned` | `Unknown` | `Abandoned` | Forced — historical pop unknown by default |
| `Automated only` | `Minimal (<5)` | `Automated` | Forced — supervisory headcount only |
| `1-20 people` | `1-20` | (default by siteCategory) | |
| `21-100 people` | `21-100` | (default by siteCategory) | |
| `101-1,000 people` | `101-1,000` | (default by siteCategory) | |
| `1,001-10,000 people` | `1,001-10,000` | (default by siteCategory) | |
| `10,001-100,000 people` | `10,001-100,000` | (default by siteCategory) | |
| `100,001-1 million people` | `100,001-1 million` | (default by siteCategory) | |
| `1-10 million people` | `1-10 million` | (default by siteCategory) | |
| `10+ million people` | `10+ million` | (default by siteCategory) | |
| `Distributed swarm settlement` | (rolled normally) | `Distributed swarm` | Population independent of habitation pattern |
| `Population unknown or deliberately falsified` | `Unknown` | (default by siteCategory) | |

### Default `habitationPattern` derived from `siteCategory`

| siteCategory | default habitationPattern |
|---|---|
| `Surface settlement` | `Surface settlement` |
| `Orbital station` | `Orbital station` |
| `Asteroid or belt base` | `Asteroid or belt base` |
| `Moon base` | `Moon base` |
| `Deep-space platform` | `Deep-space platform` |
| `Gate or route node` | `Gate or route node` |
| `Mobile site` | `Distributed swarm` |
| `Derelict or restricted site` | `Abandoned` |

---

## 2. Type Model

### New unions in `types.ts`

```ts
export type SettlementPopulation =
  | 'Minimal (<5)'
  | '1-20'
  | '21-100'
  | '101-1,000'
  | '1,001-10,000'
  | '10,001-100,000'
  | '100,001-1 million'
  | '1-10 million'
  | '10+ million'
  | 'Unknown'

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
```

### `Settlement` interface change

Remove `scale: Fact<string>` (line 187). Add:

```ts
population: Fact<SettlementPopulation>
habitationPattern: Fact<SettlementHabitationPattern>
```

### `*ByScale` re-keying decision

Current `*ByScale` dictionaries (`authorityByScale`, `conditionByScale`,
`crisisByScale`, `hiddenTruthByScale`, `encounterSitesByScale`) special-case
only `"Automated only"` and `"Abandoned"`. Numeric ranges fall through to the
general pool.

**Resolution:** rename to `*ByHabitationPattern`. Clean 1:1 — `"Automated only"`
→ `"Automated"`; `"Abandoned"` unchanged. The numeric and Swarm/Unknown entries
never had overrides, so they continue to use the general pool.

---

## 3. Data Migration

### `data/settlements.json`

- **Remove** `scaleTable`.
- **Add** `populationTable` (numeric ranges + `Unknown`).
- **Add** `habitationPatternDefaults` keyed by `SettlementSiteCategory` (table
  in section 1).
- **Rename** all five `*ByScale` keys → `*ByHabitationPattern`. Update internal
  string keys: `"Automated only"` → `"Automated"`; `"Abandoned"` unchanged.

### `data/names.json`

Update `settlementNameDescriptors.scale.exact`:

```json
"exact": {
  "Automated": "Array",
  "Abandoned": "Remnant",
  "Distributed swarm": "Swarm"
}
```

The `"Distributed swarm"` entry is new.

---

## 4. Generator Changes

### Replace `settlementScaleFromRoll` (`index.ts:2208-2216`)

**`settlementPopulationFromRoll(rng, presence)`** — d10 on the new population
table; existing modifier logic by presence score preserved. Returns
`SettlementPopulation`.

**`settlementHabitationPatternFromRoll(rng, presence, siteCategory, population)`**
— derive from `siteCategory` via `habitationPatternDefaults`, with small
random chance to roll a special pattern (`Distributed swarm`, `Automated`,
`Abandoned`) based on presence + population.

### Joint constraint table

| habitationPattern | forces population | reason |
|---|---|---|
| `Abandoned` | `Unknown` | historical pop canonically unknown |
| `Automated` | `Minimal (<5)` | supervisory headcount only |

`Distributed swarm` has no joint constraint — population rolls independently
on the standard table. A 50k-person swarm and a 5-person swarm are different
scenarios; orthogonalizing the axes is the whole point. GMs who want
narrative ambiguity have `Unknown` as an explicit population value.

When habitationPattern is `Abandoned` or `Automated`, override the population
roll result.

### RNG fork naming

Roll population first on the main RNG (replaces current d12 scale roll
position), then fork for habitationPattern:

```ts
rng.fork(`habitation-pattern-${index + 1}`)
```

This preserves downstream RNG state for authority/condition/crisis/etc.
Mandatory.

### Function-signature renames

- `chooseSettlementAuthority`, `chooseSettlementCondition`,
  `chooseSettlementCrisis`, `chooseHiddenTruth`, `chooseEncounterSites` —
  param `scale: string` → `habitationPattern: SettlementHabitationPattern`.
  Body unchanged except renamed lookup constant.
- `generateSettlementName` / `settlementDescriptorForScale` — param +
  function rename to `…ForHabitationPattern`.

### `generateSettlements` call site (`index.ts:2516-2532`)

```ts
const population = settlementPopulationFromRoll(rng, presence)
const habitationPattern = settlementHabitationPatternFromRoll(
  rng.fork(`habitation-pattern-${index + 1}`),
  presence,
  locationOption.category,
  population,
)
```

Settlement object construction (line 2562): `scale` → `population` +
`habitationPattern` facts.

---

## 5. Consumer Updates

| File | Line(s) | Change |
|---|---|---|
| `types.ts` | 187 | Remove `scale`; add `population`, `habitationPattern`; add unions |
| `data/settlements.json` | scaleTable + 5 ByScale dicts | Replace; rename; update internal keys |
| `data/names.json` | scale.exact | Update keys |
| `lib/generator/data/settlements.ts` | exports | Rename `*ByScale` → `*ByHabitationPattern`; add new type + table exports |
| `lib/generator/index.ts` | 2208-2216 | Replace roll function with two |
| `lib/generator/index.ts` | 2218-2253 | Update 4 `choose*` signatures |
| `lib/generator/index.ts` | 2466-2491 | Rename `…ForScale` → `…ForHabitationPattern` |
| `lib/generator/index.ts` | 2509-2589 | Update generateSettlements |
| `lib/generator/prose/settlementProse.ts` | 27-30, 39-41 | `context.scale` → `context.habitationPattern`; update equality strings |
| `lib/generator/prose/__tests__/settlementProse.test.ts` | 8-53 | Update context objects in all cases |
| `lib/export/markdown.ts` | 142 | Replace `Scale:` line with two lines |
| `components/SettlementCard.tsx` | 32 | Replace one `<InlineDetail>` with two |

---

## 6. UI Surface

Two adjacent `<InlineDetail>` rows in the Operations dl:

```
Population:    1,001-10,000
Habitation:    Orbital station
```

No combined display — two rows are scannable, avoid `Unknown` formatting
weirdness, and stay consistent with all other `<InlineDetail>` usage.

`Surface settlement` will appear frequently as habitationPattern (default for
inhabited surface sites). Always show — conditional rendering is exactly the
inconsistency that motivated the split. The redundant-with-`siteCategory`
case is a UI tweak for later, not a data-layer concern.

---

## 7. Phased Rollout

### Phase A — Type and data schema (no behavior change)

- Add `SettlementPopulation` + `SettlementHabitationPattern` unions to `types.ts`
- Add new fields to `Settlement` *alongside* existing `scale` (both fields
  present during migration)
- Add `populationTable`, `habitationPatternDefaults`, `*ByHabitationPattern`
  to `settlements.json` (duplicating `*ByScale` content with updated keys)
- Export new constants from `lib/generator/data/settlements.ts`
- **Audit gate:** TS compiles; existing tests pass.

### Phase B — Generator produces both fields

- Implement the two roll functions in `index.ts`
- `generateSettlements` populates both new fields (still sets `scale` from
  `habitationPattern` for transition)
- Update `choose*` to accept `habitationPattern`
- Update `generateSettlementName`
- **Audit gate:** generate 100 seeds; assert all settlements have both fields;
  assert `"Automated only"` string never appears in output.

### Phase C — Prose, export, UI

- Update `settlementProse.ts` context type + equality strings
- Update `settlementProse.test.ts` context objects
- Update `markdown.ts` to two lines
- Update `SettlementCard.tsx` to two rows
- **Audit gate:** full test suite + `npm run build`; visually verify card.

### Phase D — Remove legacy `scale`

- Drop `scale` field from `Settlement` interface
- Remove `*ByScale` and `scaleTable` from `settlements.json`
- Remove related exports from `data/settlements.ts`
- Remove `scale` from generator object construction
- **Audit gate:** `npm run lint`/`test`/`build` clean; `grep \\.scale\\.` in
  `src/features/tools/star_system_generator/` returns zero results.

### Phase E — Audit checks + expansion (optional, post-ship)

- Habitation-pattern-sensitive prose variants
- Population-conditioned prose variation
- Cross-pattern audit: `Abandoned` always has `Unknown` population;
  `Automated` always has `Minimal (<5)` population; no other joint
  constraints (e.g. `Distributed swarm` can have any population).

---

## 8. Expansion Opportunities

- **Habitation-pattern-specific prose.** `Distributed swarm` 1k people ≠
  `Orbital station` 1k people — different physical/political dynamics.
  `settlementHookSynthesis` can branch on habitationPattern instead of just
  the two special cases today.
- **Population-scaled encounter sites + crises.** Add an
  `encounterSitesByPopulationBand` override — `10+ million` gets urban-scale
  sites (`"Transit lock overflow"`, `"Debt court queue"`).
- **Joint distribution coloring by tone axis.** `cinematic` favors
  `Abandoned` / `Distributed swarm`; `astronomy` suppresses them. Impossible
  with the conflated field.
- **Easy new patterns.** `Underground city`, `Orbital ring`,
  `Generation ship` become one-file JSON additions.
- **Population-conditioned tag/hook weighting.** Very large populations
  suppress low-drama tags (`Derelict Yard`), boost civic-scale ones
  (`Strikebreaker City`).

---

## 9. Risks + Decisions Locked

### Risks

- **RNG determinism.** New code forks for habitationPattern; downstream rolls
  shift. Cached seeds produce different output. Forward cut, not backward
  compatible. Accepted; coordinate messaging with Why Here Phase 1
  seed-break (one combined "v2 generator" announcement).
- **Snapshot tests on prose strings.** `settlementProse.test.ts` line 37
  matches `"Automation failure turns maintenance airlock into the key scene."`
  Passes after split *only if* the equality update from `'Automated only'` →
  `'Automated'` lands in the same commit as the test data update.
- **`graphAwareSettlementHook` / `graphAwareReshape`** read `Settlement` but
  not `scale` directly — confirm during Phase B audit.

### Decisions locked

1. **`Surface settlement` row always shown.** Conditional rendering re-introduces
   exactly the inconsistency the split was meant to fix. UI tweak deferred.
2. **`Distributed swarm` population rolled independently.** Forcing `Unknown`
   re-couples the axes. GMs wanting ambiguity use `Unknown` explicitly.
3. **`SettlementPopulation` includes `Minimal (<5)`.** Precision is the
   point. `1-20` is misleading for a site with 0-2 supervisors. Cost is
   one extra union value; downstream lookups key on `habitationPattern`
   not `population`, so impact is limited to prose templates and the
   markdown export.
4. **Seed-break documented.** Phase B and Phase D both shift RNG stream;
   announce alongside Why Here Phase 1 as a combined "v2 generator" cut.

---

## File Reference Summary

Files to create: none.

Modify (in implementation order):

1. `src/features/tools/star_system_generator/types.ts`
2. `src/features/tools/star_system_generator/data/settlements.json`
3. `src/features/tools/star_system_generator/data/names.json`
4. `src/features/tools/star_system_generator/lib/generator/data/settlements.ts`
5. `src/features/tools/star_system_generator/lib/generator/index.ts`
6. `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts`
7. `src/features/tools/star_system_generator/lib/generator/prose/__tests__/settlementProse.test.ts`
8. `src/features/tools/star_system_generator/lib/export/markdown.ts`
9. `src/features/tools/star_system_generator/components/SettlementCard.tsx`
