# GU Glossary Simplification — Design

**Status:** Design approved 2026-05-07. Ready for implementation planning.

**Target file:** `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`

## Goal

Cut the GU Glossary from ~75 entries (~3,800 words) to **13 hero entries** (~2,000 words target) that a casual reader can hold in their head, while preserving every underlying GU concept currently in the file.

## Audience

Casual readers and players skimming a system writeup or generator output for vibe. They need flavor without homework. They are not GMs running the generator at the table, and not the generator authoring tools — those audiences are served by separate documents (the Setting Primer, the generator data files).

## Non-goals

- **Code refactor.** The generator's data files (`src/features/tools/star_system_generator/lib/generator/data/gu.ts`, prose helpers under `lib/generator/prose/`, graph rules under `lib/generator/graph/rules/`) reference demoted terms. Updating those is a separate implementation plan.
- **The Setting Primer** (`GU_SETTING_PRIMER.md`). May also reference demoted terms; that's a follow-up.
- **World-type taxonomy.** "Eyeball world", "twilight ocean", "snow-line chiral belt" are world categories, not GU vocabulary. They get cut from the glossary entirely. If a planet-types reference is wanted, it lives elsewhere.

## Design

### Voice and register — preserved

The current pulpy, sailor-vs-weather, fatalistic register is a strength. The simplification compresses term *count*, not register. Phrasing like "worth a fortune. worth a hand on every shift" and "every procedure has a survivor list" stays. The closing "rolling these at the table" paragraph also stays — it is the contract that makes the concept-tree format work.

### Spelling standardization

Standardize on **`observerse`** throughout. Replace `observiverse` everywhere it appears today (e.g. "narrow observiverse AI", "observiverse-reactive crystal foam"). The two spellings appear to be drift, not intentional flavor.

### Structural pattern: concept tree

Each hero term gets one entry with this shape:

```markdown
### <Hero Term>
2–3 sentences of flavor + theory. The "what it is, what it looks
like, why a crew should care" beat from the current glossary, kept.

*Appears as:* short list of demoted variants in **bold**, each with
a parenthetical or em-dash gloss. One paragraph, no bullets.
```

The "Appears as:" line is the load-bearing element of the simplification: it lets a casual reader decode unfamiliar generator output (e.g. "flare-amplified bleed season") by recognizing the parent term and reading one line, instead of looking up six related entries.

### Document layout

Three top-level sections, replacing the current six-plus-coda structure:

**1. The geometry** — 7 heroes
- Geometric Unity (GU) & the observerse — combined entry, since they're the framing
- Bleed
- Chirality
- Shiab
- Dark sector
- Programmable matter
- Metric storm & shear — combined entry, since they're the same weather seen at two scales

**2. Travel and authority** — 4 heroes
- Pinchdrive
- Iggygate
- The Gardener
- Sol Silence

**3. People and machines** — 2 heroes
- Narrow AI
- First-wave

Plus the existing closing paragraph "A note on rolling these at the table" preserved verbatim or near-verbatim.

### Hero shortlist with absorption mapping

Every demoted term must appear inside its parent's "Appears as:" line, so the reader can still trace generator output back to a concept.

| # | Hero | Section | Absorbs (demoted to "Appears as") |
|---|---|---|---|
| 1 | GU & observerse | Geometry | (combined; framing only) |
| 2 | Bleed | Geometry | bleed node, bleed window, bleed season (formerly "flare-amplified bleed season"), moving bleed-node river, failed Iggygate wake (as a kind of scar), settlement madness rumor (as anecdote inside the entry), bleed intensity bands (the quiet→shear-zone danger dial), human vestibular/neurological effects (bleed exposure on bodies) |
| 3 | Chirality | Geometry | left/right chiral silicates, chiral ice phases, chiral volatile reservoirs, flare-imprinted chiral aerosols, shielding-grade chiral plating feedstock, medical chirality stock, chiral cloud chemistry, chiral contamination |
| 4 | Shiab | Geometry | the math; **Shiab Blade** named inside the entry |
| 5 | Dark sector | Geometry | dark-sector doped ore, gravity-skewed heavy isotopes, Iggygate anchor mass (as a use case), dark-sector gravity tides; **Shadow Lance** named inside the entry |
| 6 | Programmable matter | Geometry | programmable-matter microseeds, self-ordering regolith, programmed regolith growth, observerse-reactive crystal foam |
| 7 | Metric storm & shear | Geometry | metric shear hull damage, local gravity fluctuation, navigation baseline drift, clock desynchronization, matter phase instability, false sensor returns (mirages and sensor ghosts caused by metric weather), metric-flattened shields (the defensive countermeasure) |
| 8 | Pinchdrive | Travel | calibration scar, misjump, calibration medium, pinch difficulty, pinchdrive misjump risk |
| 9 | Iggygate | Travel | throat, wake, anchor mass (cross-referenced to Dark sector), throat instability, gate-selected anomaly, bleed window (cross-referenced to Bleed) |
| 10 | The Gardener | Travel | surgical strike, Gardener-shadowed, Gardener warning beacon, Sol-interdiction |
| 11 | Sol Silence | Travel | the standing condition; cross-references the Gardener |
| 12 | Narrow AI | People | AI perception errors, narrow-AI fragmentation risk, narrow-AI witness core, narrow-AI stabilizer substrate, rogue ASI fragment |
| 13 | First-wave | People | first-wave colony, first-wave ruin, first-wave heir |

(The table shows 13 rows. Entries 1 and 7 each cover two related concepts inside a single combined entry, so the file ends up with 13 rendered headings plus the closing paragraph.)

### Cuts and folds

These do not get a standalone entry. Items marked "folded" are still mentioned by name inside their parent hero's prose; items marked "cut" are removed entirely with no demoted reference (the reader infers them from context if the generator ever emits them):

- **Swervature crystals** — cut. Slang for crystallized bleed deposits; redundant with Bleed nodes.
- **Phase dust** — cut. Covered under Bleed and Metric storm & shear in spirit; reader infers from context.
- **Ring-arc phase dust** — cut. Variant of the above.
- **Metric shear condensates** — cut. Specific cargo flavor.
- **Phase-stable superconductive lattice** — cut. One of N armor materials; reader gets the same idea from chiral plating inside Chirality.
- **Snow-line organochemical feedstock** — cut. Specific cargo flavor.
- **Deep-ocean catalytic vent matter** — cut. Specific cargo flavor.
- **Sol-prohibited geometry sample** — cut. Covered by general Gardener interdiction language.
- **Eyeball world**, **twilight ocean**, **snow-line chiral belt** — cut. These are world types, not GU vocabulary; belong in a separate planet-types reference if wanted.
- **Chiral plating** (as standalone weapon-tech entry) — folded. Mentioned by name inside Chirality.
- **Systemic cascade** — cut. Alarm flavor, not a vocabulary term.

If the user later finds the generator emits a cut term and the reader can't decode it, the term gets reinstated either as a hero or inside a parent's "Appears as" line. This is a deliberate trim with a reversal path, not a permanent excommunication.

## Sample entries

### Bleed

> A general term for places where the boundary between 4D spacetime and the observerse goes thin. Bleed shows up as faint distortions on instruments, off-color light at the edge of vision, and matter that won't quite settle into one form. Every bleed zone is a resource site, a hazard, and a target for someone — sometimes all three at once. Crews talk about bleed the way old sailors talked about weather they couldn't see coming.
>
> *Appears as:* anchored **nodes** (the working sites where most crews go and most crews die), timed **windows** (predictable safe intervals — ports run on these), seasonal **blooms** under stellar flares, drifting **rivers** that crews chase like fishing fleets, and dead **scars** left by collapsed gates. Stations rumored to have "gone strange" almost always sit on an unmapped low-grade source.

### Pinchdrive

> The standard human FTL. Locally rescales the metric so a ship moves faster than light without violating relativity from its own frame. Looks like a brief lensing flicker, then the ship is gone. Cheap to install, expensive to run, and unforgiving of bad geometry. Every captain knows someone who pinched into a place that didn't quite exist.
>
> *Appears as:* **calibration scars** (long thin folds left by repeated use — faster, but inheriting every prior misalignment), **misjumps** (the failure mode, from "ten light-seconds off" to "inside a moon"), **calibration medium** (the heavy oily fluid from bleed nodes that tunes a drive to a route; refineries that hold a steady supply hold the local economy), and **pinch difficulty** (captain's shorthand for how dangerous a route is to drive).

### Chirality

> Particles, alloys, and chemistries with a strong left- or right-handed geometric bias. Looks like ordinary matter until you put it under the right instrument and one handedness refuses to mix with the other. The setting's premium materials all run on this asymmetry — chiral ore powers AI substrates, armor, and medicine. Eat the wrong handedness and your body forgets how to be a body.
>
> *Appears as:* **ore and silicates** (mined, refined into plating and AI substrates), **ice and volatiles** (water and gases locked into asymmetric lattices, identical to clean ice until a chiral assay lights up), **aerosols** (atmospheric, recording stellar flare history), **medical stock** (calibrated for human biology — without it, exposure cases die in the wrong shape), and **cloud chemistry** (whole weather systems built around it). Chiral mismatch is the most common cause of frontier clinic deaths.

## Acceptance criteria

The simplified `GU_GLOSSARY.md` is acceptable when:

1. **Thirteen hero entries** are present (GU+observerse and Metric storm+shear are each one combined entry) plus the closing "rolling these at the table" paragraph.
2. **Every concept** in the current glossary that the user wants preserved appears either as a hero or inside an "Appears as:" line — except for the deliberately cut items listed above.
3. **No `observiverse` spelling** remains in the file.
4. **Voice is preserved** — at least one fatalistic punchline per long entry, present-tense framing, sailor-vs-weather analogies kept where they appear today.
5. **Word count ~1,900–2,300** (down from ~3,800). Hard limits aren't necessary — the test is "a reader can finish the file in 5 minutes."
6. The closing **"rolling these at the table"** paragraph is preserved (verbatim or with light edits).
7. **No code or test changes** in this deliverable. The generator data files continue to function unchanged because the simplified glossary is a documentation file the code does not import.

## Risks and follow-ups

- **Drift between simplified glossary and generator output.** The generator currently emits demoted terms in prose ("Pinchdrive calibration scar in a flare-amplified bleed season"). After simplification, those terms should still be decodable via the parent entries' "Appears as" lines, but if the generator emits something not listed under any parent, the reader is stuck. Mitigation: after the glossary lands, sweep recent generator outputs (e.g. `SAMPLE_REVIEW_2026-05*.md`) and confirm every emitted GU term appears either as a hero or in an "Appears as" line.
- **Setting Primer cross-references.** If the primer cites cut terms (e.g. "swervature crystals"), those references break in spirit. Out of scope here; flag for a primer pass.
- **Code references to cut terms.** `lib/generator/data/gu.ts` and friends may emit terms this glossary no longer documents. Code is allowed to keep those terms in the short term — the doc isn't load-bearing for the generator — but a follow-up sweep is recommended.

## Out of scope (explicit reminder)

This spec covers the contents of `GU_GLOSSARY.md` only. It does not modify the Setting Primer, the generator code, the generator data tables, the test suite, or any sample outputs. Each of those is a separate spec if and when wanted.
