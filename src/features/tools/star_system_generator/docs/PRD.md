# Sci-Fi TTRPG Star System Generator - Product Requirements Document (PRD)

## 1. Overview

Client-only interactive tool integrated at `/tools/star_system_generator/` for generating astronomy-grounded, game-facing star systems for a Sci-Fi TTRPG setting. The first release is a deterministic random generator based on `SOURCE_WRITEUP.md` and the MASS-GU procedure: real astronomy provides the system skeleton, Geometric Unity adds pressure points, and human history creates playable adventure sites.

- Route: `src/app/(interactive)/tools/star_system_generator/page.tsx`
- Feature: `src/features/tools/star_system_generator/`
- Source design: `src/features/tools/star_system_generator/docs/SOURCE_WRITEUP.md`
- Rendering model: client-only dynamic import, compatible with static export and trailing slash URLs.

## 2. Goals & Non-Goals

Goals
- Generate a complete star system profile from a seed and user-selected generation options.
- Preserve deterministic output: the same seed and options produce the same system.
- Display outputs in a table- and card-oriented format useful at the game table.
- Track fact provenance with confidence labels: Confirmed, Derived, Inferred, GU-layer, and Human-layer.
- Separate physical astronomy, Geometric Unity overlays, and human settlement/adventure content in both code and UI.
- Design the generator so later releases can import known star system data and regenerate only missing or fictional layers.
- Allow exporting the generated system as Markdown and JSON.

Non-Goals
- No server APIs, database, authentication, or SSR.
- No live NASA Exoplanet Archive integration in the MVP.
- No map-scale route planner for all 150 reachable systems in the MVP.
- No alien civilizations, alien ruins, alien artifacts, or alien megastructures as generated results.
- No full campaign manager or persistence beyond URL/local browser state in the initial release.

## 3. Users & Use Cases

- TTRPG referees creating a new playable star system before a session.
- TTRPG referees generating a fast adventure site around a settlement, ruin, resource node, or hazard.
- Setting authors wanting a repeatable output that distinguishes real/known facts from fictional additions.
- Future use: importing a known star system and adding inferred planets, GU overlays, settlements, and crises without overwriting known data.

Primary flows
- Generate from random seed.
- Enter a custom seed and regenerate.
- Adjust high-level controls, such as realism/playability bias, reachable frontier distribution, settlement density, and GU intensity.
- Inspect system overview, orbital table, planetary details, settlements, hazards, and adventure hooks.
- Copy/export Markdown for notes or JSON for later tooling.

## 4. Design Principles

- Real astronomy creates the skeleton.
- Geometric Unity creates the pressure points.
- Human history creates the adventure sites.
- A habitable-zone planet is not automatically habitable.
- A super-Earth is not automatically Earth-like.
- Interesting systems do not require garden worlds.
- Multi-star systems may be overrepresented in the reachable network because of route selection, not because every real star is multiple.
- M-dwarf systems are common and valuable, but often tidally locked, flare-stressed, or atmosphere-compromised.
- Bleed resources should often move; moving nodes create freelancers, pirates, debt crews, and dangerous opportunities.
- Every mystery must be assigned to natural astronomy, Geometric Unity, human first-wave history, narrow-AI failure, or Sol/Gardener intervention.

## 5. Data Confidence Model

Every generated or imported fact carries a confidence label.

```
type Confidence = 'confirmed' | 'derived' | 'inferred' | 'gu-layer' | 'human-layer'
```

Labels
- Confirmed: known from real data or setting canon.
- Derived: calculated from known values, such as insolation or habitable-zone boundaries.
- Inferred: plausible but not directly known, such as an undetected cold belt.
- GU-layer: fictional but internally consistent with Geometric Unity.
- Human-layer: fictional settlement, wreck, faction, base, or historical event.

The UI must expose these labels so procedural fiction does not appear to overwrite imported or canon facts.

## 6. Generator Pipeline

The generator should follow this ordered pipeline:

1. Import or generate the star system.
2. Determine reachable-volume bias.
3. Determine stellar age, metallicity, activity, and multiplicity.
4. Roll system architecture.
5. Place or import known planets.
6. Fill plausible orbital gaps.
7. Generate planets, moons, belts, rings, dwarf bodies, and rogue/captured bodies.
8. Apply modern exoplanet filters.
9. Apply Geometric Unity overlays.
10. Generate resources, hazards, routes, settlements, bases, wrecks, and factions.
11. Assign mystery sources and run a no-alien check.

Each stage should be implemented as a pure function that receives an RNG and the current draft system, then returns a new or updated draft. This keeps generation testable, deterministic, and compatible with future partial imports.

## 7. Input Controls

MVP controls
- Seed: free-text seed, with randomize and copy controls.
- Distribution: realistic local-ish or reachable frontier.
- Tone/bias: astronomy-forward, balanced, or cinematic.
- GU intensity preference: normal, low, high, or major fracture likely.
- Settlement density: sparse, normal, crowded, or campaign hub.
- Starting point: fictional system in MVP.

Future controls
- Import known star system JSON.
- Lock imported stars or planets.
- Regenerate only selected layers: physical system, GU overlay, settlements, adventure hooks, or names.
- Select system role: trade spoke, dead-end, military lane, corporate route, resonance hub, Gardener-shadowed, and similar reachability classes.

URL state
- `seed`
- `distribution`
- `tone`
- `gu`
- `settlements`
- Optional future `locks` or `importId`

Seed and options should use ordinary query-string state, not dynamic path segments or URL hashes. Static export cannot prebuild arbitrary seed paths such as `/tools/star_system_generator/7f3a9c2e/`, while query strings work with the existing `/tools/star_system_generator/` page and are easy to share, bookmark, and test.

Example:

```
/tools/star_system_generator/?seed=7f3a9c2e&distribution=frontier&tone=balanced&gu=normal
```

Defaults should produce a short URL; empty/default options may be omitted. A seed-only shared URL should be valid:

```
/tools/star_system_generator/?seed=7f3a9c2e
```

## 8. Output Requirements

System overview must include:
- System name.
- Data basis: fictional, real star, or mixed.
- Primary star summary: spectral type, mass, luminosity, age, metallicity, and activity where available.
- Companions, if any.
- Reachability class, gate status, and pinch difficulty.
- Architecture.
- Habitable-zone and snow-line estimates.
- GU intensity.
- Primary economy.
- Major hazards.
- No-alien check.

Orbital table must include:
- Orbit or location.
- Body name.
- Body class.
- Thermal zone.
- Key traits.
- Confidence labels.
- Sites or settlements.

Detail panels should include:
- Star details.
- Planet/world details: atmosphere, hydrosphere/volatile state, geology, climate tags, radiation, biosphere.
- Moons, belts, rings, and minor bodies.
- GU zones: intensity, location, behavior, resources, and hazards.
- Settlement/base profiles: scale, location, function, authority, built form, AI situation, condition, tags, current crisis, hidden truth, local encounter sites.
- Human ruins and derelicts.
- System phenomena.

Exports
- Markdown summary using the compact system profile from the source writeup.
- JSON export using the internal schema.

## 9. Data Model

The exact TypeScript model may evolve during implementation, but it should start with these concepts:

```
GeneratedSystem
  id
  seed
  generatedAtVersion
  options
  name
  dataBasis
  stars[]
  reachability
  architecture
  zones
  bodies[]
  guOverlay
  settlements[]
  ruins[]
  phenomena[]
  adventureSummary
  noAlienCheck
  rolls[]

Fact<T>
  value
  confidence
  source?
  locked?

GenerationOptions
  seed
  distribution
  tone
  guIntensityPreference
  settlementDensity
```

Known-system import should use `locked: true` facts where the user or imported dataset supplied the value. Generator stages must respect locked facts and only fill missing or fictional layers unless explicitly asked to reroll them.

## 10. UX & Layout

The page should be an actual tool as the first screen, not a landing page.

Recommended layout
- Header/tool bar with title, seed control, randomize, export, and reset.
- Compact generation controls in a left/sidebar or top control band depending on viewport.
- Main system overview panel.
- Orbital table as the central scanning surface.
- Detail drawer or section for selected bodies/sites.
- Separate tabs or segmented controls for Overview, Orbits, Settlements, Hazards, and Export.

Visual style
- Work-focused, dense, and readable.
- Use restrained sci-fi styling without decorative gradients or oversized marketing panels.
- Use icons for repeat actions such as randomize, copy, export, reset, expand, and collapse.
- Confidence labels should be visually distinct but not noisy.

Accessibility
- All controls labeled and keyboard operable.
- Export/copy controls announce success.
- Detail sections use real buttons and `aria-expanded` where collapsible.
- Color is not the only indicator for confidence labels or hazards.

## 11. Performance

- Client-only dynamic import (`ssr: false`) to isolate bundle cost from the blog.
- Pure synchronous generation should complete quickly for one system.
- Generator tables should be static TypeScript data, not fetched remotely.
- Use memoization for generated output keyed by options.
- Avoid heavy visualization in the MVP; add orbital map visualization later if needed.

## 12. Testing

Unit tests
- Seeded RNG is deterministic.
- Dice helpers support d6, d12, d20, d66, d100, and weighted tables.
- Generator stages are deterministic for fixed seed/options.
- Derived calculations for insolation, habitable-zone bounds, snow line, and thermal zone classification.
- Modern exoplanet filters: radius valley, hot Neptune desert, peas-in-a-pod, M-dwarf habitability.
- No-alien guard prevents alien civilization/artifact outputs.
- Imported/locked facts are not overwritten by generation stages.
- Markdown and JSON export include required fields.

Component/a11y tests
- Tool renders generated output.
- Controls regenerate deterministically.
- Seed URL round-trip works.
- Export controls are reachable.
- A11y smoke test has no critical violations.

Build checks
- Static export compatible.
- No server-only APIs.
- Route uses trailing slash semantics.

## 13. Acceptance Criteria

- `/tools/star_system_generator/` renders client-side without SSR and without console errors.
- User can generate a system from a random seed or typed seed.
- Same seed and options produce the same output.
- Output includes system overview, orbital table, at least several generated bodies/sites, GU overlay, settlements or ruins when appropriate, hazards, and adventure-facing hooks.
- Facts display confidence labels.
- No generated output creates alien civilizations, alien ruins, alien artifacts, or alien megastructures.
- User can export Markdown and JSON.
- URL query-string state restores seed/options on reload.
- Core generator and UI tests pass.
- `npm run lint`, `npm run test`, and `npm run build` pass before release.

## 14. Risks & Open Questions

Risks
- The source procedure is large; a complete first pass could become too broad unless the MVP is constrained.
- Tables can create contradictory outputs unless generation stages normalize and validate results.
- Future known-system import will be hard to add if the MVP does not model fact confidence and locked facts from the start.
- Rich generated text can become repetitive without careful phrasing and compositional templates.

Open questions
- Should the first public version include any setting-specific proper nouns beyond Geometric Unity, Sol/Gardener, Iggygates, Pinchdrives, and observerse terminology?
- Should generated names use a fixed in-setting naming language, a broad sci-fi style, or a simple neutral name table?
- Should local browser persistence save only the last seed/options, or a small saved-system list?
- Should the MVP include a simple visual orbit strip, or keep the first release table-only?

## 15. References

- Source writeup: `SOURCE_WRITEUP.md`
- Repository standards: `docs/STANDARDS.md`
- Site PRD: `docs/PRD.md`
- Existing tool pattern: `src/features/tools/kcd2_alchemy/`
