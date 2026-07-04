import { describe, expect, it } from 'vitest'
import { scoreCandidates, isNamedEntity, selectEdges, isSpineEligibleForGu } from '../score'
import type { EntityRef, RelationshipEdge } from '../types'
import { createSeededRng } from '../../rng'

const settlementRef: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
const bodyRef: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
const factionRef: EntityRef = { kind: 'namedFaction', id: 'faction-route-authority', displayName: 'Route Authority', layer: 'human' }
const guResourceRef: EntityRef = { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' }
const starRef: EntityRef = { kind: 'star', id: 'star-primary', displayName: 'G2V', layer: 'physical' }

function makeEdge(overrides: Partial<RelationshipEdge>): RelationshipEdge {
  return {
    id: overrides.id ?? 'edge-x',
    type: overrides.type ?? 'HOSTS',
    subject: overrides.subject ?? bodyRef,
    object: overrides.object ?? settlementRef,
    visibility: 'public',
    confidence: 'derived',
    groundingFactIds: [],
    era: 'present',
    weight: 0.5,
    ...overrides,
  }
}

describe('isNamedEntity', () => {
  it('returns true for settlements with proper-noun displayName', () => {
    expect(isNamedEntity(settlementRef)).toBe(true)
  })
  it('returns true for namedFactions', () => {
    expect(isNamedEntity(factionRef)).toBe(true)
  })
  it('returns true for bodies with proper-noun displayName', () => {
    expect(isNamedEntity(bodyRef)).toBe(true)
  })
  it('returns false for stars (spectral type, not a proper name)', () => {
    expect(isNamedEntity(starRef)).toBe(false)
  })
  it('returns false for guResource', () => {
    expect(isNamedEntity(guResourceRef)).toBe(false)
  })
})

describe('scoreCandidates', () => {
  it('applies the base weight when no bonuses fire', () => {
    const otherStar: EntityRef = { kind: 'star', id: 'star-secondary', displayName: 'M5V', layer: 'physical' }
    const e1 = makeEdge({ id: 'first', subject: starRef, object: otherStar, weight: 0.5 })
    const e2 = makeEdge({ id: 'second', subject: otherStar, object: starRef, weight: 0.4 })
    const scored = scoreCandidates([e1, e2])
    const second = scored.find(s => s.edge.id === 'second')
    expect(second).toBeDefined()
    expect(second!.bonuses.novelty).toBe(0)
    expect(second!.bonuses.crossLayer).toBe(0)
    expect(second!.bonuses.namedEntity).toBe(0)
    expect(second!.score).toBeCloseTo(0.48)
  })

  it('adds +0.1 for novelty when this is the first edge of its type', () => {
    const otherBody: EntityRef = { kind: 'body', id: 'b2', displayName: 'Vellix III', layer: 'physical' }
    const otherSettlement: EntityRef = { kind: 'settlement', id: 's2', displayName: 'Quiet Reach', layer: 'human' }
    const e1 = makeEdge({ id: 'e1', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.5 })
    const e2 = makeEdge({ id: 'e2', type: 'HOSTS', subject: otherBody, object: otherSettlement, weight: 0.5 })
    const [s1, s2] = scoreCandidates([e1, e2])
    const novel = s1.bonuses.novelty + s2.bonuses.novelty
    expect(novel).toBeCloseTo(0.1)
  })

  it('adds +0.15 cross-layer bonus when subject and object differ in layer', () => {
    const edge = makeEdge({ subject: bodyRef, object: settlementRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.crossLayer).toBeCloseTo(0.15)
  })

  it('does NOT add cross-layer bonus when subject and object share a layer', () => {
    const edge = makeEdge({ subject: settlementRef, object: factionRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.crossLayer).toBe(0)
  })

  it('adds +0.1 named-entity bonus when both subject and object are named', () => {
    const edge = makeEdge({ subject: settlementRef, object: factionRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.namedEntity).toBeCloseTo(0.1)
  })

  it('does NOT add named-entity bonus when only one side is named', () => {
    const edge = makeEdge({ subject: bodyRef, object: guResourceRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.namedEntity).toBe(0)
  })

  it('sorts by score descending; ties broken by stable hash of edge.id ascending', () => {
    const e1 = makeEdge({ id: 'aaa', weight: 0.5 })
    const e2 = makeEdge({ id: 'bbb', weight: 0.7 })
    const e3 = makeEdge({ id: 'ccc', weight: 0.5 })
    const scored = scoreCandidates([e1, e2, e3])
    expect(scored[0].edge.id).toBe('bbb')
  })

  it('collapses duplicate (subject, object, type) edges keeping the highest-scored', () => {
    const e1 = makeEdge({ id: 'low', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.3 })
    const e2 = makeEdge({ id: 'high', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.7 })
    const scored = scoreCandidates([e1, e2])
    expect(scored).toHaveLength(1)
    expect(scored[0].edge.id).toBe('high')
  })
})

describe('selectEdges (budget selection)', () => {
  function makeRefs(): { body: EntityRef; settlement: EntityRef; faction: EntityRef; otherFaction: EntityRef; resource: EntityRef; phenomenon: EntityRef } {
    return {
      body: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' },
      settlement: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      faction: { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' },
      otherFaction: { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' },
      resource: { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' },
      phenomenon: { kind: 'phenomenon', id: 'p1', displayName: 'flare-amplified bleed season', layer: 'gu' },
    }
  }

  it('selects 1-3 spine edges from CONTESTS/DESTABILIZES/DEPENDS_ON, named-on-named, multi-layer', () => {
    const r = makeRefs()
    const candidates: RelationshipEdge[] = [
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: r.faction, object: r.otherFaction, weight: 0.7 }),
      makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: r.settlement, object: r.body, weight: 0.6 }),
      makeEdge({ id: 'h1', type: 'HOSTS', subject: r.body, object: r.settlement, weight: 0.5 }),
    ]
    const result = selectEdges(scoreCandidates(candidates), {
      numSettlements: 1,
      numPhenomena: 1,
    })
    const spineTypes = result.spine.map(e => e.type)
    expect(spineTypes).toContain('CONTESTS')
    expect(spineTypes).toContain('DEPENDS_ON')
    expect(spineTypes).not.toContain('HOSTS')
    const layers = new Set(result.spine.flatMap(e => [e.subject.layer, e.object.layer]))
    expect(layers.size).toBeGreaterThanOrEqual(2)
  })

  it('caps spine at 3 even when more eligible candidates exist', () => {
    const r = makeRefs()
    const cands: RelationshipEdge[] = []
    for (let i = 0; i < 10; i++) {
      cands.push(makeEdge({
        id: `c${i}`,
        type: 'CONTESTS',
        subject: { ...r.faction, id: `f-a-${i}`, displayName: `Faction A${i}` },
        object: { ...r.otherFaction, id: `f-b-${i}`, displayName: `Faction B${i}` },
        weight: 0.7 - i * 0.01,
      }))
    }
    const result = selectEdges(scoreCandidates(cands), { numSettlements: 5, numPhenomena: 5 })
    expect(result.spine.length).toBeLessThanOrEqual(3)
  })

  it('peripheral set caps per type at 2', () => {
    const r = makeRefs()
    const cands: RelationshipEdge[] = []
    for (let i = 0; i < 6; i++) {
      cands.push(makeEdge({
        id: `h${i}`,
        type: 'HOSTS',
        subject: { ...r.body, id: `body-${i}`, displayName: `Body ${i}` },
        object: { ...r.settlement, id: `settlement-${i}`, displayName: `Settlement ${i}` },
        weight: 0.5 - i * 0.01,
      }))
    }
    const result = selectEdges(scoreCandidates(cands), { numSettlements: 5, numPhenomena: 5 })
    const hostsCount = result.peripheral.filter(e => e.type === 'HOSTS').length
    expect(hostsCount).toBeLessThanOrEqual(2)
  })

  it('total edges respect cap = 6 + min(6, num_settlements + num_phenomena), hard ceiling 12', () => {
    const r = makeRefs()
    const cands: RelationshipEdge[] = []
    for (let i = 0; i < 20; i++) {
      cands.push(makeEdge({
        id: `c${i}`,
        type: 'CONTESTS',
        subject: { ...r.faction, id: `f-a-${i}`, displayName: `Faction A${i}` },
        object: { ...r.otherFaction, id: `f-b-${i}`, displayName: `Faction B${i}` },
        weight: 0.7 - i * 0.001,
      }))
    }
    const result = selectEdges(scoreCandidates(cands), { numSettlements: 10, numPhenomena: 10 })
    expect(result.spine.length + result.peripheral.length).toBeLessThanOrEqual(12)
  })

  it('handles sparse systems (few candidates) without padding', () => {
    const r = makeRefs()
    const result = selectEdges(scoreCandidates([
      makeEdge({ id: 'h1', type: 'HOSTS', subject: r.body, object: r.settlement, weight: 0.5 }),
    ]), { numSettlements: 1, numPhenomena: 0 })
    expect(result.spine.length + result.peripheral.length).toBe(1)
  })

  it('returns spine ids in selection order', () => {
    const r = makeRefs()
    const result = selectEdges(scoreCandidates([
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: r.faction, object: r.otherFaction, weight: 0.8 }),
      makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: r.settlement, object: r.resource, weight: 0.6 }),
    ]), { numSettlements: 1, numPhenomena: 1 })
    expect(result.spineIds.length).toBe(result.spine.length)
    expect(result.spineIds).toEqual(result.spine.map(e => e.id))
  })
})

describe('selectEdges stochastic spine sampling', () => {
  function makeSpinePool(): RelationshipEdge[] {
    const factionA: EntityRef = { kind: 'namedFaction', id: 'fa', displayName: 'Kestrel Compact', layer: 'human' }
    const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane Guild', layer: 'human' }
    const factionC: EntityRef = { kind: 'namedFaction', id: 'fc', displayName: 'Helion Debt Synod', layer: 'human' }
    const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
    const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
    const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    return [
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: factionA, object: factionB, weight: 0.6 }),
      makeEdge({ id: 'c2', type: 'CONTESTS', subject: factionB, object: factionC, weight: 0.58 }),
      makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenomenon, object: factionA, weight: 0.58 }),
      makeEdge({ id: 'k1', type: 'CONTROLS', subject: factionC, object: settlement, weight: 0.56 }),
      makeEdge({ id: 'p2', type: 'DEPENDS_ON', subject: settlement, object: body, weight: 0.55 }),
    ]
  }

  it('varies the top spine edge type across rng seeds when eligible types score closely', () => {
    const scored = scoreCandidates(makeSpinePool())
    const topTypes = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const result = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 }, 'normal', undefined, createSeededRng(`spine-sample-${i}`))
      if (result.spine.length > 0) topTypes.add(result.spine[0].type)
    }
    expect(topTypes.size).toBeGreaterThanOrEqual(3)
  })

  it('is deterministic for the same rng seed', () => {
    const scored = scoreCandidates(makeSpinePool())
    const a = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 }, 'normal', undefined, createSeededRng('spine-det'))
    const b = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 }, 'normal', undefined, createSeededRng('spine-det'))
    expect(a.spineIds).toEqual(b.spineIds)
  })

  it('never samples a spine candidate scoring below the quality floor', () => {
    const factionA: EntityRef = { kind: 'namedFaction', id: 'fa', displayName: 'Kestrel Compact', layer: 'human' }
    const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane Guild', layer: 'human' }
    const strong = makeEdge({ id: 'strong', type: 'CONTESTS', subject: factionA, object: factionB, weight: 1.0 })
    const weak = makeEdge({ id: 'weak', type: 'CONTROLS', subject: factionA, object: factionB, weight: 0.1 })
    const scored = scoreCandidates([strong, weak])
    for (let i = 0; i < 30; i++) {
      const result = selectEdges(scored, { numSettlements: 1, numPhenomena: 1 }, 'normal', undefined, createSeededRng(`floor-${i}`))
      expect(result.spine[0]?.id).toBe('strong')
    }
  })

  it('mixes spine edge types within a single system when close alternatives exist', () => {
    const scored = scoreCandidates(makeSpinePool())
    let multiTypeSpines = 0
    let fullSpines = 0
    for (let i = 0; i < 30; i++) {
      const result = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 }, 'normal', undefined, createSeededRng(`mix-${i}`))
      if (result.spine.length < 3) continue
      fullSpines++
      if (new Set(result.spine.map(e => e.type)).size >= 2) multiTypeSpines++
    }
    expect(fullSpines).toBeGreaterThan(0)
    expect(multiTypeSpines / fullSpines).toBeGreaterThan(0.5)
  })

  it('respects the seed-faction spine cap under sampling', () => {
    const seedFaction: EntityRef = { kind: 'namedFaction', id: 'sf', displayName: 'Route Authority', layer: 'human' }
    const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane Guild', layer: 'human' }
    const factionC: EntityRef = { kind: 'namedFaction', id: 'fc', displayName: 'Helion Debt Synod', layer: 'human' }
    const scored = scoreCandidates([
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: seedFaction, object: factionB, weight: 0.6 }),
      makeEdge({ id: 'c2', type: 'CONTESTS', subject: seedFaction, object: factionC, weight: 0.59 }),
      makeEdge({ id: 'c3', type: 'CONTESTS', subject: factionB, object: factionC, weight: 0.58 }),
    ])
    const seedNames = new Set(['Route Authority'])
    for (let i = 0; i < 30; i++) {
      const result = selectEdges(scored, { numSettlements: 1, numPhenomena: 1 }, 'normal', seedNames, createSeededRng(`cap-${i}`))
      const seedTouched = result.spine.filter(e => e.subject.displayName === 'Route Authority' || e.object.displayName === 'Route Authority')
      expect(seedTouched.length).toBeLessThanOrEqual(1)
    }
  })

  it('lets a runner-up type top the spine on a meaningful share of seeds despite tone multipliers', () => {
    const factionA: EntityRef = { kind: 'namedFaction', id: 'fa', displayName: 'Kestrel Compact', layer: 'human' }
    const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane Guild', layer: 'human' }
    const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    const scored = scoreCandidates([
      makeEdge({ id: 'c1', type: 'CONTESTS', subject: factionA, object: factionB, weight: 0.6 }),
      makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenomenon, object: factionA, weight: 0.6 }),
    ], 'cinematic')
    let runnerUpTops = 0
    for (let i = 0; i < 60; i++) {
      const result = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 }, 'normal', undefined, createSeededRng(`runner-${i}`))
      if (result.spine[0]?.type === 'DESTABILIZES') runnerUpTops++
    }
    expect(runnerUpTops).toBeGreaterThanOrEqual(10)
    expect(runnerUpTops).toBeLessThanOrEqual(50)
  })

  it('falls back to deterministic greedy selection when rng is omitted', () => {
    const scored = scoreCandidates(makeSpinePool())
    const a = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 })
    const b = selectEdges(scored, { numSettlements: 2, numPhenomena: 2 })
    expect(a.spineIds).toEqual(b.spineIds)
    expect(a.spine[0].id).toBe(scored.filter(c => isSpineEligibleForGu(c.edge, 'normal'))[0].edge.id)
  })
})

describe('isNamedEntity post-Phase-A widening', () => {
  it('admits a phenomenon with proper-noun displayName', () => {
    const ref: EntityRef = {
      kind: 'phenomenon',
      id: 'p1',
      displayName: 'Bonn-Tycho aurora',
      layer: 'gu',
    }
    expect(isNamedEntity(ref)).toBe(true)
  })

  it('rejects a phenomenon with all-lowercase displayName', () => {
    const ref: EntityRef = {
      kind: 'phenomenon',
      id: 'p1',
      displayName: 'aurora bloom',
      layer: 'gu',
    }
    expect(isNamedEntity(ref)).toBe(false)
  })

  it('admits a guHazard with proper-noun displayName', () => {
    const ref: EntityRef = {
      kind: 'guHazard',
      id: 'g1',
      displayName: 'Kestrel Bleed Event',
      layer: 'gu',
    }
    expect(isNamedEntity(ref)).toBe(true)
  })

  it('still rejects guResource (intentionally not widened)', () => {
    const ref: EntityRef = {
      kind: 'guResource',
      id: 'gr1',
      displayName: 'Chiral Ice Belt',
      layer: 'gu',
    }
    expect(isNamedEntity(ref)).toBe(false)
  })
})

describe('toneMultiplier and per-tone scoring', () => {
  function makeNamedFaction(id: string, name: string): EntityRef {
    return { kind: 'namedFaction', id, displayName: name, layer: 'human' }
  }

  it('cinematic tone re-ranks CONTESTS above equally-weighted DESTABILIZES', () => {
    const factionA = makeNamedFaction('fa', 'Kestrel Compact')
    const factionB = makeNamedFaction('fb', 'Red Vane Guild')
    const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    const contestsEdge = makeEdge({ id: 'c1', type: 'CONTESTS', subject: factionA, object: factionB, weight: 1.0 })
    const destabilizesEdge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenomenon, object: factionA, weight: 1.0 })
    const cinematic = scoreCandidates([contestsEdge, destabilizesEdge], 'cinematic')
    expect(cinematic[0].edge.type).toBe('CONTESTS')
  })

  it('astronomy tone re-ranks DESTABILIZES above equally-weighted CONTESTS', () => {
    const factionA = makeNamedFaction('fa', 'Kestrel Compact')
    const factionB = makeNamedFaction('fb', 'Red Vane Guild')
    const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    const contestsEdge = makeEdge({ id: 'c1', type: 'CONTESTS', subject: factionA, object: factionB, weight: 1.0 })
    const destabilizesEdge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenomenon, object: factionA, weight: 1.0 })
    const astronomy = scoreCandidates([contestsEdge, destabilizesEdge], 'astronomy')
    expect(astronomy[0].edge.type).toBe('DESTABILIZES')
  })

  it('balanced tone produces unchanged scores (multiplier 1.0 across all types)', () => {
    const edge = makeEdge({ id: 'e1', type: 'CONTESTS', subject: bodyRef, object: settlementRef, weight: 0.7 })
    const balanced = scoreCandidates([edge], 'balanced')
    const unweighted = scoreCandidates([edge])
    expect(balanced[0].score).toBeCloseTo(unweighted[0].score)
  })
})

describe('isSpineEligibleForGu', () => {
  it('allows phenomenon-on-phenomenon DESTABILIZES at fracture', () => {
    const phenA: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    const phenB: EntityRef = { kind: 'phenomenon', id: 'p2', displayName: 'Kestrel Bleed', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenA, object: phenB })
    expect(isSpineEligibleForGu(edge, 'fracture')).toBe(true)
    expect(isSpineEligibleForGu(edge, 'normal')).toBe(true)
    expect(isSpineEligibleForGu(edge, 'high')).toBe(true)
    expect(isSpineEligibleForGu(edge, 'low')).toBe(true)
  })

  it('allows phenomenon-on-guHazard DESTABILIZES at fracture only when both lack proper-noun shape', () => {
    const phenA: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'lowercase aurora', layer: 'gu' }
    const haz: EntityRef = { kind: 'guHazard', id: 'h1', displayName: 'lowercase storm', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phenA, object: haz })
    expect(isSpineEligibleForGu(edge, 'fracture')).toBe(true)
    expect(isSpineEligibleForGu(edge, 'normal')).toBe(false)
  })

  it('admits DEPENDS_ON with a named settlement subject and a guResource object', () => {
    const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
    const resource: EntityRef = { kind: 'guResource', id: 'gr1', displayName: 'chiral ice belt', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: resource })
    for (const gu of ['low', 'normal', 'high', 'fracture'] as const) {
      expect(isSpineEligibleForGu(edge, gu)).toBe(true)
    }
  })

  it('rejects DEPENDS_ON when the subject is not a named entity', () => {
    const anonSettlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'drift camp', layer: 'human' }
    const resource: EntityRef = { kind: 'guResource', id: 'gr1', displayName: 'chiral ice belt', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: anonSettlement, object: resource })
    expect(isSpineEligibleForGu(edge, 'normal')).toBe(false)
  })

  it('rejects non-eligible types regardless of GU', () => {
    const factionA: EntityRef = { kind: 'namedFaction', id: 'fa', displayName: 'Kestrel', layer: 'human' }
    const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane', layer: 'human' }
    const edge = makeEdge({ id: 'w1', type: 'WITNESSES', subject: factionA, object: factionB })
    for (const gu of ['low', 'normal', 'high', 'fracture'] as const) {
      expect(isSpineEligibleForGu(edge, gu)).toBe(false)
    }
  })
})

describe('guScoreAdjustment via scoreCandidates', () => {
  it('low dampens DESTABILIZES weight', () => {
    const phen: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Bonn-Tycho aurora', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: phen, object: bodyRef, weight: 1.0 })
    const low = scoreCandidates([edge], 'astronomy', 'low')
    const normal = scoreCandidates([edge], 'astronomy', 'normal')
    expect(low[0].score).toBeLessThan(normal[0].score)
  })

  it('high boosts hazard-anchored DESTABILIZES', () => {
    const haz: EntityRef = { kind: 'guHazard', id: 'h1', displayName: 'Kestrel Bleed', layer: 'gu' }
    const edge = makeEdge({ id: 'd1', type: 'DESTABILIZES', subject: haz, object: settlementRef, weight: 1.0 })
    const high = scoreCandidates([edge], 'balanced', 'high')
    const normal = scoreCandidates([edge], 'balanced', 'normal')
    expect(high[0].score).toBeGreaterThan(normal[0].score)
  })

  it('normal gu pass-through is identical to default behavior', () => {
    const edge = makeEdge({ id: 'c1', type: 'CONTESTS', subject: bodyRef, object: settlementRef, weight: 0.7 })
    const normal = scoreCandidates([edge], 'balanced', 'normal')
    const defaulted = scoreCandidates([edge])
    expect(normal[0].score).toBeCloseTo(defaulted[0].score)
  })
})

describe('distributionMultiplier via scoreCandidates', () => {
  function makeNamedFaction(id: string, name: string): EntityRef {
    return { kind: 'namedFaction', id, displayName: name, layer: 'human' }
  }

  it('frontier boosts contested edges over public', () => {
    const factionA = makeNamedFaction('fa', 'Kestrel Compact')
    const factionB = makeNamedFaction('fb', 'Red Vane Guild')
    const contestedEdge = makeEdge({ id: 'cont', type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested', weight: 1.0 })
    const publicEdge = makeEdge({ id: 'pub', type: 'CONTROLS', subject: factionA, object: factionB, visibility: 'public', weight: 1.0 })
    const frontier = scoreCandidates([contestedEdge, publicEdge], 'balanced', 'normal', 'frontier')
    expect(frontier[0].edge.id).toBe('cont')
  })

  it('realistic boosts public edges over contested', () => {
    const factionA = makeNamedFaction('fa', 'Kestrel Compact')
    const factionB = makeNamedFaction('fb', 'Red Vane Guild')
    const contestedEdge = makeEdge({ id: 'cont', type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested', weight: 1.0 })
    const publicEdge = makeEdge({ id: 'pub', type: 'CONTROLS', subject: factionA, object: factionB, visibility: 'public', weight: 1.0 })
    const realistic = scoreCandidates([contestedEdge, publicEdge], 'balanced', 'normal', 'realistic')
    expect(realistic[0].edge.id).toBe('pub')
  })

  it('hidden visibility passes through both distributions', () => {
    const hiddenEdge = makeEdge({ id: 'h1', type: 'HIDES_FROM', visibility: 'hidden', weight: 1.0 })
    const realistic = scoreCandidates([hiddenEdge], 'balanced', 'normal', 'realistic')
    const frontier = scoreCandidates([hiddenEdge], 'balanced', 'normal', 'frontier')
    expect(realistic[0].score).toBeCloseTo(frontier[0].score, 5)
  })
})
