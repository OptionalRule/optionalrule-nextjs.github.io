import { describe, expect, it } from 'vitest'
import { selectTemperature } from '../temperature'
import type { SeededRng } from '../../rng'
import type { BuildGraphOptions, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }

function edge(partial: Partial<RelationshipEdge> & Pick<RelationshipEdge, 'id' | 'type' | 'subject' | 'object'>): RelationshipEdge {
  return {
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [],
    era: 'present',
    weight: 1,
    ...partial,
  }
}

function graph(entities: EntityRef[], edges: RelationshipEdge[]): SystemRelationshipGraph {
  const edgesByEntity: Record<string, string[]> = {}
  for (const e of edges) {
    for (const ref of [e.subject, e.object]) {
      edgesByEntity[ref.id] = edgesByEntity[ref.id] ?? []
      edgesByEntity[ref.id].push(e.id)
    }
  }
  const edgesByType = Object.fromEntries(EDGE_TYPES.map(t => [t, edges.filter(e => e.type === t).map(e => e.id)])) as SystemRelationshipGraph['edgesByType']
  return {
    entities, edges, edgesByEntity, edgesByType,
    spineEdgeIds: [], settlementSpineEdgeIds: [], historicalEdgeIds: [],
  }
}

function stubRng(values: readonly number[]): { rng: SeededRng; calls: () => number } {
  let i = 0
  const next = (): number => {
    const v = values[Math.min(i, values.length - 1)]
    i += 1
    return v
  }
  const rng: SeededRng = {
    seed: 'stub',
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: p => next() < p,
    fork: () => rng,
  }
  return { rng, calls: () => i }
}

const OPTIONS: BuildGraphOptions = { tone: 'balanced', gu: 'normal', distribution: 'frontier', settlements: 'normal' }

describe('selectTemperature', () => {
  it('never returns frozen when no reason exists, even when the draw lands last', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    const { rng } = stubRng([0.999])
    const result = selectTemperature(contested, g, OPTIONS, rng)
    expect(result.temperature).not.toBe('frozen')
    expect(result.frozenReason).toBeUndefined()
  })

  it('selects frozen with a suppression reason when a SUPPRESSES edge touches a principal', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const suppression = edge({ id: 'e2', type: 'SUPPRESSES', subject: factionA, object: settlement, visibility: 'hidden' })
    const g = graph([factionA, factionB, settlement], [contested, suppression])
    const { rng } = stubRng([0.999])
    const result = selectTemperature(contested, g, OPTIONS, rng)
    expect(result.temperature).toBe('frozen')
    expect(result.frozenReason).toBe('a suppressed record keeps both sides quiet')
  })

  it('uses the mutual-dependency reason when principals depend on each other', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const d1 = edge({ id: 'e2', type: 'DEPENDS_ON', subject: factionA, object: factionB })
    const d2 = edge({ id: 'e3', type: 'DEPENDS_ON', subject: factionB, object: factionA })
    const g = graph([factionA, factionB], [contested, d1, d2])
    const { rng } = stubRng([0.999])
    const result = selectTemperature(contested, g, OPTIONS, rng)
    expect(result.temperature).toBe('frozen')
    expect(result.frozenReason).toBe("each side holds the other's lifeline")
  })

  it('uses the Gardener reason under high or fracture GU when no closer reason exists', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    const { rng } = stubRng([0.999])
    const result = selectTemperature(contested, g, { ...OPTIONS, gu: 'fracture' }, rng)
    expect(result.temperature).toBe('frozen')
    expect(result.frozenReason).toBe('escalation here looks, from orbit, like someone building toward an ASI — and the Gardener watches')
  })

  it('boosts open for CONTESTS at a low draw', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    const { rng } = stubRng([0.45])
    const result = selectTemperature(contested, g, OPTIONS, rng)
    expect(result.temperature).toBe('open')
  })

  it('consumes exactly one rng draw', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    const { rng, calls } = stubRng([0.2])
    selectTemperature(contested, g, OPTIONS, rng)
    expect(calls()).toBe(1)
  })
})
