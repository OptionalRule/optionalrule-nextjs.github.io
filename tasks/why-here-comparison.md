# Why Here — Legacy vs Graph-Aware Comparison

**Status:** Hand-traced from source logic. The samples below are *simulated* — they walk
the producer logic for representative settlement profiles. Real seeded output should be
captured before deletion lands (see Phase 0 audit gate in `plan-why-here.md`).

**Critical context:** `graphAwareSettlementWhyHere` does **not run in production today**.
`graphAwareReshape` is gated by `options.graphAware.*` flags; no production caller sets
those flags (only tests). So today's Why Here output is 100% the legacy producer.

Anchor name `Orison Hold` used throughout for legibility.

## Scenario A — High-resource site with HOSTS edge

Presence: resource=3, access=2, others 0. Graph: HOSTS (`Nosaxa IV-b` hosts settlement).

| Producer | Output |
|---|---|
| Legacy | `The case for Orison Hold is practical: resources are strong here, especially chiral ore extraction; access is manageable for prepared crews.` |
| Graph-aware | `Orison Hold sits on Nosaxa IV-b.` |

**Eval:** Graph-aware names the body. Legacy explains *why* resources/access matter.
Graph-aware drops resource strength + access qualification.

## Scenario B — High-hazard frontier with DEPENDS_ON edge

Presence: resource=2, access=1, guValue=2, hazard=3. Graph: DEPENDS_ON (`chiral ice belt`).

| Producer | Output |
|---|---|
| Legacy | `Orison Hold survives because local materials, volatiles, or fuel justify permanent infrastructure; GU value is high enough to justify danger and secrecy; hazards are severe, so the site exists because the payoff is worth the risk.` |
| Graph-aware | `Orison Hold survives by depending on chiral ice belt.` |

**Eval:** Graph-aware names the GU resource concretely. Legacy surfaces hazard severity
and economic justification that graph-aware drops entirely.

## Scenario C — High strategic, both HOSTS + DEPENDS_ON

Presence: access=3, strategic=3, legalHeat=2. Graph: HOSTS (`Vetharn III`) + DEPENDS_ON (`Kestrel Compact` faction).

| Producer | Output |
|---|---|
| Legacy | `Crews keep choosing Orison Hold because iggygate access keeps traffic viable; the site controls a militarily or commercially important approach; legal or interdiction pressure explains the secrecy and tension.` |
| Graph-aware | `Orison Hold sits on Vetharn III and depends on Kestrel Compact.` |

**Eval:** Graph-aware names both entities concretely but reads as structural fact, not
stakes-driven explanation. Legacy foregrounds three distinct content categories
(strategic role, access class, legal heat) graph-aware doesn't touch.

## Scenario D — Abandoned automated, no relevant graph edges

Presence: hazard=1, others minimal. Graph: empty (no HOSTS or DEPENDS_ON).

| Producer | Output |
|---|---|
| Legacy | `Orison Hold: hazards shape operations but do not prevent occupation.` |
| Graph-aware | *null (returns null — no usable edges)* |

**Eval:** Graph-aware produces nothing for thin-graph settlements. **Estimated ~40% of
generated settlements** lack the relevant edge types based on edge assignment logic in
`graphAwareReshape.ts`. Hard gap.

## Scenario E — High habitability, high GU, no graph edges

Presence: resource=2, access=2, strategic=2, guValue=3, habitability=2. Graph: empty.

| Producer | Output |
|---|---|
| Legacy | `At Orison Hold, the settlement logic is local materials, volatiles, or fuel justify permanent infrastructure; access is manageable for prepared crews; the site watches a useful route or resource.` |
| Graph-aware | *null* |

**Eval:** Habitability and strong GU value (two of legacy's most interesting categories)
never appear in graph-aware because they have no edge-type mapping.

## Scenario F — Strong graph, high legal heat, low resource

Presence: legalHeat=3, others 1. Graph: HOSTS (`Drasek Belt`) + DEPENDS_ON (`bleed corridor` GU).

| Producer | Output |
|---|---|
| Legacy | `Orison Hold: legal or interdiction pressure explains the secrecy and tension.` |
| Graph-aware | `Orison Hold sits on Drasek Belt and depends on bleed corridor.` |

**Eval:** Graph-aware's best case — names two concrete entities. Still loses the
political/legal register entirely; reads logistical rather than charged.

## Verdict

**Graph-aware does NOT stand on its own yet.** Gap is structural, not polish.

### Lost categories with no recovery path from current Phase A-D axes

- **Hazard severity framing** (`"the payoff is worth the risk"`) — needs a new
  `ENDANGERS` / `HAZARD_JUSTIFIES` edge type; tone/voice axes can't recover this.
- **Habitability bonus framing** — needs a `SHELTERS` / `SUPPORTS_HABITABILITY` edge;
  no existing edge models this.
- **Null returns for thin-graph settlements** (~40% of topologies) — graph-aware is
  silent where legacy always produced something.

### Lost categories recoverable via Phase A-D axes

- **Strategic / legal register** (`"controls an important approach"`,
  `"legal pressure explains the secrecy"`) — map naturally to tone (threat / political)
  and voice (institutional vs. frontier); a tone-aware variant could infer stakes
  from `CONTROLS` or `SUPPRESSES` edge types already present.
- **Access class naming** (`reachability.className.value`) — recoverable if the
  enriched producer receives reachability/era/faction context.

### What graph-aware gains that legacy can never match

- **Concrete entity names** (planet names, GU phenomena, factions) instead of
  category abstractions like `"local materials, volatiles, or fuel"`.
- **Structural relationships** are unambiguous in a way the legacy bank can't be.

### Recommendation before deleting legacy

Two gaps must close first:
1. **Non-null fallback** for empty-graph settlements — short structural sentence
   built from `anchorName` + body data + presence scores (analogous to legacy line 78).
2. **Hazard-severity clause** injectable from `presence.hazard` since no edge type
   models it.

Deleting legacy before those close will silently degrade output for all
thin-graph settlements and all high-hazard scenarios.

## Files Referenced

- `src/features/tools/star_system_generator/lib/generator/prose/settlementProse.ts:49-87` — legacy producer
- `src/features/tools/star_system_generator/lib/generator/prose/graphAwareSettlementWhyHere.ts` — graph-aware
- `src/features/tools/star_system_generator/lib/generator/prose/graphAwareReshape.ts:25-43` — flag gating (production never sets flags)
- `src/features/tools/star_system_generator/lib/generator/index.ts:2514` — legacy call site
- `src/features/tools/star_system_generator/lib/generator/index.ts:3168` — graphAwareReshape call site (gated)
