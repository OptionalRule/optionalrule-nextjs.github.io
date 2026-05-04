import { describe, expect, it } from 'vitest'
import { attachHistoricalEvents } from '../history'
import type { EdgeType, EntityRef, RelationshipEdge } from '../types'
import { createSeededRng } from '../../rng'
import { stableHashString } from '../rules'
import { foundedByTemplates } from '../render/templates/foundedByTemplates'

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
const settlementA: EntityRef = {
  kind: 'settlement',
  id: 's1',
  displayName: 'Orison Hold',
  layer: 'human',
}
const settlementB: EntityRef = {
  kind: 'settlement',
  id: 's2',
  displayName: 'Cinder March',
  layer: 'human',
}

interface EdgeOverrides {
  id: string
  type: EdgeType
  subject?: EntityRef
  object?: EntityRef
}

function makeEdge(overrides: EdgeOverrides): RelationshipEdge {
  return {
    id: overrides.id,
    type: overrides.type,
    subject: overrides.subject ?? faction1,
    object: overrides.object ?? settlementA,
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: ['fact1'],
    era: 'present',
    weight: 0.6,
  }
}

describe('historical body variant rotation (Phase 7 Task 4)', () => {
  it('selects the body variant by stableHashString(presentEdge.id) % body.length', () => {
    const rng = createSeededRng('rotation-hash-check')
    const present = makeEdge({
      id: 'rot-a',
      type: 'CONTROLS',
      subject: faction1,
      object: settlementA,
    })
    const result = attachHistoricalEvents({ spineEdges: [present], rng })
    expect(result.historicalEdges).toHaveLength(1)
    const summary = result.historicalEdges[0].summary ?? ''
    const expectedIndex = stableHashString('rot-a') % foundedByTemplates.body.length
    const expectedVariant = foundedByTemplates.body[expectedIndex]
    const variantSignatures: Record<number, string> = {
      0: 'founded',
      1: 'traces its origin to',
      2: 'chartered',
    }
    expect(summary).toContain(variantSignatures[expectedIndex])
    expect(expectedVariant.text).not.toBe('')
  })

  it('picks different body variants across spine edges with different ids', () => {
    const rng = createSeededRng('rotation-distribution')
    // rot-a -> hash%3 = 2 ("chartered"), rot-b -> 1 ("traces its origin"), rot-c -> 0 ("founded")
    const spine = [
      makeEdge({ id: 'rot-a', type: 'CONTROLS', subject: faction1, object: settlementA }),
      makeEdge({ id: 'rot-b', type: 'CONTROLS', subject: faction2, object: settlementA }),
      makeEdge({ id: 'rot-c', type: 'CONTROLS', subject: faction1, object: settlementB }),
    ]
    const result = attachHistoricalEvents({ spineEdges: spine, rng })
    // attachHistoricalEvents caps at MAX_HISTORICAL_EDGES = 2.
    expect(result.historicalEdges).toHaveLength(2)
    const summaries = result.historicalEdges.map((e) => e.summary ?? '')
    // Both summaries must be non-empty and distinct (rotation produced different variants).
    expect(summaries[0]).not.toBe('')
    expect(summaries[1]).not.toBe('')
    expect(summaries[0]).not.toBe(summaries[1])
  })

  it('is deterministic — same inputs produce same variant choice', () => {
    const present = makeEdge({
      id: 'rot-a',
      type: 'CONTROLS',
      subject: faction1,
      object: settlementA,
    })
    const a = attachHistoricalEvents({
      spineEdges: [present],
      rng: createSeededRng('rotation-determinism'),
    })
    const b = attachHistoricalEvents({
      spineEdges: [present],
      rng: createSeededRng('rotation-determinism'),
    })
    expect(a.historicalEdges).toHaveLength(1)
    expect(b.historicalEdges).toHaveLength(1)
    expect(a.historicalEdges[0].summary).toBe(b.historicalEdges[0].summary)
  })

  it('different present-edge ids with identical endpoints can yield different variants', () => {
    // Same subject/object, different ids -> hash differs -> different variant.
    const presentA = makeEdge({
      id: 'rot-a',
      type: 'CONTROLS',
      subject: faction1,
      object: settlementA,
    })
    const presentC = makeEdge({
      id: 'rot-c',
      type: 'CONTROLS',
      subject: faction1,
      object: settlementA,
    })
    const resultA = attachHistoricalEvents({
      spineEdges: [presentA],
      rng: createSeededRng('rotation-id-sensitivity'),
    })
    const resultC = attachHistoricalEvents({
      spineEdges: [presentC],
      rng: createSeededRng('rotation-id-sensitivity'),
    })
    expect(resultA.historicalEdges[0].summary).not.toBe(resultC.historicalEdges[0].summary)
  })
})
