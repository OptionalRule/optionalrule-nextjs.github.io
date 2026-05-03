import { describe, expect, it } from 'vitest'
import { attachHistoricalEvents } from '../history'
import type { EdgeType, EntityRef, RelationshipEdge } from '../types'
import { createSeededRng } from '../../rng'
import { ERAS } from '../data/eras'

const faction1: EntityRef = {
  kind: 'namedFaction',
  id: 'f1',
  displayName: 'Helion Debt Synod',
  layer: 'human',
}
const faction2: EntityRef = {
  kind: 'namedFaction',
  id: 'f2',
  displayName: 'Route Authority',
  layer: 'human',
}
const settlement: EntityRef = {
  kind: 'settlement',
  id: 's1',
  displayName: 'Orison Hold',
  layer: 'human',
}
const guResource: EntityRef = {
  kind: 'guResource',
  id: 'gu1',
  displayName: 'chiral ice belt',
  layer: 'gu',
}
const phenomenon: EntityRef = {
  kind: 'phenomenon',
  id: 'p1',
  displayName: 'flare-amplified bleed season',
  layer: 'physical',
}
const ruin: EntityRef = {
  kind: 'ruin',
  id: 'r1',
  displayName: 'the Vance Reliquary',
  layer: 'gu',
}

interface EdgeOverrides {
  id: string
  type: EdgeType
  subject?: EntityRef
  object?: EntityRef
  visibility?: RelationshipEdge['visibility']
  groundingFactIds?: string[]
  weight?: number
}

function makeEdge(overrides: EdgeOverrides): RelationshipEdge {
  return {
    id: overrides.id,
    type: overrides.type,
    subject: overrides.subject ?? faction1,
    object: overrides.object ?? settlement,
    visibility: overrides.visibility ?? 'public',
    confidence: 'inferred',
    groundingFactIds: overrides.groundingFactIds ?? ['fact1'],
    era: 'present',
    weight: overrides.weight ?? 0.6,
  }
}

describe('attachHistoricalEvents', () => {
  it('returns no historical edges when the spine is empty', () => {
    const rng = createSeededRng('history-test-empty')
    const result = attachHistoricalEvents({ spineEdges: [], rng })
    expect(result.historicalEdges).toEqual([])
  })

  it('returns no historical edges for a HOSTS-only spine (score 0)', () => {
    const rng = createSeededRng('history-test-hosts')
    const spine = [makeEdge({
      id: 'present-hosts',
      type: 'HOSTS',
      subject: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-a', layer: 'physical' },
      object: settlement,
    })]
    const result = attachHistoricalEvents({ spineEdges: spine, rng })
    expect(result.historicalEdges).toEqual([])
  })

  it('produces 1 FOUNDED_BY historical edge from a CONTROLS spine edge', () => {
    const rng = createSeededRng('history-test-controls')
    const present = makeEdge({
      id: 'present-controls',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    const hist = result.historicalEdges[0]
    expect(hist.type).toBe('FOUNDED_BY')
    expect(hist.era).toBe('historical')
    expect(hist.consequenceEdgeIds).toEqual([present.id])
    expect(ERAS).toContain(hist.approxEra)
    expect(hist.summary).toBeDefined()
    expect(hist.summary?.length ?? 0).toBeGreaterThan(0)
  })

  it('maps a CONTESTS spine edge to a BETRAYED historical edge', () => {
    const rng = createSeededRng('history-test-contests')
    const present = makeEdge({
      id: 'present-contests',
      type: 'CONTESTS',
      subject: faction1,
      object: faction2,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    expect(result.historicalEdges[0].type).toBe('BETRAYED')
  })

  it('maps a DEPENDS_ON spine edge to a DISPLACED historical edge', () => {
    const rng = createSeededRng('history-test-dependson')
    const present = makeEdge({
      id: 'present-dependson',
      type: 'DEPENDS_ON',
      subject: settlement,
      object: guResource,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    expect(result.historicalEdges[0].type).toBe('DISPLACED')
    expect(result.historicalEdges[0].subject.id).toBe(settlement.id)
    expect(result.historicalEdges[0].object.id).toBe(guResource.id)
  })

  it.each<{ presentType: EdgeType; expected: EdgeType }>([
    { presentType: 'DESTABILIZES', expected: 'FOUNDED_BY' },
    { presentType: 'SUPPRESSES', expected: 'BETRAYED' },
    { presentType: 'CONTRADICTS', expected: 'BETRAYED' },
  ])('maps $presentType to $expected', ({ presentType, expected }) => {
    const rng = createSeededRng(`history-test-map-${presentType}`)
    const subject = presentType === 'DESTABILIZES' ? phenomenon : faction1
    const object = presentType === 'CONTRADICTS' ? ruin : settlement
    const present = makeEdge({
      id: `present-${presentType}`,
      type: presentType,
      subject,
      object,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    expect(result.historicalEdges[0].type).toBe(expected)
  })

  it('caps historical edges at 2 even when 3+ spine edges are eligible', () => {
    const rng = createSeededRng('history-test-cap')
    const spine = [
      makeEdge({ id: 'present-controls-a', type: 'CONTROLS', subject: faction1, object: settlement }),
      makeEdge({ id: 'present-controls-b', type: 'CONTROLS', subject: faction2, object: settlement }),
      makeEdge({ id: 'present-controls-c', type: 'CONTROLS', subject: faction1, object: { ...settlement, id: 's2', displayName: 'Cinder March' } }),
    ]
    const result = attachHistoricalEvents({ spineEdges: spine, rng })
    expect(result.historicalEdges).toHaveLength(2)
  })

  it('produces deterministic output for the same seed', () => {
    const present = makeEdge({
      id: 'present-controls-det',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
    })
    const a = attachHistoricalEvents({
      spineEdges: [present],
      rng: createSeededRng('history-test-determinism'),
    })
    const b = attachHistoricalEvents({
      spineEdges: [present],
      rng: createSeededRng('history-test-determinism'),
    })
    expect(a).toEqual(b)
    expect(a.historicalEdges[0].id).toBe(b.historicalEdges[0].id)
    expect(a.historicalEdges[0].approxEra).toBe(b.historicalEdges[0].approxEra)
    expect(a.historicalEdges[0].summary).toBe(b.historicalEdges[0].summary)
  })

  it('selects different eras across distinct seeds (sanity check)', () => {
    const present = makeEdge({
      id: 'present-controls-eras',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
    })
    const seeds = ['era-seed-a', 'era-seed-b', 'era-seed-c', 'era-seed-d', 'era-seed-e', 'era-seed-f']
    const eras = new Set<string | undefined>()
    for (const seed of seeds) {
      const result = attachHistoricalEvents({
        spineEdges: [present],
        rng: createSeededRng(seed),
      })
      eras.add(result.historicalEdges[0]?.approxEra)
    }
    expect(eras.size).toBeGreaterThanOrEqual(2)
  })

  it('orders by score: high first, medium second, zero skipped', () => {
    const rng = createSeededRng('history-test-sort')
    const controlsEdge = makeEdge({
      id: 'present-controls-sort',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
    })
    const destabilizesEdge = makeEdge({
      id: 'present-destabilizes-sort',
      type: 'DESTABILIZES',
      subject: phenomenon,
      object: settlement,
    })
    const hostsEdge = makeEdge({
      id: 'present-hosts-sort',
      type: 'HOSTS',
      subject: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-a', layer: 'physical' },
      object: settlement,
    })
    const result = attachHistoricalEvents({
      spineEdges: [destabilizesEdge, hostsEdge, controlsEdge],
      rng,
    })
    expect(result.historicalEdges).toHaveLength(2)
    expect(result.historicalEdges[0].consequenceEdgeIds).toEqual([controlsEdge.id])
    expect(result.historicalEdges[0].type).toBe('FOUNDED_BY')
    expect(result.historicalEdges[1].consequenceEdgeIds).toEqual([destabilizesEdge.id])
    expect(result.historicalEdges[1].type).toBe('FOUNDED_BY')
  })

  it('sets historical edge weight to present.weight * 0.7', () => {
    const rng = createSeededRng('history-test-weight')
    const present = makeEdge({
      id: 'present-controls-w',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
      weight: 0.8,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    expect(result.historicalEdges[0].weight).toBeCloseTo(0.8 * 0.7, 10)
  })

  it('propagates groundingFactIds from the present edge', () => {
    const rng = createSeededRng('history-test-grounding')
    const present = makeEdge({
      id: 'present-controls-g',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
      groundingFactIds: ['fact-A', 'fact-B'],
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    expect(result.historicalEdges[0].groundingFactIds).toEqual(['fact-A', 'fact-B'])
    expect(result.historicalEdges[0].groundingFactIds).not.toBe(present.groundingFactIds)
  })

  it('renders a summary that is fully resolved prose with terminal punctuation', () => {
    const rng = createSeededRng('history-test-summary')
    const present = makeEdge({
      id: 'present-controls-s',
      type: 'CONTROLS',
      subject: faction1,
      object: settlement,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    const summary = result.historicalEdges[0].summary ?? ''
    expect(summary).not.toContain('{')
    expect(summary).not.toContain('}')
    expect(summary.length).toBeGreaterThan(0)
    expect(/[.!?]$/.test(summary)).toBe(true)
    expect(summary[0]).toBe(summary[0].toUpperCase())
  })
})
