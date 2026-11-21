# Worth-exploring items (#4, #5, #9) and the substring fix

Explorer facts as of `develop` on 2026-11-21, after the six Strong items landed. The original review HTML in /tmp was gone by then.

## #4 Hook variety (star_system_generator `lib/generator/hooks.ts`)
- 358 lines that do three jobs: slot binding, term detection (`deriveActiveTerms`), and selection (`pickHooks`/`selectSystemHooks`). The pools come from `data/hooks.json`, generated from `docs/background/GU_HOOKS.md` (78/49/49/57/48 entries).
- Counts and bias are hardcoded. `deriveActiveTerms` always seeds `GU`+`Bleed`, so selection always tilts toward those tags, and the same hooks repeat across systems. The settlement Tag Hook has only 4 templates.
- ADR-0001: changing pools, order, counts, bias or fork labels changes hooks for every seed. The ADR's own suggestion is additive or tone-gated change.

## #5 Seed URL
- Encoding is in `lib/seedUrl.ts`; decoding is in `hooks/useGeneratorQueryState.ts`, with four hand-written parsers that repeat the union types in `types.ts`. Adding an option touches about 5 places. Five other places build seed URLs.
- The URL carries no generator version. `GENERATOR_VERSION = 2` is only stamped into the output, so old versions can't be reproduced.
- Shared links break if the generation logic changes, an `OPTION_DEFAULTS` value changes, an option value is renamed, or `normalizeSeed` is tightened.

## #9 Draft rule
- The draft rule is decided in 4 places: `content.ts` `isPostDraft`/`isPageDraft` (only tests use them); `getPostFiles`/`getPageFiles`, which filter only under `NODE_ENV==='production'` and handle read errors differently for posts and pages; `scripts/generate-search-index.ts`, which has its own copy; and `scripts/enhance-post.mjs`.
- **Confirmed bug:** `generate-rss` runs in `npm run build` without `NODE_ENV`, so the committed `public/rss.xml` and `public/sitemap.xml` include the 2 `draft: true` posts. There are also two sources for the sitemap.

## Substring fix in `classifyNarrativeDomains`
- Measured by running the 200 golden cases through a scratch loader hook, with no repo edits. Word-boundary matching for ai/sol/old changes 185 of the 200 hashes, so it amounts to a full regeneration. It needs a `GENERATOR_VERSION` bump, a fixture update and an ADR.
- Same kind of trap: ore, ark, gate, ration, war, lab, law, cult, chart, mine.

See [decision-log](decision-log.md), [star-system-narrative-stage](star-system-narrative-stage.md).

## 2026-11-21 progress
- #9 / Q26: `bda8f33`, `5806cea`. `src/lib/publication.ts` holds the `isPublished` rule; drafts appear only with `INCLUDE_DRAFTS=true`, which `npm run dev` sets. The sitemap is served only by `src/app/sitemap.xml/route.ts`, and `public/sitemap.xml` is deleted. A post with invalid frontmatter now fails the build.
- Q27: `5806cea` (CI green) was merged to `main` as `46126b9`. Deploy run 44960540343 succeeded. Checked live: rss.xml and sitemap.xml return 200 with 0 draft mentions.
- #5 / Q28: `d96b008`..`22c5b44`. `lib/seedUrl.ts` has `decodeSeedLink`/`buildSeedLink`/`seedLinkFrom`/`sameGenerationOptions`; the `v` param is defined in ADR-0002. A link without `v` decodes as v2, and an unknown `v` falls back to current. Links are now relative. **Requirement for Q29:** `generateSystem` must stamp the version it actually ran, not the constant.
- #4 step one (Q30): `9c6bd45`, `d0e1519`. `lib/generator/hooks/` now holds `binding.ts`, `terms.ts` (`detectHookTerms`), `profile.ts` (`HookSelectionProfile`, frozen `HOOK_SELECTION_PROFILE_V2`) and `selection.ts`. Output is unchanged. Findings that matter for the variety grilling: GU/Bleed baseline-active seeding is intentional (`1df444f`); because of it, the no-active-terms branch and the Bleed regexes never take effect under v2; rumors prefer the base active terms, not the resonant ones; only contracts and NPCs feed resonance.
- Q29: `9db3d50`..`2dc9275`. `lib/generator/rules.ts` maps each version to its `GeneratorRules`. `generateSystem(options, {generatorVersion})` stamps the version it ran. v3 uses whole-word classification (with plurals and explicit legitimate forms). v2 is byte-identical. 190 of 200 golden cases differ under v3; the audit shows 722 errors for both versions. Recorded in ADR-0003.
- **Release hold (chief-of-staff, 2026-11-21):** do not merge `develop`→`main` until the Q32–Q36 hook-variety decisions are resolved. If v3 shipped first, changing hooks later would alter v3 links that had already been shared, and that would force a v4.
- Q32–Q34: `4124bf1` adds `HOOK_SELECTION_PROFILE_V3`. GU is active above the "Geometrically quiet" band (186 of 200 golden systems); Bleed is active through its own regexes (176 of 200). 86 of 200 v3 hashes changed. **The measured variety gain is small:** GU/Bleed-tagged picks went from 39.0% to 36.5%, and effective entries from 238.8 to 241.5. Almost every system really does have GU. Real variety would need more pool entries or tone gating. Audit still 722.
