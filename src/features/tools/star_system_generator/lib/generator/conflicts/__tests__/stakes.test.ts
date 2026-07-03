import { describe, expect, it } from 'vitest'
import { resolveStakeRef } from '../stakes'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const resource: EntityRef = { kind: 'guResource', id: 'gu-res-1', displayName: 'Chiral ice belt', layer: 'gu' }
const phenomenon: EntityRef = { kind: 'phenomenon', id: 'phen-1', displayName: 'Moving bleed-node river', layer: 'gu' }

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
    entities,
    edges,
    edgesByEntity,
    edgesByType,
    spineEdgeIds: [],
    settlementSpineEdgeIds: [],
    historicalEdgeIds: [],
  }
}

describe('resolveStakeRef', () => {
  it('returns the entity whose displayName matches the edge qualifier', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB, qualifier: 'chiral ice belt' })
    const g = graph([factionA, factionB, resource, phenomenon], [contested])
    expect(resolveStakeRef(contested, g)).toEqual(resource)
  })

  it('falls back to a DEPENDS_ON neighbor of a principal', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const dependency = edge({ id: 'e2', type: 'DEPENDS_ON', subject: factionA, object: resource })
    const g = graph([factionA, factionB, settlement, resource], [contested, dependency])
    expect(resolveStakeRef(contested, g)).toEqual(resource)
  })

  it('falls back to a CONTROLS neighbor, returning the non-principal endpoint', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const control = edge({ id: 'e2', type: 'CONTROLS', subject: factionB, object: settlement })
    const g = graph([factionA, factionB, settlement], [contested, control])
    expect(resolveStakeRef(contested, g)).toEqual(settlement)
  })

  it('skips neighbor endpoints whose kind cannot be a stake', () => {
    const star: EntityRef = { kind: 'star', id: 'star-1', displayName: 'Primary', layer: 'physical' }
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const dependency = edge({ id: 'e2', type: 'DEPENDS_ON', subject: factionA, object: star })
    const g = graph([factionA, factionB, star, phenomenon], [contested, dependency])
    expect(resolveStakeRef(contested, g)).toEqual(phenomenon)
  })

  it('falls back to the first phenomenon or guResource in the inventory', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB, phenomenon], [contested])
    expect(resolveStakeRef(contested, g)).toEqual(phenomenon)
  })

  it('returns null when nothing groundable exists', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    expect(resolveStakeRef(contested, g)).toBeNull()
  })

  it('never fabricates an abstract stake from the qualifier when it matches no entity', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB, qualifier: 'trade ledger' })
    const g = graph([factionA, factionB], [contested])
    expect(resolveStakeRef(contested, g)).toBeNull()
  })
})
