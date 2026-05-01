# Star System Generator Celestial Designation Plan

Status: implemented.

## Context

The generator currently assigns poetic generated names to planets, moons, belts, dwarfs, captured bodies, and anomalies. This adds flavor, but it also creates avoidable repetition and implies that every orbital body has a settled human-cultural name.

The accepted direction is to make generated celestial objects designation-first:

- planetary bodies use system-name plus Roman numeral
- moons use parent designation plus moon Roman numeral
- nonplanet bodies keep a type word in the designation
- human settlements, factions, remnants, and imported known names keep proper names

This gives the orbital table a more grounded astronomy-adjacent baseline while preserving human-facing flavor where people would naturally create names.

## Design Principles

- The designation is the canonical display name for generated celestial objects.
- Roman numerals should always communicate orbital/list order.
- The system name should remain present in exported references so designations survive outside the UI table.
- Generated settlements should keep proper human-facing names and use the celestial designation as an anchor stem.
- Locked imported names must not be overwritten.
- The implementation should leave a deliberate hook for future planet or moon aliases without forcing aliases into the first pass.

## Canonical Convention

Use uppercase Roman numerals: `I`, `II`, `III`, `IV`, `V`, `VI`, and so on.

Planet-like body categories use the bare system designation:

| Body category | Format | Example |
| --- | --- | --- |
| `rocky-planet` | `<System> <RN>` | `Nosaxa I` |
| `super-earth` | `<System> <RN>` | `Nosaxa II` |
| `sub-neptune` | `<System> <RN>` | `Nosaxa III` |
| `gas-giant` | `<System> <RN>` | `Nosaxa IV` |
| `ice-giant` | `<System> <RN>` | `Nosaxa V` |

Nonplanet body categories include a type word:

| Body category | Format | Example |
| --- | --- | --- |
| `belt` | `<System> Belt <RN>` | `Nosaxa Belt III` |
| `dwarf-body` | `<System> Dwarf <RN>` | `Nosaxa Dwarf VI` |
| `rogue-captured` | `<System> Captive <RN>` | `Nosaxa Captive VII` |
| `anomaly` | `<System> Anomaly <RN>` | `Nosaxa Anomaly VIII` |

The Roman numeral is based on the generated orbital body order, not on a per-category counter. If the third orbital body is a belt, it is `Nosaxa Belt III`, not `Nosaxa Belt I`.

Moons use the parent body designation:

```text
<Parent Designation> - Moon <RN>
```

Examples:

- `Nosaxa IV - Moon I`
- `Nosaxa IV - Moon II`
- `Nosaxa Dwarf VI - Moon I`
- `Nosaxa Captive VII - Moon I`

Moon Roman numerals are based on the generated moon list order for the parent. The generator does not currently model moon orbital distance, so this is a stable list designation rather than a physical moon-distance claim.

## Imported Known Bodies

Known-system imports keep locked names:

- If `PartialKnownBody.name.locked` is true, preserve the imported name.
- If a known body has no locked name, assign the generated designation.
- If a known body has a locked astronomical name and the UI later needs generated designation context, add that context outside `name` rather than replacing the locked fact.

## Alias Hook

Do not generate local planet or moon aliases in this pass.

Reserve this future model:

```ts
interface OrbitingBody {
  name: Fact<string>
  designation?: Fact<string>
  localName?: Fact<string>
}

interface Moon {
  name: Fact<string>
  designation?: Fact<string>
  localName?: Fact<string>
}
```

First implementation can use `name` as the canonical designation to minimize UI churn.

Future alias behavior should be:

- `designation` is the stable technical reference.
- `localName` is optional human-cultural flavor.
- generated aliases should appear only when a body has a settlement, remnant, major historical event, or narrative reason to be named.
- display can become `<designation>, locally called <localName>` when aliases exist.

This keeps the door open for proper names without returning to default poetic names for every body.

## Phase 1 - Add Designation Helpers

Purpose: centralize naming rules and remove ad hoc body/moon name construction.

Work items:

- Add a Roman numeral helper with tests for ordinary generator ranges.
- Replace `bodyNameForIndex` with a designation helper based on system name, body category, and orbital body index.
- Replace `moonNameForIndex` with a designation helper based on parent body designation and moon index.
- Remove unused RNG inputs from designation helpers if they are no longer needed.

Acceptance checks:

- Planet-like bodies render as `<System> <RN>`.
- Belts render as `<System> Belt <RN>`.
- Dwarfs render as `<System> Dwarf <RN>`.
- Captured/rogue bodies render as `<System> Captive <RN>`.
- Anomalies render as `<System> Anomaly <RN>`.
- Moons render as `<Parent Designation> - Moon <RN>`.

## Phase 2 - Preserve Locked Imports

Purpose: keep known-system import behavior correct.

Work items:

- Keep `mergeLockedFact` behavior for `known.name`.
- Add or update regression coverage showing locked body names survive.
- Add coverage showing unlocked or missing known body names receive designations.

Acceptance checks:

- A locked known body name is not overwritten.
- A generated body in the same known system still receives a designation.
- Determinism remains stable for same seed/options after intentional output updates.

## Phase 3 - Update Settlement Anchors

Purpose: make human-facing settlement names and anchor descriptions read cleanly with designations.

Work items:

- Review `chooseSettlementAnchor` output for moon, belt, route, orbit, mobile, and restricted anchors.
- Ensure moon anchors use the new moon designation without awkward duplication.
- Ensure belt/minor-body anchors read naturally, for example `Nosaxa Belt III` and `Nosaxa IV minor-body complex`.
- Keep settlement names generated from anchor/function/authority/scale descriptors.

Acceptance checks:

- Settlement names remain human-facing and readable.
- Moon-base settlement anchor text references the parent and moon designation clearly.
- Belt-base settlement anchor text does not collapse to a bare `Belt I`.

## Phase 4 - Remove Or Retire Thin Name Pools

Purpose: resolve the current data-audit warnings cleanly.

Work items:

- Stop using `bodyNameCores`, `bodyNameFormsByCategory`, `moonNameCores`, and `moonNameForms` for canonical generated body/moon names.
- Decide whether to keep these pools as future alias source material.
- If kept, rename or document them as alias pools and remove thin-pool warnings from the audit until alias generation exists.
- If removed, update loaders, tests, and audit checks accordingly.

Acceptance checks:

- `npm run audit:star-system-data` reports no warnings caused by obsolete canonical name pools.
- Unused imports are removed.
- The data file notes explain whether body/moon name material is retired or reserved for aliases.

## Phase 5 - Update Exports, Tests, And Snapshots

Purpose: make the new convention consistent across UI, Markdown export, JSON export, validation, and tests.

Work items:

- Update tests that assert generated body or moon names.
- Review Markdown export orbital rows for readability.
- Review JSON export shape; no schema change is required if `name` remains canonical designation.
- Update validation/audit checks to prefer designation patterns for generated objects.
- Run focused generator tests and data audit.

Acceptance checks:

- `npm run test -- --run src/features/tools/star_system_generator`
- `npm run audit:star-system-data`
- Existing name uniqueness validation still passes or is adjusted for deterministic designations.

## Follow-Up Option - Local Alias Generation

Only add aliases after the designation-first model is stable.

Suggested trigger conditions:

- body has one or more settlements
- body hosts a human remnant
- body is attached to a major narrative thread
- body has a dangerous GU anomaly or rare biosphere
- moon hosts a settlement or important resource

Suggested display behavior:

```text
Nosaxa IV
Nosaxa IV, locally called Sable
Nosaxa IV - Moon I
Nosaxa IV - Moon I, locally called Low Bell
```

Suggested implementation:

- Add `designation` and `localName` fields to `OrbitingBody` and `Moon`.
- Keep `name` as display-compatible during a migration window, or migrate displays to a helper like `formatBodyDisplayName(body)`.
- Reuse or rebuild the current poetic body/moon name pools as optional alias pools.
