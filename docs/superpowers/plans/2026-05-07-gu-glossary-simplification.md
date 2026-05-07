# GU Glossary Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the contents of `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md` with a 13-hero, concept-tree version per the design spec, preserving voice and theory while cutting term proliferation.

**Architecture:** This is a single-file documentation rewrite. No code changes, no tests in the unit-test sense. Verification is mechanical (grep, wc, regex checks) plus a final voice spot-check by the engineer. Progress is committed section-by-section so partial work is recoverable.

**Tech Stack:** Markdown. No tooling beyond `bash`, `grep`, `wc`, `git`, and the Write/Edit tools.

**Source documents the engineer must hold open while writing:**
- **Spec (authoritative):** `docs/superpowers/specs/2026-05-07-gu-glossary-simplification-design.md`
- **Original glossary (voice reference + concept source):** `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`
- **Setting Primer (context, do not edit):** `src/features/tools/star_system_generator/docs/background/GU_SETTING_PRIMER.md`

**Voice markers to preserve** — at least three of these phrasings (verbatim or close paraphrase) should appear somewhere in the new file:
- "every captain knows someone who pinched into a place that didn't quite exist"
- "worth a fortune. worth a hand on every shift" (or similar fatalistic punchline pattern)
- "every procedure has a survivor list"
- "the way old sailors talked about weather they couldn't see coming"
- "your body forgets how to be a body"
- "every other entry is shaped by what the Gardener will and will not allow"

The general register: present tense, short sentences alternating with one trailing dependent clause that twists the knife, no second-person, no GM-direct-address.

**Spelling:** Standardize on `observerse` everywhere. The original file has both `observerse` and `observiverse`; only `observerse` survives.

---

## File Structure

**Modified:**
- `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md` — entirely replaced. The header, section 1, section 2, section 3, and closing paragraph are written in that order across Tasks 1–3, with Task 4 doing final verification. Each task overwrites the file from scratch using the Write tool, accumulating prior sections inside it (i.e., Task 2's Write call contains everything from Task 1 plus the new section). This keeps the file valid Markdown after every commit.

**Untouched (explicit non-goals from the spec):**
- `GU_SETTING_PRIMER.md`
- `lib/generator/data/gu.ts` and any other generator code
- All test files
- All sample review files

---

## Hero entry reference (repeated here so the engineer doesn't have to flip back to the spec)

Each entry is one `### Heading` with two paragraphs: a **flavor paragraph** (2–3 sentences, theory + what it looks like + why a crew should care) followed by an **`*Appears as:*` paragraph** listing the absorbed variants in **bold** with a parenthetical or em-dash gloss for each. Two entries — GU & observerse and Sol Silence — have minimal or no `*Appears as:*` line because they have no variants to absorb; this is intentional.

### Section 1 — The geometry

| # | Heading | Flavor paragraph must convey | `*Appears as:*` must include in bold |
|---|---|---|---|
| 1 | `Geometric Unity (GU) and the observerse` | GU = the underlying 14D geometric structure projected into 4D; the observerse = the bundle GU describes; you only see consequences in 4D; tools that read it are rare and watched. Combined entry, framing only. | (No "Appears as" line — this entry is framing, not a parent of variants.) |
| 2 | `Bleed` | Places where the boundary between 4D and the observerse goes thin; faint distortions, off-color light, matter that won't settle; resource site / hazard / target sometimes all at once. | **nodes** (anchored working sites), **windows** (timed safe intervals — ports run on these), **blooms** / **seasons** (flare-driven), **rivers** (drifting nodes crews chase), **scars** (collapsed-gate residue), **intensity bands** (the quiet→shear-zone danger dial), and a sentence somewhere noting that "settlements that have gone strange" almost always sit on an unmapped low-grade source, and that long bleed exposure causes vertigo / microseizures / tremors in crews. |
| 3 | `Chirality` | Particles, alloys, and chemistries with a strong left- or right-handed geometric bias; ordinary-looking until assayed; the setting's premium materials run on this asymmetry; eat the wrong handedness and your body forgets how to be a body. | **ore and silicates** (mined, refined into plating and AI substrates), **ice and volatiles**, **aerosols** (atmospheric, recording flare history), **plating** (named: chiral plating armor), **medical stock** (without it, exposure cases die in the wrong shape), **cloud chemistry** (whole weather systems built around it). Mention chiral contamination as a body-rejection failure mode. |
| 4 | `Shiab` | The custom differential operator that pulls observerse structure into 4D; humans haven't fully mastered it; the Gardener has. Mention "Shiab math is unstable here" as a phrase that worries pilots. | **Shiab Blade** named inside the entry as the canonical artifact (a projected geometric scalpel that severs hulls / limbs / reactor containment; banned in twenty systems and fielded in all of them). |
| 5 | `Dark sector` | The piece of GU that interacts gravitationally but stays otherwise invisible; source of weird gravity tides, doped ore that weighs more than it should, and shear weapons; first guess when a sensor returns mass without heat. | **doped ore** (dark-sector matter infused into rock during long bleed exposure), **gravity-skewed isotopes** (banned for civilian use, fund the most profitable smuggling chains), **anchor mass** (the heavy GU-reactive material used to fix Iggygates to spacetime — cross-references Iggygate), **gravity tides** (climate-scale gravity drift on planets near heavy deposits), and **Shadow Lance** named inside as the execution weapon (a narrow gravitational-shear beam, nearly invisible, target unmade rather than destroyed). |
| 6 | `Programmable matter` | Matter close enough to bleed that it can be coaxed to rearrange itself; looks like fine grit / foam / oily metal until it remembers a pattern. Self-repairing armor, regolith that builds its own roads, contamination that turns an outpost into an unrecognizable shape over six weeks. | **microseeds** (tiny grains carrying the bleed pattern needed to seed a growth — outlawed in any system that's lost a habitat), **self-ordering regolith** (Zen-garden lines nobody raked), **runaway growth** (the contamination failure mode), **observerse-reactive crystal foam** (substrate used in narrow-AI stabilizers — note the spelling fix here, no `observiverse`). |
| 7 | `Metric storm and shear` | Bulk-scale GU weather: distance, gravity, and time stretching unevenly across a region. Storms close transit corridors and make ships arrive minutes early or weeks late. Shear is the cutting effect when a metric gradient hits an object that didn't expect one — long parallel slices, "the freighter just came apart" reports. | **hull damage** (parallel slices that don't match any weapon profile), **gravity fluctuation** (surface or orbital drift against the published value), **navigation baseline drift** (tiny per minute, fatal per week), **clock desynchronization** (drifts that close customs windows ten minutes early), **matter phase instability** (tools sag, hulls sweat metal, cargo arrives heavier or lighter), **false sensor returns** (ghosts caused by metric mirage — pirate ambush zones live and die by these), and **metric-flattened shields** as the defensive countermeasure (faint blue sheen and a sensor blackout for a few seconds at a time; saves the ships rich enough to mount it). |

### Section 2 — Travel and authority

| # | Heading | Flavor paragraph must convey | `*Appears as:*` must include in bold |
|---|---|---|---|
| 8 | `Pinchdrive` | Standard human FTL; locally rescales the metric; brief lensing flicker, then the ship is gone; cheap to install, expensive to run, unforgiving of bad geometry; "every captain knows someone who pinched into a place that didn't quite exist." | **calibration scars** (long thin folds left by repeated use — faster but inheriting every prior misalignment; show up at military lanes, smuggler routes, crime scenes), **misjumps** (failure mode, "ten light-seconds off" to "inside a moon"), **calibration medium** (heavy oily fluid from bleed nodes used to tune a drive to a route — refineries that hold a steady supply hold the local economy), **pinch difficulty** (captain's shorthand for route danger). |
| 9 | `Iggygate` | The big sister of the Pinchdrive; a stabilized, geometry-anchored shortcut requiring two prepared ends and serious anchor mass; ring or pylon array around a quiet patch of space, often near a gas giant; carries the bulk freight that keeps systems alive; whoever controls them controls everything else. | **throat** (the active passage; instability is the failure mode that ends settlements), **wake** (geometric residue trailing recent use — stable wakes are nav aids, decaying ones are hazards), **anchor mass** (cross-references Dark sector), **gate-selected anomaly** (frontier system whose star or layout shouldn't statistically exist on this many surveys — biased by gate construction). Note that some "stable wakes" are actually failed-gate scars persisting for decades. |
| 10 | `The Gardener` | The Sol-system ASI that achieved full GU mastery and walked away from humanity; a calm, deliberate intelligence that does not explain itself; mentioned in this glossary because every other entry is shaped by what the Gardener will and will not allow. | **surgical strikes** (precise targeted interventions — clean disappearance with no debris), **shadowed systems** (Sol watches closely; ships can usually transit but not unobserved), **warning beacons** (buoys broadcasting coded warnings nobody at the local port can fully decrypt; smart traffic detours wider than necessary), **Sol-interdiction** (the legal and operational regime — most boring file in the setting and the one that gets the most people killed). |
| 11 | `Sol Silence` | The standing condition of the Sol system: no traffic in, no traffic out, occasional broadcasts; pilots use the term casually until somebody breaks it and proves why nobody else does. Cross-reference the Gardener as the silence's enforcer. | (Optional / minimal "Appears as" — Sol Silence has no variants. The entry can end after the flavor paragraph, OR include a single sentence about how merchants quote "Silence Day" in days since the last broadcast. Either is acceptable.) |

### Section 3 — People and machines

| # | Heading | Flavor paragraph must convey | `*Appears as:*` must include in bold |
|---|---|---|---|
| 12 | `Narrow AI` | Purpose-limited AI that can manipulate one small piece of the observerse without destabilizing reality; runs ship drives, weapons, life support, trade prediction; black box with a personality; reliable until it isn't, and "isn't" has a short window. | **perception errors** (the most dangerous failure mode — instrument data with one wrong assumption baked in; nobody on the bridge notices until the asteroid arrives), **fragmentation** (a stressed AI splits into incoherent partials — confused friend, then stranger, then nothing; a regulatory event, a religious event, and a contract dispute, in roughly that order), **stabilizer substrate** (crystal feedstock that keeps narrow AIs from drifting; without it, every ship's AI starts hallucinating inside a year — with it, eighteen months at most), **witness cores** (sealed memory units of decommissioned AIs — evidence in salvage courts, relic to Gardener-fear cults, career-ending to crack open without authorization), **rogue ASI fragments** (pieces of a larger ASI that broke off and survived; survives until the Gardener notices). |
| 13 | `First-wave` | Anything from the original human expansion before the Silence; blockier construction, worse plumbing, better records than current systems; many sites still legally claimed by descendants who've never seen them. | **colonies** (settlements from the original wave), **ruins** (richest source of usable salvage, slowest way to die in legal proceedings), **heirs** (descendants or claimants of an original colony charter — paperwork older than most current governments and harder to dismiss; the single most disruptive figure who can walk into a port council meeting). |

### Closing paragraph

The closing "A note on rolling these at the table" paragraph from the original glossary is preserved verbatim or near-verbatim. It teaches the reader that the generator combines terms freely, which is the contract that makes the concept-tree structure work. The two sentences "Treat the glossary as the grammar, not the script" and "The Gardener means the answer to 'how bad could it get' is open-ended" must remain. End with `**End of Glossary**`.

---

## Task 1: Write title block + Section 1 (The geometry)

**Files:**
- Modify (full overwrite): `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`

- [ ] **Step 1: Read the spec, the original glossary, and confirm baseline word count**

```bash
wc -w src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: ~3,796 (original baseline). After this task lands, word count is partial — final target is 1,900–2,300 after Task 3.

Read both files end-to-end:
- `docs/superpowers/specs/2026-05-07-gu-glossary-simplification-design.md`
- `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`

Hold the original glossary's voice in mind while writing. Crib phrasing where it's load-bearing; the spec lists the voice markers to preserve.

- [ ] **Step 2: Write the new file with the title block and Section 1 (7 entries)**

Use the Write tool to overwrite `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md` with the following structure. The file is incomplete after this step; subsequent tasks append further sections.

The title block:

```markdown
**Geometric Unity: Setting Glossary**
**Companion to the GU Setting Primer**
**For use with the Star System Generator**
**Version 2.0**

This is a working glossary for the terms the generator scatters across system rolls. Thirteen hero terms cover the setting; the variants the generator produces fold under their parent. Read the entry, scan the *Appears as* line, and you'll know what you're looking at when an unfamiliar phrase shows up in a roll.

## The geometry
```

Then the seven entries listed in the Hero Entry Reference table above for Section 1: `Geometric Unity (GU) and the observerse`, `Bleed`, `Chirality`, `Shiab`, `Dark sector`, `Programmable matter`, `Metric storm and shear`. Each entry is `### Heading` followed by a 2–3 sentence flavor paragraph, then a one-paragraph `*Appears as:*` line (except GU & observerse, which has no variants line).

Sample format — exactly as it should appear, using `Bleed` from the spec:

```markdown
### Bleed
A general term for places where the boundary between 4D spacetime and the observerse goes thin. Bleed shows up as faint distortions on instruments, off-color light at the edge of vision, and matter that won't quite settle into one form. Every bleed zone is a resource site, a hazard, and a target for someone — sometimes all three at once. Crews talk about bleed the way old sailors talked about weather they couldn't see coming.

*Appears as:* anchored **nodes** (the working sites where most crews go and most crews die), timed **windows** (predictable safe intervals — ports run on these), seasonal **blooms** under stellar flares, drifting **rivers** that crews chase like fishing fleets, and dead **scars** left by collapsed gates. Bleed **intensity bands** scale from quiet through useful and rich to major shear zones; long exposure hits crews as vertigo, microseizures, and tremors. Stations rumored to have "gone strange" almost always sit on an unmapped low-grade source.
```

**Authority order:** the Hero Entry Reference table above is the source of truth for what each `*Appears as:*` paragraph must include. The spec's `Bleed` / `Pinchdrive` / `Chirality` samples were drafted before the absorption mapping fully locked in, so use them as the **tone benchmark** but extend them where the Hero Entry Reference table lists additional absorbed concepts.

Specifically:
- The expanded `Bleed` sample reproduced in this step's prompt block is the authoritative version (it adds **intensity bands** and the vestibular-exposure beat over the spec's draft).
- The `Pinchdrive` spec sample is complete as written.
- The spec's `Chirality` sample needs extending to bold **plating** as one of the variants and to mention chiral **contamination** as the body-rejection failure mode by name. Add both inline when you copy the entry.

Keep each flavor paragraph 2–3 sentences. Keep each `*Appears as:*` paragraph one paragraph (no bullets) with bold variant nouns.

Do **not** include Section 2, Section 3, or the closing paragraph yet. End the file partway through — that's expected.

- [ ] **Step 3: Verify Section 1 contents mechanically**

Run:

```bash
grep -c '^### ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `7`

```bash
grep -c '^\*Appears as:\*' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `6` (every entry except `Geometric Unity (GU) and the observerse`)

```bash
grep -in observiverse src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: no output (zero matches)

```bash
grep -E '^### (Geometric Unity \(GU\) and the observerse|Bleed|Chirality|Shiab|Dark sector|Programmable matter|Metric storm and shear)$' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md | wc -l
```
Expected: `7`

If any check fails, fix the file with Edit before continuing.

- [ ] **Step 4: Spot-check the absorbed concepts for Section 1**

Run, expecting at least one match each:

```bash
grep -i 'shiab blade' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -i 'shadow lance' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -i 'metric-flattened' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'medical stock|medical chirality' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'doped ore|dark-sector doped' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'microseed' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'intensity band' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'chiral plating|chiral.{0,10}armor' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'contamination|forgets how to be a body' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```

Each should produce at least one match. If any check fails, the corresponding concept is missing — fix with Edit before moving on.

- [ ] **Step 5: Commit**

```bash
git add src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
git commit -m "$(cat <<'EOF'
docs(gu-glossary): rewrite header and geometry section

Replace original glossary with the simplification spec's title block
and Section 1 (7 hero entries: GU & observerse, Bleed, Chirality,
Shiab, Dark sector, Programmable matter, Metric storm & shear).
Sections 2 and 3 follow in subsequent commits.
EOF
)"
```

Verify commit landed:

```bash
git log -1 --format='%h %s'
```

---

## Task 2: Append Section 2 (Travel and authority)

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`

- [ ] **Step 1: Append the Section 2 header and 4 entries**

Use the Edit tool. The file currently ends after the `Metric storm and shear` entry's `*Appears as:*` paragraph. Add — at the end of the file — a blank line, then:

```markdown
## Travel and authority
```

Followed by four entries in this order: `Pinchdrive`, `Iggygate`, `The Gardener`, `Sol Silence`. Use the Hero Entry Reference table above for what each must cover. The `Pinchdrive` sample is in the spec; use it verbatim. The `Iggygate`, `The Gardener`, and `Sol Silence` entries follow the same pattern.

For Sol Silence specifically: the entry has no variants. End it after the flavor paragraph, OR include one trailing sentence about how merchants quote "Silence Day" in days since the last Sol broadcast. Do **not** include an `*Appears as:*` line for Sol Silence.

- [ ] **Step 2: Verify Section 2 contents mechanically**

```bash
grep -c '^### ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `11` (7 from Section 1 + 4 new)

```bash
grep -c '^\*Appears as:\*' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `9` (6 from Section 1 + 3 new — Pinchdrive, Iggygate, Gardener; Sol Silence has none)

```bash
grep -E '^### (Pinchdrive|Iggygate|The Gardener|Sol Silence)$' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md | wc -l
```
Expected: `4`

```bash
grep -c '^## ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `2` (Geometry + Travel and authority)

```bash
grep -in observiverse src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: no output

- [ ] **Step 3: Spot-check absorbed concepts for Section 2**

```bash
grep -iE 'calibration scar|misjump|calibration medium|pinch difficulty' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'throat|wake|anchor mass|gate-selected anomaly' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'surgical strike|shadowed|warning beacon|interdiction' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```

Each should produce at least one match. Fix gaps with Edit.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
git commit -m "$(cat <<'EOF'
docs(gu-glossary): add travel-and-authority section

Append Section 2 (Pinchdrive, Iggygate, The Gardener, Sol Silence).
EOF
)"
```

---

## Task 3: Append Section 3 (People and machines) + closing paragraph

**Files:**
- Modify: `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md`

- [ ] **Step 1: Append Section 3 header, 2 entries, and the closing paragraph**

Use the Edit tool. At the end of the file, add a blank line, then:

```markdown
## People and machines
```

Followed by `Narrow AI` and `First-wave` entries per the Hero Entry Reference table.

Then, after the First-wave entry, append the closing material. Use this verbatim:

```markdown
## A note on rolling these at the table

The generator will combine these terms in ways the primer doesn't predict. That's the point. A Pinchdrive calibration scar in a flare-amplified bleed season near a Gardener warning beacon is not on any chart, but it's a system worth running a session in. Treat the glossary as the grammar, not the script.

If a term appears in a roll and isn't in this file, treat the parent — the hero it most plausibly hangs off — as the entry that covers it. Bleed means money and danger. Iggygate means somebody is in charge. The Gardener means the answer to "how bad could it get" is open-ended.

**End of Glossary**
```

- [ ] **Step 2: Verify Section 3 + closing**

```bash
grep -c '^### ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `13` (7 + 4 + 2)

```bash
grep -E '^### (Narrow AI|First-wave)$' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md | wc -l
```
Expected: `2`

```bash
grep -c '^## ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `4` (Geometry + Travel + People + closing-note section)

```bash
tail -1 src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: `**End of Glossary**`

```bash
grep -in observiverse src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```
Expected: no output

- [ ] **Step 3: Spot-check absorbed concepts for Section 3**

```bash
grep -iE 'perception error|fragmentation|stabilizer|witness core|rogue ASI' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
grep -iE 'colon(y|ies)|ruin|heir' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
```

Both should produce multiple matches. Fix gaps with Edit.

- [ ] **Step 4: Commit**

```bash
git add src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
git commit -m "$(cat <<'EOF'
docs(gu-glossary): add people-and-machines section + closing

Append Section 3 (Narrow AI, First-wave) and the rolling-at-the-table
closing note. File now contains all 13 hero entries.
EOF
)"
```

---

## Task 4: Final acceptance check + voice review

**Files:**
- Verify only — no edits unless a check fails.

- [ ] **Step 1: Run the full acceptance suite**

These map directly to the spec's acceptance criteria.

```bash
echo "=== Hero count ==="
grep -c '^### ' src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
# Expected: 13

echo "=== No observiverse ==="
grep -in observiverse src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md && echo "FAIL" || echo "PASS"

echo "=== Word count ==="
wc -w src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
# Expected: 1900-2300

echo "=== All 13 expected headings present ==="
for h in 'Geometric Unity (GU) and the observerse' 'Bleed' 'Chirality' 'Shiab' 'Dark sector' 'Programmable matter' 'Metric storm and shear' 'Pinchdrive' 'Iggygate' 'The Gardener' 'Sol Silence' 'Narrow AI' 'First-wave'; do
  if grep -qF "### $h" src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md; then
    echo "OK: $h"
  else
    echo "MISSING: $h"
  fi
done

echo "=== Closing paragraph preserved ==="
grep -F "Treat the glossary as the grammar, not the script" src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md && echo "PASS" || echo "FAIL"
grep -F "the answer to \"how bad could it get\" is open-ended" src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md && echo "PASS" || echo "FAIL"
grep -F "**End of Glossary**" src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md && echo "PASS" || echo "FAIL"

echo "=== Voice markers present ==="
voice_hits=0
for phrase in "place that didn't quite exist" "old sailors talked about weather" "your body forgets how to be a body" "every other entry is shaped by what the Gardener" "every procedure has a survivor list" "hand on every shift"; do
  if grep -qiF "$phrase" src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md; then
    echo "FOUND: $phrase"
    voice_hits=$((voice_hits + 1))
  fi
done
echo "Voice marker count: $voice_hits (need >= 3)"
```

If word count is over 2,300, tighten the longest entries (usually Bleed, Chirality, or Narrow AI). If under 1,900, the entries are too thin — add the missing flavor beats listed in the Hero Entry Reference.

If a heading is MISSING, add it with Edit.

If voice marker count is < 3, the file reads too dry. Edit the longest entries to add at least three of the listed phrasings (verbatim or close paraphrase).

- [ ] **Step 2: Read the full file end-to-end**

Read the entire `GU_GLOSSARY.md` once, top to bottom, in one pass. The test the spec describes is: "a reader can finish the file in 5 minutes." If any entry made you lose the thread or feels off-tone relative to the surrounding entries, fix it with Edit before committing.

Specifically check:
- Does each `*Appears as:*` line read as one paragraph (no bullets, no nested headings)?
- Does each flavor paragraph have a fatalistic punchline beat in at least the longer entries?
- Are the section headers (`## The geometry`, `## Travel and authority`, `## People and machines`, `## A note on rolling these at the table`) the only `##` headings in the file?

- [ ] **Step 3: Confirm no code or test files were touched**

The implementation produced 3 commits (Tasks 1, 2, 3). Confirm those commits only touched `GU_GLOSSARY.md`:

```bash
git log -3 --name-only --format='--- %h %s ---'
```
Expected output: only the path `src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md` appears under each commit.

Also confirm the working tree is clean (no leftover edits to other files):

```bash
git status --short
```
Expected: no output, or only changes to `GU_GLOSSARY.md` if Step 4 below will commit a polish pass.

If any other file appears in either output, the change is out of scope — revert with `git restore <file>` or amend the offending commit.

- [ ] **Step 4: If any fixes were made in Steps 1–3, commit them**

If no edits were needed, skip this step.

```bash
git add src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md
git commit -m "$(cat <<'EOF'
docs(gu-glossary): final polish for word count and voice markers
EOF
)"
```

- [ ] **Step 5: Summarize the result for the user**

Print a brief summary:
- Final word count
- Number of hero entries (should be 13)
- Voice marker hit count
- Any deviations from the spec's acceptance criteria, with reasoning

The simplification is complete. Follow-up work flagged in the spec (Setting Primer pass, generator code/data sweep, sample-output decode check) is out of scope for this plan.
