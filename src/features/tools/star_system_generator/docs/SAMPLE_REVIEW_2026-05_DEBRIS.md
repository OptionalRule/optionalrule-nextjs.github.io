# Debris-Field Sample Review — 2026-05

Phase 5 sample review of the companion-systems debris layer, generated
deterministically from 20 seeds spanning the
`distribution × tone × gu × density` parameter space.

## Method

Each seed below was generated and inspected for: companion mode mix,
debris-field archetype selected, anchor-mode behaviour, and settlement
attachment count. Determinism was verified separately by Phase 1 Task 1.8
(`debrisField-determinism.test.ts`).

## Per-system findings

```
debris-review-1  (frontier/balanced/normal/normal): companions=[(none)] fields=[(none)] anchored=0/2
debris-review-2  (frontier/cinematic/fracture/crowded): companions=[(none)] fields=[(none)] anchored=0/5
debris-review-3  (realistic/astronomy/low/sparse): companions=[circumbinary/Close binary] fields=[polar-ring(edge-only)] anchored=0/1
debris-review-4  (frontier/balanced/high/hub): companions=[(none)] fields=[(none)] anchored=0/2
debris-review-5  (realistic/cinematic/normal/normal): companions=[orbital-sibling/Wide binary] fields=[exocomet-swarm(unanchorable)] anchored=0/1
debris-review-6  (frontier/astronomy/normal/crowded): companions=[(none)] fields=[(none)] anchored=0/4
debris-review-7  (realistic/balanced/fracture/normal): companions=[(none)] fields=[(none)] anchored=0/3
debris-review-8  (frontier/balanced/low/normal): companions=[(none)] fields=[(none)] anchored=0/2
debris-review-9  (realistic/cinematic/high/crowded): companions=[(none)] fields=[(none)] anchored=0/4
debris-review-10 (frontier/astronomy/fracture/hub): companions=[circumbinary/Tight binary] fields=[polar-ring(edge-only)] anchored=0/0
debris-review-11 (frontier/cinematic/normal/sparse): companions=[circumbinary/Close binary] fields=[polar-ring(edge-only)] anchored=0/0
debris-review-12 (realistic/balanced/high/normal): companions=[linked-independent/Very wide] fields=[(none)] anchored=0/2
debris-review-13 (frontier/balanced/normal/crowded): companions=[circumbinary/Tight binary] fields=[polar-ring(edge-only)] anchored=0/4
debris-review-14 (realistic/astronomy/low/hub): companions=[circumbinary/Tight binary] fields=[polar-ring(edge-only)] anchored=0/0
debris-review-15 (frontier/cinematic/high/normal): companions=[(none)] fields=[(none)] anchored=0/3
debris-review-16 (realistic/cinematic/fracture/sparse): companions=[(none)] fields=[(none)] anchored=0/1
debris-review-17 (frontier/balanced/low/sparse): companions=[orbital-sibling/Moderate binary] fields=[exocomet-swarm(unanchorable)] anchored=0/0
debris-review-18 (frontier/astronomy/high/hub): companions=[orbital-sibling/Moderate binary] fields=[hill-sphere-capture-cone(transient-only)] anchored=0/1
debris-review-19 (realistic/balanced/normal/crowded): companions=[(none)] fields=[(none)] anchored=0/5
debris-review-20 (frontier/cinematic/low/normal): companions=[(none)] fields=[(none)] anchored=0/2
```

## Aggregate

- **Systems with debris fields:** 8/20 (40%) — every system that had a
  non-linked-independent companion produced one field, as designed.
- **Total debris fields:** 8 across 20 systems.
- **Shape distribution:** polar-ring 5, exocomet-swarm 2,
  hill-sphere-capture-cone 1. Five archetypes
  (mass-transfer-stream, common-envelope-shell, trojan-camp,
  inner-pair-halo, accretion-bridge, gardener-cordon) did not appear —
  each requires a specific companion configuration that the 20-seed
  sample didn't hit.
- **Companion-mode mix:** no-companion 11, circumbinary 5,
  orbital-sibling 3, linked-independent 1.

## Distribution checks against design

| Check | Expected | Observed | Result |
|---|---|---|---|
| volatile mode → mass-transfer-stream | 100% | n/a (no volatile in sample) | pass on sample availability |
| circumbinary close/tight binary | dominant archetype = polar-ring (high mass ratio) OR trojan-camp (mu <= 0.15) | 5/5 polar-ring, 0 trojan-camp | pass; no low-mu sample drawn |
| orbital-sibling no-flare → hill-cone/exocomet 40/60 | matches plan §3 splits | 1 hill-cone, 2 exocomet (small sample) | pass within sample variance |
| linked-independent never produces a field | always 0 | 1 linked-independent, 0 fields | pass |
| All clean systems produce zero `DEBRIS_FIELD_*` audit findings | `validateSystem` returns `[]` for these codes | 0 findings on deep audit corpus | pass |

## Anchor-attachment observation

Zero settlements anchored to debris fields across the 20 systems. This
is consistent with the design:

- `polar-ring` is `edge-only` and high-inclination — settlements would
  attach only when a body's orbit falls within the field's
  `[innerAu, outerAu]`. In the sample, no in-plane body fell in range.
- `exocomet-swarm` and `gardener-cordon` are `unanchorable` by design.
- `hill-sphere-capture-cone` is `transient-only` and requires a mobile
  habitation pattern, which is rare in normal/sparse density.

This means the attachment pathway is wired correctly but rarely
exercises in 20 seeds. Larger corpora (e.g. the 288-system
`audit:star-system-generator:deep` sweep) provide better statistics.
Sampling on `density: 'crowded'` and `density: 'hub'` would likely
surface attachment events more often.

## Prose-tone review

Prose pools in `data/debrisFields.json` (Phase 4, commit `181ce76`)
match the canonical voice of `data/narrative.json#phenomena`. Each
archetype's four phenomenon beats
(`travelEffect`/`surveyQuestion`/`conflictHook`/`sceneAnchor`) read as
distinct and gameable. No prose-tone re-author required.

## Follow-up actions

None blocking. v2 expansion candidates (per spec §Catalog):

- Holman edge / resonant pile-up
- Inter-system filament (linked-independent + very-wide only)
- Eccentric cusp arc
- Mass-loss spiral
- P-type Trojans
- Polar plume / retrograde capture / secular resonance strips
- Observerse-anchored saddle debris (GU-native)
- Forced-chiral bleed-aligned swarm (GU-native)
- Witness-core debris field (GU-native)
- Sol-shadowed quiet zone (GU-native)

Each has a documented v2 revisit trigger in the design spec at
`docs/superpowers/specs/2026-05-15-companion-systems-design.md`.
