# Post-Phase-8 Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the five follow-up items surfaced during the Phase 8 retrospective. Three are narrative-graph code/doc work in this repo; two are workflow/process improvements that touch globally-installed superpowers skill files outside this repo.

**Architecture:** Heterogeneous scope. The plan groups all five into one document so the retrospective findings stay traceable, but each task's `Files` section makes the in-repo vs out-of-repo split explicit. Tasks are independent — they can ship in any order, in any combination. No task depends on another.

**Tech Stack:** TypeScript (strict), Vitest, ESLint, existing audit scripts. Plus markdown edits to skill prompt files for Tasks 2–3.

**Source spec:** Phase 8 retrospective conversation summary (post-`214ab55`).

**Branch:** Work on `develop`. Push to `origin/develop` after every successful in-repo task. Out-of-repo skill edits (Tasks 2, 3) don't push to this remote.

**Scope:**
- Task 1: Tighten the `prose.lowercaseFactionMidSentence` audit regex to exclude leading-article cases (this repo).
- Task 2: Update the superpowers `spec-reviewer-prompt.md` to require a post-deletion orphan check (out-of-repo skill edit).
- Task 3: Add a controller-side plan-validation pre-flight to the superpowers `subagent-driven-development` skill (out-of-repo skill edit).
- Task 4: Bootstrap a `NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` so the deferred spine-modulation work has a concrete plan to execute against (this repo; produces a plan document, not a feature).
- Task 5: Decide the fate of `vitest.local.config.ts` — currently broken (happy-dom env doesn't actually load; 71 failures repo-wide, 5 in star_system_generator). Either fix or remove (this repo).

**Out of scope:**
- Implementing tone-aware / gu-aware spine itself. Task 4 produces a plan; the implementation belongs to a future "Phase 9" or named sub-phase that executes against the new plan.
- Fixing every test that fails under `vitest.local.config.ts`. Task 5 only resolves the config status — once the config is fixed or removed, individual test repairs (if any) belong to a follow-up.
- Any change to graph-aware prose consumers, edge rules, or template families beyond what Task 1's regex narrowing affects (none of them are touched).

---

## Architectural Notes

### Why now

These five items surfaced during Phase 8's structured reviewer cadence. Each is small enough to land independently but valuable enough not to lose. Bundling them into one fix plan keeps the retrospective findings traceable without forcing a single coupled commit.

### Why Tasks 2 and 3 are out-of-repo

The superpowers skill files live at `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/`. Editing them affects all future Claude Code sessions on this machine, not just this project. The plan documents the changes; the implementer applies them in the local skill cache.

If the user prefers to keep all retrospective findings in-repo (e.g., as a "controller workflow lessons" appendix to `CLAUDE.md` rather than as edits to the global skill), Tasks 2 and 3 should be adapted accordingly. The default in this plan is to update the skill files because that's where the workflow actually executes.

### Why Task 4 produces a plan, not a feature

Tone-aware and gu-aware spine selection is the most user-visible quality gap in the current corpus (Phase 7's 20-sample review found body[0] reads identically across `astronomy`/`balanced`/`cinematic` tone × `low`/`normal`/`high`/`fracture` gu in 15+/20 samples). It's a substantive feature, not a fix. Phase 8 was a deprecation phase and explicitly out-of-scope for new spine logic. The right shape for this work is a dedicated implementation plan that future phases execute against, not a one-shot patch in this fix plan.

### Why Task 5 is "decide" not "fix"

`vitest.local.config.ts` (happy-dom environment) is currently producing 71 failures across the repo (5 in `star_system_generator/`). The canonical `npm run test` (which uses `vitest.unit.config.ts`, node environment) is green at 944/944 — so day-to-day development is unaffected. The local config exists for a reason (DOM-dependent component tests), but it appears the environment isn't loading correctly (`setup 0ms, environment 10ms` suggests happy-dom wasn't initialized). Two reasonable paths: fix the config so DOM tests run, or delete it if the project no longer relies on DOM-environment tests. Task 5 picks one based on a quick investigation; it does NOT try to repair every individual DOM-dependent test (that's a follow-up if the config is fixed).

### Conventions (matching Phase 8)

- Lowercase commit type (`fix:`, `feat:`, `refactor:`, `docs:`, `chore:`).
- HEREDOC for `git commit -m`.
- Standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.
- Push after every successful in-repo task.
- TypeScript strict; NEVER use `any`.
- No comments in code unless WHY is non-obvious.
- Per-task quality gate (every in-repo task that touches code or audit scripts runs all of these):
  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  npm run audit:star-system-generator:quick
  ```
  Plus `npm run audit:star-system-generator:deep` after Task 1.

---

## File Structure

**In-repo files modified:**
- `scripts/audit-star-system-generator.ts` — Task 1 (regex tightening + comment).
- `vitest.local.config.ts` — Task 5 (fix or delete).
- Possibly `src/test-setup.ts` — Task 5 (if the fix path is chosen).
- Possibly `package.json` — Task 5 (only if `test:local` script is added or removed).
- Possibly `CLAUDE.md` — Task 5 (status note if config status is documented rather than fixed).

**In-repo files created:**
- `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md` — Task 4.

**Out-of-repo files modified:**
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/spec-reviewer-prompt.md` — Task 2.
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/SKILL.md` — Task 3 (or a new dedicated checklist file in the same directory).

**Files unchanged:**
- All narrative graph rules, templates, prose surfaces, types, validation.
- `proseUnchanged.test.ts` and its snapshot.
- `phase6On.test.ts` and its snapshot.
- `composeSpineSummary` in `renderSystemStory.ts` (Task 1 only touches the audit regex, not the renderer).

---

## Task 1: Tighten `prose.lowercaseFactionMidSentence` regex

**Why:** Phase 8 Task 2's code-quality review flagged that the prescribed regex `/[,—] [a-z][a-zA-Z]+ [A-Z]/` will false-positive on legitimate output if a future spine template pairs a leading article with a Capitalized-headed nounPhrase (e.g., `..., the Kestrel Free Compact and Red Vane...`). Currently silent only because every spine template happens to use lowercase-headed nounPhrase subjects after articles — a brittle invariant. Narrowing the regex aligns it with the actual fix shape (`composeSpineSummary` lowercases ONLY leading articles, so the antipattern can ONLY appear when the post-bridge clause starts with a non-article lowercase word).

**Files:**
- Modify: `scripts/audit-star-system-generator.ts` (regex constant + WHY comment).

- [ ] **Step 1: Read the current regex and surrounding comment**

  ```bash
  sed -n '131,145p' scripts/audit-star-system-generator.ts
  ```

  Confirm the constant reads:
  ```ts
  const LOWERCASE_FACTION_MID_SENTENCE_PATTERN = /[,—] [a-z][a-zA-Z]+ [A-Z]/
  ```
  with the existing 5-line WHY comment above it.

- [ ] **Step 2: Replace the regex with the article-excluding version**

  ```ts
  // Phase 8 Task 2 + post-Phase-8 Task 1: catches spine-assembly joiner
  // regressions where a post-bridge clause's proper-noun head was lowercased
  // mid-sentence. Anchors on bridge punctuation (',' or '—' followed by a
  // space) and a "lowercaseWord SpaceUppercaseWord" pair. The negative
  // lookahead excludes leading English articles ("the"/"a"/"an") which
  // composeSpineSummary deliberately lowercases as part of the article
  // narrowing rule — those are correct, not regressions.
  const LOWERCASE_FACTION_MID_SENTENCE_PATTERN = /[,—] (?!(?:the|a|an) )[a-z][a-zA-Z]+ [A-Z]/
  ```

  The negative lookahead `(?!(?:the|a|an) )` rejects matches where the lowercase word is one of the three articles `composeSpineSummary` legitimately produces. Keeps the rest of the pattern intact.

- [ ] **Step 3: Quick audit confirms 0 findings**

  ```bash
  npm run audit:star-system-generator:quick
  ```

  Expected: errors=0, warnings=0. Same as before the regex change (the original regex also produced 0 findings; this only narrows the trigger surface).

- [ ] **Step 4: Deep audit confirms 0 findings**

  ```bash
  npm run audit:star-system-generator:deep
  ```

  Expected: errors=0. Confirms the narrowed regex still catches nothing in the corpus (Phase 8 Task 1's bug fix means there's nothing to catch).

- [ ] **Step 5: Static checks**

  ```bash
  npx tsc --noEmit
  npm run lint
  ```

  Both clean.

- [ ] **Step 6: Full test suite**

  ```bash
  npm run test
  ```

  All passing (944/944 baseline).

- [ ] **Step 7: Commit + push**

  ```bash
  git commit -m "$(cat <<'EOF'
  fix: narrow lowercaseFactionMidSentence regex to exclude leading articles

  The Phase 8 Task 2 audit check used a broad pattern
  /[,—] [a-z][a-zA-Z]+ [A-Z]/ that would false-positive on
  legitimate output if a future spine template ever pairs a
  leading article with a Capitalized-headed nounPhrase (e.g.,
  ", the Kestrel Free Compact and Red Vane..."). The corpus
  is currently silent only because every spine template happens
  to pair :article with a lowercase-headed nounPhrase — a
  brittle invariant the audit shouldn't depend on. Add a
  negative lookahead that excludes "the"/"a"/"an" — the only
  three lowercase heads composeSpineSummary deliberately
  produces — so the audit flags only genuine proper-noun-head
  regressions.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 2: Add post-deletion orphan check to spec-reviewer prompt

**Why:** Phase 8 Task 4's spec reviewer verified all plan-named deletions landed but missed the `narrativeBias` orphan that the producer deletion exposed (it had been consumed only by `generateNarrativeLines`, so deleting that producer left a silent no-op API surface). The code-quality reviewer caught it; the spec reviewer should have. The fix is to extend the spec-reviewer prompt with a "post-deletion orphan check" that asks: after the prescribed deletions, are there now-orphaned exports / public APIs / config knobs that the plan didn't enumerate?

**Files:**
- Modify (out-of-repo): `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/spec-reviewer-prompt.md`

- [ ] **Step 1: Read the current prompt template**

  ```bash
  cat ~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/spec-reviewer-prompt.md
  ```

  Locate the `## Your Job` section and the bulleted checks under "Missing requirements" / "Extra/unneeded work" / "Misunderstandings".

- [ ] **Step 2: Add a "Post-deletion orphan check" subsection**

  Insert after the existing three check categories (`Missing requirements`, `Extra/unneeded work`, `Misunderstandings`):

  ```markdown
      **Post-deletion orphan check (only if the task is a deletion):**
      - After the prescribed deletions, are there now-orphaned exports, helpers, types, public-API options, or config knobs that the plan didn't enumerate?
      - Run `grep -rn "<symbol>" src/ scripts/` for each helper/option that was a transitive consumer of the deleted code. If a symbol has zero remaining consumers, flag it.
      - Don't accept "the implementer extended the cascade themselves" as automatic approval — verify the cascade is closed (zero remaining references for each named-orphan symbol).
      - This catches the failure mode where Task X deletes a producer but leaves a public-API option (e.g., a `GenerationOptions` field) that was only ever read by that producer. Such options become silent no-op traps for callers.
  ```

  Place it BEFORE the "Verify by reading code, not by trusting report." line so the post-deletion check is part of the verification work, not an afterthought.

- [ ] **Step 3: Verify the file is well-formed**

  Read the modified file and confirm the markdown renders cleanly (no broken indentation under the YAML-style fenced block, no orphan headings).

- [ ] **Step 4: No commit needed for the local skill cache.**

  The skill cache is regenerated on plugin update. If the user wants this change to persist across plugin updates, the change should also be PR'd upstream to the superpowers repo. Note in the commit body of any subsequent in-repo work that uses the updated prompt: "Spec-reviewer prompt updated locally to include post-deletion orphan check."

  Optionally, capture the change as a snippet in this repo's `CLAUDE.md` under a new "Workflow conventions" section so future-you can re-apply it after a plugin reinstall.

---

## Task 3: Add controller-side plan-validation pre-flight to subagent-driven-development skill

**Why:** Phase 8 Task 3's plan said `git rm src/.../components/PlayableLayerPanel.tsx`, but the file actually bundled three sibling panels — only one needed removal. The controller (me) caught this by reading the file before dispatching the implementer, but the catch was reactive, not codified. A pre-flight pass — controller reads every file the plan modifies and confirms surface matches plan claims, BEFORE dispatching the first implementer of any task — would have surfaced the mismatch at plan-time rather than discovery-time. This is structural (applies to every plan), not a one-off note.

**Files:**
- Modify (out-of-repo): `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Read the current `SKILL.md` and locate "The Process" section**

  ```bash
  cat ~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/SKILL.md | head -120
  ```

  The process flowchart starts with "Read plan, extract all tasks with full text, note context, create TodoWrite". The pre-flight node should be added between that and the "Per Task" loop.

- [ ] **Step 2: Add a pre-flight node to the process flowchart**

  Insert after `"Read plan, extract all tasks with full text, note context, create TodoWrite"` and before `"Dispatch implementer subagent (./implementer-prompt.md)"`:

  ```dot
  "Plan-validation pre-flight: read every file the plan modifies/deletes; confirm surface matches plan's claims" [shape=box];
  "Discrepancies found?" [shape=diamond];
  "Brief implementer with corrected scope" [shape=box];
  ```

  Wire the edges so the pre-flight runs once per plan (not per task), and discrepancies feed the implementer brief with the correction.

- [ ] **Step 3: Add a "Plan-validation pre-flight" subsection under "The Process"**

  ```markdown
      ### Plan-validation pre-flight

      Before dispatching the first implementer of any plan, read every file the
      plan claims to modify, delete, or reshape. Confirm:
      - Files the plan says to delete actually contain only what the plan describes
        (e.g., a "delete PanelX.tsx" instruction is wrong if the file bundles
        three sibling panels and only one is being deprecated).
      - Files the plan says to modify have the line numbers / function names /
        block boundaries the plan references (line numbers drift between
        plan-write and plan-execute time).
      - Imports the plan says to trim are actually unused only by the deleted
        code (not by other consumers in the same file).

      When a discrepancy is found: brief the implementer with the corrected
      scope inline, citing the original plan instruction and the actual
      file state. Don't make the implementer re-discover the mismatch.

      This catches plan-write-vs-plan-execute drift cheaply (controller is
      already reading files to brief the implementer) without bloating the
      plan-write process with surface re-validation that may be stale by
      execute-time.
  ```

  Place under the existing "The Process" section, after the flowchart but before the "Model Selection" section.

- [ ] **Step 4: Same as Task 2 — no in-repo commit needed**

  The change lives in the local skill cache. If you want it to survive plugin reinstalls, also capture as a snippet in `CLAUDE.md` workflow conventions section.

---

## Task 4: Bootstrap a tone-aware / gu-aware spine selection plan

**Why:** Phase 7's 20-sample review found that body[0] reads identically across `distribution` × `tone` × `gu` inputs in 15+/20 systems — the same six-faction politics scaffold reshuffles regardless of whether the tone is `astronomy`, `balanced`, or `cinematic`, and regardless of GU intensity (`low`/`normal`/`high`/`fracture`). It's the most user-visible quality gap in current output and was explicitly listed as a Phase 8 candidate but deferred (Phase 8 was a deprecation phase). Task 4 produces a dedicated implementation plan so a future phase has a concrete blueprint to execute against.

**Files:**
- Create: `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md`

- [ ] **Step 1: Survey the spine selector**

  Read `src/features/tools/star_system_generator/lib/generator/graph/score.ts` and `lib/generator/graph/render/renderSystemStory.ts` to understand:
  - Where spine eligibility is determined (which edges qualify for spine selection).
  - Where spine ordering is determined (which qualified edge becomes the top spine).
  - Whether `tone` / `gu` are read anywhere in the graph pipeline today (likely no, since the review found no spine-level differentiation).
  - Where `tone` / `gu` ARE read in the broader generator (e.g., for body selection, GU overlay).

- [ ] **Step 2: Survey representative output across the input matrix**

  Generate 12 systems spanning the matrix (3 tones × 4 gu levels) with the same base seed prefix and dump their `spineSummary` + `body[0]` to a temp file. Confirm the Phase 7 finding (output is uniform across the matrix) is still true post-Phase-8.

- [ ] **Step 3: Brainstorm 2–3 design options**

  Examples of likely options (the exact set comes from the survey):
  - **Option A:** Tone-weighted edge-type preferences. `astronomy` tone biases the spine selector toward edges anchored on physical-anomaly entities (DESTABILIZES, HIDES_FROM); `cinematic` biases toward CONTESTS / CONTRADICTS (high-drama).
  - **Option B:** Tone-conditioned body[0] paragraph templates. Same spine selection, but body[0] template family chosen by tone — `astronomy` opens with the spine's physical anchor, `balanced` with the human anchor, `cinematic` with the open conflict.
  - **Option C:** GU-modulated spine eligibility. `fracture` GU expands the spine pool to include phenomenon-on-phenomenon edges (which today's spine excludes); `low` GU shrinks the pool to require strict named-on-named.

  Each option has different scope, risk, and template-authoring cost.

- [ ] **Step 4: Pick one option and outline a phased implementation plan**

  Use the existing `NARRATIVE_GRAPH_PHASE_*_PLAN.md` style (Task structure: Why / Files / numbered Steps / Commit message). Estimate the file count, test surfaces, audit-check additions, and corpus impact. Define the success metric (e.g., "across 30 sampled seeds spanning the matrix, ≥X% have visibly different spine + body[0] under different tone/gu inputs").

  The plan does NOT need to be ship-ready — it needs to be a credible blueprint that a future implementer can execute against without re-doing the architectural thinking.

- [ ] **Step 5: Cross-link from the master plan**

  Append a "Future work" line to `src/features/tools/star_system_generator/docs/NARRATIVE_GRAPH_PLAN.md` that points to the new plan:

  ```markdown
  ## Future work (post-Phase-8)

  - **Tone-aware / gu-aware spine selection** — [plan](./NARRATIVE_GRAPH_TONE_GU_AWARE_SPINE_PLAN.md). Phase 7 review surfaced; deferred from Phase 8 (deprecation phase).
  ```

  Place at the end of the document, after the "A Worked Example" section.

- [ ] **Step 6: Commit + push**

  ```bash
  git commit -m "$(cat <<'EOF'
  docs: bootstrap tone-aware / gu-aware spine selection plan

  Phase 7's 20-sample review surfaced that body[0] reads identically
  across distribution × tone × gu inputs in 15+/20 systems — the most
  user-visible quality gap in current corpus output. Phase 8 deferred
  the work because Phase 8 was a deprecation phase. Bootstrap a
  dedicated implementation plan so a future phase has a concrete
  blueprint to execute against, and cross-link from the master plan's
  future-work section.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  git push origin develop
  ```

---

## Task 5: Decide the fate of `vitest.local.config.ts`

**Why:** `vitest.local.config.ts` is configured for happy-dom but the env doesn't actually load (`setup 0ms, environment 10ms` per a recent run; 71 failures across the repo with `ReferenceError: window is not defined` / `document is not defined`). The canonical `npm run test` (which uses `vitest.unit.config.ts`, node env) is green at 944/944, so day-to-day development is unaffected — but the local config exists for a reason (DOM-dependent component tests like `display-context.test.tsx`, `query-state.test.tsx`, `StarSystemGenerator.test.tsx`). Either it's broken and worth fixing, or it's stale and worth deleting. The current state — broken config with no clear status — is the worst of both.

**Files (depends on which path is chosen):**
- Modify: `vitest.local.config.ts` (fix path) OR delete `vitest.local.config.ts` (remove path).
- Modify: `src/test-setup.ts` (fix path, only if the setup file is the root cause).
- Modify: `package.json` (only if a `test:local` script is added or removed).
- Modify: `CLAUDE.md` (document path; status note about which config is canonical).

- [ ] **Step 1: Investigate the failure mode**

  Run the local config and capture which environment vitest actually loads:

  ```bash
  npx vitest run --config vitest.local.config.ts --reporter=verbose 2>&1 | head -40
  ```

  Compare against the unit config:

  ```bash
  npx vitest run --reporter=verbose 2>&1 | head -40
  ```

  Look for:
  - Does happy-dom appear in the dependency tree of the local config? (`npm ls happy-dom`)
  - Does the setup file (`src/test-setup.ts`) actually run? (Add a `console.log('SETUP RAN')` temporarily.)
  - Are there environment-resolution warnings in vitest's output?

  Likely root causes:
  - `happy-dom` is not installed (was removed at some point and the config wasn't updated).
  - The `src/test-setup.ts` file imports something that throws before happy-dom can take over.
  - The vitest version doesn't support the config shape used.

- [ ] **Step 2: Decide between three paths based on the investigation**

  - **Path A (fix):** If happy-dom is intended to be supported and the failure is a missing dependency or setup-file regression, fix the config so DOM tests actually run. Don't try to repair every individual failing test in this task — only restore the env, then verify the 5 star_system_generator failures (or however many remain after the env loads) are reduced. Individual test repairs belong to a follow-up.
  - **Path B (delete):** If the project no longer ships DOM-dependent component tests (or has migrated them to the unit config with mocking), delete `vitest.local.config.ts`, remove any `test:local` script from `package.json`, and document the removal in `CLAUDE.md`.
  - **Path C (document):** If the config is intentionally a "for local UI dev" config that's known to be inconsistent (e.g., used only when manually running specific test files), document that in `CLAUDE.md`'s testing conventions section so future developers don't get confused. Keep the file as-is.

  The choice depends on the investigation. None of the three paths is correct a priori.

- [ ] **Step 3: Execute the chosen path**

  - Path A: Install/upgrade happy-dom; fix the setup file; re-run; confirm at minimum the env loads cleanly (`setup` time > 0).
  - Path B: `git rm vitest.local.config.ts`; remove related `package.json` scripts; add CLAUDE.md note.
  - Path C: Add CLAUDE.md note describing the config's intended use and current limitations.

- [ ] **Step 4: Quality gates**

  ```bash
  npm run test
  npx tsc --noEmit
  npm run lint
  ```

  All clean. The canonical test suite is unchanged regardless of which path you chose (it uses the unit config).

- [ ] **Step 5: Commit + push**

  Commit message depends on path:

  - Path A:
    ```
    fix: restore happy-dom environment in vitest.local.config.ts
    ```
  - Path B:
    ```
    chore: remove unused vitest.local.config.ts
    ```
  - Path C:
    ```
    docs: clarify vitest config status in CLAUDE.md
    ```

  Body explains the investigation findings and the rationale for the chosen path.

---

## Spec coverage check (self-review)

| Retrospective finding | Task |
|---|---|
| Latent false-positive risk in `prose.lowercaseFactionMidSentence` regex | Task 1 |
| Spec reviewer missed `narrativeBias` orphan in Phase 8 Task 4 | Task 2 |
| Plan-vs-reality drift caught reactively in Phase 8 Task 3 | Task 3 |
| Tone/gu-aware spine selection deferred from Phase 8 | Task 4 |
| Pre-existing test failures under `vitest.local.config.ts` | Task 5 |

**Estimated commits:** 4 (Tasks 1, 4, 5 each commit; Tasks 2 and 3 are out-of-repo skill edits with optional CLAUDE.md snippet capture).

**Estimated effort:** ~0.5 day total. Task 4 dominates (~3–4 hours for survey + brainstorm + plan write); Tasks 1, 2, 3, 5 are 30–60 minutes each.

---

## Risks & deferred items

- **Tasks 2 and 3 don't survive plugin reinstall.** The superpowers skill cache is regenerated on update. If the user reinstalls or upgrades the plugin, the local edits are lost. Mitigations: (a) PR the changes upstream to the superpowers repo, (b) capture the changes as snippets in `CLAUDE.md` so they can be re-applied, or (c) accept the loss and re-edit on each reinstall. The plan defaults to (b) as a backstop.

- **Task 4's plan-of-a-plan structure.** Task 4 produces a planning document, not a feature. A reader unfamiliar with the project might expect Task 4 to ship the feature itself. The plan is explicit that the implementation belongs to a future phase that executes against the new plan — but if the user wants the feature shipped, Task 4 should be expanded into a full implementation plan in its own right (likely 3–5x the effort estimated here).

- **Task 5's investigation-first structure.** Task 5 doesn't commit to a fix shape upfront — it picks a path based on what the investigation surfaces. This makes the task harder to estimate and harder to delegate to a fresh implementer (the implementer needs judgment, not just execution). If the user wants a more deterministic plan, the alternative is to pre-investigate (controller-side) and rewrite Task 5 with a single committed path.

- **Out-of-scope items captured here for visibility:**
  - Empty-story rate (6.77%) and tagHook rate (30.5%): documented as structural by Phase 7. Not action items.
  - Phase 0–6 plan documents reference deleted surfaces (`narrativeLines`, `narrativeThreads`, `NarrativeBias`): historical records, not rewritten.
  - `PlayableLayerPanel.tsx` is now mis-named (only hosts Human Remnants + System Phenomena): cosmetic; defensible name; not addressed.

---

## Outputs the next phase relies on

After this fix plan:
- The `prose.lowercaseFactionMidSentence` audit check guards against actual proper-noun-head regressions only — it won't false-positive on a legitimate future article-leading template.
- The subagent-driven-development workflow has explicit guards against the two failure modes Phase 8 surfaced (orphan-after-deletion misses; plan-vs-reality drift).
- A concrete plan exists for the most user-visible spine quality gap, ready for a future phase to execute.
- The `vitest.local.config.ts` situation has a clear status (fixed / removed / documented) so future developers don't trip over inconsistent test results.
