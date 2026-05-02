# Sci-Fi TTRPG Star System Generator - Implementation Plan

This plan converts `SOURCE_WRITEUP.md` into a static, client-only interactive tool under `/tools/star_system_generator/`. The implementation should follow the existing KCD2 Alchemy Scholar pattern: a thin App Router route, a client-only dynamic import wrapper, isolated feature code, focused tests, and no server runtime.

For the completed post-MVP generation-method repair sequence, see `AUDIT_FIX_PLAN.md`. For the completed compatibility-contract remodel after the deep audit, see `POST_AUDIT_REMODEL_PLAN.md`. For the current narrative/data polish queue before advanced options, see `POLISH_ROADMAP.md`.

## 1. Proposed Directory Structure

```
src/
  app/
    (interactive)/
      tools/
        star_system_generator/
          page.tsx
          StarSystemGeneratorClient.tsx
  features/
    tools/
      star_system_generator/
        index.tsx
        README.md
        types.ts
        components/
          BodyDetailPanel.tsx
          ConfidenceBadge.tsx
          ExportPanel.tsx
          GeneratorControls.tsx
          OrbitalTable.tsx
          SeedControl.tsx
          SettlementCard.tsx
          SystemOverview.tsx
        hooks/
          useGeneratedSystem.ts
          useGeneratorQueryState.ts
        lib/
          export/
            json.ts
            markdown.ts
          generator/
            architecture.ts
            biosphere.ts
            calculations.ts
            dice.ts
            exoplanetFilters.ts
            guOverlay.ts
            index.ts
            minorBodies.ts
            names.ts
            noAlienGuard.ts
            orbitalSlots.ts
            rng.ts
            settlements.ts
            stars.ts
            tables.ts
            types.ts
          import/
            locks.ts
            schema.ts
        __tests__/
          calculations.test.ts
          export.test.ts
          generator-determinism.test.ts
          no-alien-guard.test.ts
          query-state.test.tsx
          StarSystemGenerator.test.tsx
        docs/
          PRD.md
          PLAN.md
          SOURCE_WRITEUP.md
```

Notes
- Keep table data in TypeScript modules at first. Move to JSON only if authoring/editing those tables becomes a practical need.
- Import support gets a small scaffold early (`import/locks.ts`, `import/schema.ts`) so the core model supports locked facts from day one, even if public import UI comes later.
- If a route image is added, place it under `public/tools/star_system_generator/`.

Development cadence
- Commit at logical checkpoints during development, not only at the end of a long session.
- Good checkpoints for this tool include completed generator-rule passes, UI readability passes, URL/query-state fixes, documentation/status updates, and test additions.
- Run focused verification for the touched surface before each checkpoint commit when practical, then broaden to lint/build before larger or user-facing commits.
- Run `npm run audit:star-system-generator` after generator-rule changes to scan a deterministic corpus for missing fields, repeated tags, impossible body details, settlement anchor contradictions, no-alien guard regressions, and distribution coverage warnings.

## 2. Architecture

The generator should be deterministic and staged.

Core shape:

```
generateSystem(options: GenerationOptions, input?: PartialKnownSystem): GeneratedSystem
```

Principles
- One seeded RNG instance is passed through the pipeline.
- Each stage is a pure function that receives a context/draft and returns an updated draft.
- All user-imported or known facts are represented as locked facts.
- All generated facts carry a confidence label.
- Validation and guard stages run at the end to catch contradictions and forbidden alien results.

Recommended pipeline modules:

1. `stars.ts`: primary star, age, metallicity, activity, multiplicity.
2. `architecture.ts`: reachable-volume bias and system architecture.
3. `calculations.ts`: insolation, HZ, snow line, thermal zones.
4. `orbitalSlots.ts`: slot placement, known planet placement, gap filling.
5. `exoplanetFilters.ts`: radius valley, hot Neptune desert, peas-in-a-pod, M-dwarf habitability.
6. `minorBodies.ts`: moons, belts, rings, dwarf bodies, captured/rogue bodies.
7. `guOverlay.ts`: GU intensity, bleed zones, resources, hazards.
8. `settlements.ts`: settlement presence score, scale, authority, AI situation, crisis, hidden truth.
9. `names.ts`: system, body, settlement, and site names.
10. `noAlienGuard.ts`: converts or rejects any alien-style mystery outputs.
11. `export/markdown.ts` and `export/json.ts`: user-facing exports.

## 3. Data Model Plan

Implement a narrow but extensible model.

Key types:
- `GenerationOptions`
- `GeneratedSystem`
- `Fact<T>`
- `Confidence`
- `Star`
- `OrbitingBody`
- `PlanetaryDetail`
- `Moon`
- `Belt`
- `RingSystem`
- `GuOverlay`
- `Settlement`
- `HumanRemnant`
- `SystemPhenomenon`
- `GenerationRoll`
- `PartialKnownSystem`

Important modeling choices:
- `Fact<T>` should support `confidence`, `source`, and `locked`.
- Use string union types for table outputs where practical.
- Keep numerical derived values as numbers plus display helpers. Do not store only formatted strings.
- Store a roll log for debugging and future "show generation details" UI.
- Store a final `noAlienCheck` result with pass/fail and any conversions applied.

## 4. UX Plan

MVP page structure:
- Top tool bar: title, seed control, randomize, generate/reset, export.
- Controls: distribution, tone, GU intensity preference, settlement density.
- Overview: compact system profile.
- Orbital table: the main scanning view.
- Detail area: selected body/site details.
- Settlements/hazards: cards for major settlements, ruins, phenomena, crisis hooks.
- Export panel: Markdown and JSON.

Responsive behavior:
- Desktop: controls can sit in a left column or top band; orbital table and details use the main width.
- Mobile: controls collapse into a compact panel; orbital table can become stacked body rows.

Visual requirements:
- Use existing site/Tailwind tokens.
- Preserve the current compact operational-tool redesign documented in `../README.md#visual-design-memory`.
- Reuse shared visual primitives from `components/visual.tsx` before creating one-off shells, labels, chips, icons, or field rows.
- Keep new elements aligned to the physical/GU/human/neutral layer color model.
- Avoid marketing-style hero layout.
- Use compact, legible panels and tables.
- Use badges for confidence labels, thermal zones, hazards, and GU intensity.
- Use lucide icons if an icon dependency already exists in the project; otherwise keep buttons text-based until the dependency choice is confirmed.

Share/save URL decision:
- Use ordinary query strings for seed and option state.
- Do not use dynamic seed path segments, because static export cannot prebuild arbitrary seed URLs.
- Do not use URL hashes unless a future hosting constraint requires them.
- Canonical share format: `/tools/star_system_generator/?seed=7f3a9c2e`.
- Extended share format: `/tools/star_system_generator/?seed=7f3a9c2e&distribution=frontier&tone=balanced&gu=normal`.

## 5. Implementation Milestones

M1 - Planning and Scaffolding
- [x] Add `docs/PRD.md`.
- [x] Add `docs/PLAN.md`.
- [x] Add feature `README.md`.
- [x] Add route `src/app/(interactive)/tools/star_system_generator/page.tsx`.
- [x] Add dynamic client wrapper `StarSystemGeneratorClient.tsx`.
- [x] Add placeholder `index.tsx` that renders a static tool shell.
- [x] Add metadata with canonical `urlPaths.tool('star_system_generator')`.

M2 - Core Types, RNG, Dice, and Tables
- [x] Define `types.ts`.
- [x] Implement seeded RNG.
- [x] Implement dice helpers: d6, d8, d12, d20, d66, d100, 2d6, table selection.
- [x] Encode source writeup tables needed for the first vertical slice.
- [x] Add deterministic RNG/dice/table tests.

M3 - Astronomy Skeleton
- [x] Implement stellar generation for fictional systems.
- [x] Align stellar generation labels and d100 ranges with the source writeup's primary-star tables.
- [x] Implement reachable-volume bias.
- [x] Implement age, metallicity, and activity.
- [x] Implement multiplicity and binary/trinary separation consequences.
- [x] Implement luminosity-derived HZ, snow line, insolation, and thermal zones.
- [x] Implement modified-2d6 system architecture and orbital slot placement.
- [x] Apply first-pass architecture modifiers for metallicity, star type, low-mass M dwarfs, and reachability.
- [x] Add tests for calculations and deterministic system skeletons.

M4 - Worlds and Modern Exoplanet Filters
- [x] Implement first-pass planet/body class selection by thermal zone.
- [x] Apply architecture-specific weighted body plans with variable rocks, belts, giants, debris, and occasional crossover bodies.
- [x] Increase orbital body and moon density toward the source writeup's playable-system expectations.
- [x] Implement first-pass atmosphere, hydrosphere, geology, climate tags, radiation, and biosphere.
- [x] Add first-pass thermal-zone/body-category constraints to prevent impossible environment combinations.
- [x] Implement first-pass radius valley, hot Neptune desert, peas-in-a-pod, and M-dwarf habitability filters.
- [x] Implement first-pass moons, belts, rings, and minor bodies.
- [x] Add tests for major world-detail invariants.
- [x] Add regression tests for extreme-hot worlds, belts, envelope worlds, and cold solid-body climates.
- [x] Add tests for modern exoplanet filters once implemented.

M5 - Geometric Unity and Human Layer
- [x] Implement first-pass GU intensity, bleed-zone location, resources, and hazards.
- [x] Implement first-pass settlement presence scoring.
- [x] Implement settlement scale, site category, location, physical anchor, reason-for-existence, function, authority, built form, AI situation, condition, tags, current crisis, hidden truth, local encounter sites.
- [x] Make settlement count variable by density preset and system context instead of fixed per preset.
- [x] Implement first-pass human ruins/derelicts and expanded phenomena.
- [x] Expand authored settlement tag-pair hooks for high-value combinations.
- [x] Structure system phenomena with transit, question, hook, and image beats.
- [x] Implement no-alien guard and conversion rules.
- [x] Add tests that forbidden alien outputs cannot survive first-pass human-layer generation.
- [x] Add scripted deterministic corpus audit for missing, contradictory, repeated, and coverage-defect outputs.

M6 - UI MVP
- [x] Build `SeedControl`.
- [x] Build `GeneratorControls`.
- [x] Build `SystemOverview`.
- [x] Build `OrbitalTable`.
- [x] Build `BodyDetailPanel`.
- [x] Build `SettlementCard`.
- [x] Build `ConfidenceBadge`.
- [x] Build confidence-label legend.
- [x] Wire `useGeneratedSystem`.
- [x] Wire `useGeneratorQueryState`.
- [x] Add component tests for first vertical slice.
- [ ] Add a11y smoke tests.

M7 - Export and Persistence
- [x] Implement Markdown export using the compact system profile format from `SOURCE_WRITEUP.md`.
- [x] Implement JSON export using the internal schema.
- [x] Add first copy-to-clipboard control for share URLs.
- [x] Persist URL query-string state for seed/options.
- [x] Add a share-link control that copies the current `/tools/star_system_generator/?seed=...` URL.
- [ ] Optionally save the last seed/options to `localStorage` if consistent with the final UX.
- [x] Add export and query-state tests.

M8 - Import-Ready Foundation
- [x] Add `PartialKnownSystem` internal schema/types.
- [x] Add lock/merge helpers that preserve imported facts.
- [x] Add tests proving locked facts are not overwritten.
- [x] Report incompatible locked facts as locked-fact conflicts instead of silently rewriting them.
- [x] Keep import UI hidden while import support remains internal.
- [ ] Add public import UI.
- [ ] Add user-facing import validation/copy if/when import UI is exposed.

M9 - Integration and Polish
- [ ] Add tool link to the site navigation where other tools are listed.
- [ ] Add route metadata image if available.
- [ ] Check mobile layout.
- [x] Run `npm run lint` after the latest generator/UI changes.
- [x] Run focused Star System Generator tests and audits after the latest generator changes.
- [ ] Run full-site `npm run test`.
- [ ] Run `npm run build`.

## 6. MVP Scope Recommendation

The source writeup is large enough that implementation should avoid trying to perfect every table and edge case in one pass. The first public version should include:

- Fictional system generation only.
- Seeded deterministic output.
- Reachable distribution vs realistic distribution.
- Core star/architecture/orbit/world generation.
- GU overlay.
- At least one settlement/human-layer pass.
- No-alien guard.
- Markdown and JSON export.
- Confidence labels.

Defer:
- Live data import.
- Full imported known-system UI.
- Saved-system library.
- Sector/network generation for all 150 systems.
- Visual orbital map beyond a simple table or strip.
- Complex conflict resolution for contradictory imported data.

## 6.1 Current Implementation Status

Use this section while reviewing generated output. It separates source-method implementation from provisional approximations so source-table issues and code issues are easier to tell apart.

Implemented close to source method
- Seeded deterministic generation and query-string sharing.
- Confidence labels for generated facts.
- Stellar distribution selection for realistic vs reachable-frontier modes.
- Stellar multiplicity with companion type, separation profile, planetary consequences, and GU consequences.
- Stellar age, metallicity, and activity rolls with first-pass modifiers.
- Insolation, optimistic habitable zone, snow line, and thermal-zone calculations.
- Reachability class.
- Architecture roll with first-pass modifiers for metallicity, K/G/F stars, very low-mass M dwarfs, resource/reachability bias, and tone.
- Thermal-zone constrained body selection.
- Expanded first-pass planet class lists drawn from MASS-GU section 12, including human facility worlds, failed terraforming sites, Trojan settlement zones, dark-sector anomalies, and distant human/route sites.
- Extreme-hot environment constraints: furnace/inferno worlds avoid seas, mild atmospheres, biospheres, and moons.
- Broad body categories: rocky planet, super-Earth, sub-Neptune, gas giant, ice giant, belt, dwarf body, rogue/captured body, anomaly.
- First body detail fields: atmosphere, hydrosphere/volatiles, geology, climate tags, radiation, biosphere.
- First mass and gravity estimates derived from radius and body category, with cloud-top/envelope labeling for gas and sub-Neptune worlds.
- First body-level interest summaries and belt/minor-body/anomaly profile notes.
- First moon/ring generation for suitable body categories.
- First playable moon detail layer: moon scale, resource, hazard, use note, and giant-planet moon economy note.
- First GU overlay with modifiers for active M dwarfs, compact systems, gas giants, and quiet G/K stars.
- First modern exoplanet filters: radius valley, hot Neptune desert, peas-in-a-pod, and M-dwarf habitability notes.
- First settlement presence scoring tied to body resources, access, strategic value, GU value, habitability, hazards, and legal heat.
- First human playable layer: settlement site category, location, physical anchor, reason-for-existence, function, authority, built form, AI situation, condition, tags, crisis, hidden truth, encounter sites, human remnants, and structured system phenomena.
- Authored settlement tag-pair hooks for high-value combinations.
- Structured system phenomena with transit pressure, survey question, conflict hook, and scene anchor fields shown in UI and exports.
- Import-ready locked-fact foundations for known stars and bodies, including locked conflict reporting.
- Markdown and JSON export.
- Final no-alien guard converts old alien-style mystery labels into MASS-GU replacements and records the check result.

First-pass approximations
- Planet class tables are expanded from the source writeup but still use compressed equal-choice lists rather than exact d20 weighting.
- Architecture now affects body mix through weighted body plans, but individual body class tables still need deeper source-table weighting.
- Orbital slot spacing is still simplified, though locked known-body orbit preservation and gap filling are implemented.
- Atmosphere/hydrosphere/geology/radiation use constrained pick lists rather than full d12 modifier math.
- Mass and gravity are approximate category/radius estimates, not density-modeled planetary interiors.
- Biosphere uses a rough habitability score, not the full source scoring rules.
- Moon generation uses category-based counts, not the full terrestrial/giant moon tables.
- Moon-base settlements attach to generated major moons when available and prefer moon types that fit the site location.
- Moon details include first-pass scale/resource/hazard/use notes, but do not yet use full moon-specific environment generation.
- Ring generation is simplified.
- Belt, minor-body, and anomaly profiles are interpretive summaries, not full independent generation procedures.
- Settlement presence scoring is implemented as a simplified numeric approximation, not the complete source formula/table coverage.
- Settlement/base generation now follows MASS-GU section 18 location, function, authority, built-form, AI situation, condition, tag, crisis, hidden-truth, and local-site concepts, but adds implementation constraints so physical site category, function, built form, and anchor remain compatible.
- Settlement cards include a physical anchor and a first-pass "why here" line generated from MASS-GU 18.1 presence score components.
- GU resource/hazard/location tables are abbreviated.
- Settlement tags are implemented as obvious/deeper two-tag pairs with expanded authored tag-pair hooks for high-value combinations.
- Human remnants use compact tables; system phenomena now use structured consequences for transit pressure, survey questions, conflict hooks, and scene anchors.

Not implemented yet
- Public known-system import UI.
- Plain-language overview copy pass for all stellar class labels and notes, replacing astronomy shorthand with player-facing explanations.
- Full source-table implementation of radius valley, hot Neptune desert, peas-in-a-pod, and M-dwarf habitability filters beyond the first-pass notes/adjustments.
- Full moons, belts, rings, dwarf bodies, rogue/captured body procedures.
- Exact d66/d20 roll weighting for every settlement/base table; current arrays include the full source entries for section 18 support tables but use constrained equal-choice subsets by site category.
- Optional second expansion of settlement tag-pair hooks if sample review shows specific fallback pairs repeating.
- Site navigation link, route metadata image, mobile layout pass, full-site tests, and production build verification.

## 6.2 Future Public Documentation

After the generator process, UI vocabulary, and output model stabilize, add public static MDX pages for:

- A user-facing explanation of the MASS-GU procedural generation process.
- A glossary of astronomy, Geometric Unity, and generator-specific terms.

These should live under `content/pages/` and be linked from the Star System Generator UI. Prefer static pages over posts so there is one canonical, updated reference.

## 7. Testing Strategy

Focused unit tests should carry most of the risk.

Generator tests:
- Same seed/options produce identical JSON.
- Different seed usually changes major outputs.
- All generated facts include confidence labels where applicable.
- Generated bodies have valid thermal zones based on insolation.
- HZ and snow-line calculations are stable.
- No forbidden alien labels or text categories survive.

Import/lock tests:
- Locked star spectral type is preserved.
- Locked planet orbit/name is preserved.
- Missing physical, GU, and human layers are filled around locked data.

UI tests:
- Initial render shows generated system.
- Seed update changes output.
- URL query-string reload restores options.
- Export panel contains generated Markdown and JSON.
- A11y smoke test passes.

## 8. Acceptance Criteria

- The route `/tools/star_system_generator/` exists and is statically exportable.
- Tool renders without SSR and without console errors.
- User can generate, regenerate, and share a deterministic query-string seed URL.
- Output includes system overview, orbital table, body details, GU overlay, settlements/ruins/hooks where appropriate, and confidence labels.
- Markdown and JSON exports are available.
- No generated output creates alien civilizations, alien artifacts, alien ruins, or alien megastructures.
- Core generator tests cover deterministic output, calculations, no-alien guard, and locked-fact behavior.
- Local checks pass: `npm run lint`, `npm run test`, and `npm run build`.

## 9. Risks and Mitigations

Risk: Generation tables produce inconsistent combinations.
Mitigation: Add final normalization and validation stages, and keep a small set of invariants tested.

Risk: MVP becomes too broad.
Mitigation: Build a complete thin vertical slice first: one seed to one useful system profile, then expand table coverage.

Risk: Future imports become hard.
Mitigation: Model `Fact<T>`, confidence labels, locked values, and merge behavior in the first implementation.

Risk: Output feels repetitive.
Mitigation: Keep text composition modular and table-driven; add more name/detail tables after the mechanical generator is stable.

Risk: UI becomes too decorative for a utility.
Mitigation: Keep the first screen a working generator with dense controls, tables, and export actions.

## 10. Open Decisions Before Implementation

- Should the MVP use a table-only orbital view, or include a simple visual orbit strip?
- Should generated systems default to setting-specific names or neutral sci-fi names?
- Should `localStorage` remember the last generated seed/options automatically?
- Should the first version include the route in navigation immediately, or remain unlinked until polished?
- Should source references from `SOURCE_WRITEUP.md` appear in the public UI, docs only, or an about/help panel?
