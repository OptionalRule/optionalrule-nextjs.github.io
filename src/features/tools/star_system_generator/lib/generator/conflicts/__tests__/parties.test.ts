import { describe, expect, it } from 'vitest'
import { buildParties } from '../parties'
import { createSeededRng } from '../../rng'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../graph/types'
import { EDGE_TYPES } from '../../graph/types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const factionC: EntityRef = { kind: 'namedFaction', id: 'fac-c', displayName: 'Glasshouse Biosafety Compact', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const resource: EntityRef = { kind: 'guResource', id: 'gu-res-1', displayName: 'Chiral ice belt', layer: 'gu' }
const star: EntityRef = { kind: 'star', id: 'star-1', displayName: 'Primary', layer: 'physical' }

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

describe('buildParties', () => {
  it('assigns subject as aggressor and object as defender for CONTESTS', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const g = graph([factionA, factionB], [contested])
    const parties = buildParties(contested, g, createSeededRng('p'))
    expect(parties).toHaveLength(2)
    expect(parties[0]).toMatchObject({ ref: factionA, role: 'aggressor' })
    expect(parties[1]).toMatchObject({ ref: factionB, role: 'defender' })
    for (const p of parties) expect(p.stake.length).toBeGreaterThan(0)
  })

  it('inverts roles for DEPENDS_ON so the depended-on object is the aggressor', () => {
    const dep = edge({ id: 'e1', type: 'DEPENDS_ON', subject: settlement, object: resource })
    const g = graph([settlement, resource], [dep])
    const parties = buildParties(dep, g, createSeededRng('p'))
    expect(parties[0]).toMatchObject({ ref: settlement, role: 'defender' })
    expect(parties[1]).toMatchObject({ ref: resource, role: 'aggressor' })
  })

  it('adds a bystander from adjacency, never a principal', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const adjacency = edge({ id: 'e2', type: 'DEPENDS_ON', subject: settlement, object: factionA })
    const g = graph([factionA, factionB, settlement], [contested, adjacency])
    const parties = buildParties(contested, g, createSeededRng('p'))
    expect(parties).toHaveLength(3)
    expect(parties[2]).toMatchObject({ ref: settlement, role: 'bystander' })
  })

  it('prefers a settlement bystander over a faction bystander', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const facEdge = edge({ id: 'e2', type: 'CONTESTS', subject: factionC, object: factionA })
    const setEdge = edge({ id: 'e3', type: 'DEPENDS_ON', subject: settlement, object: factionB })
    const g = graph([factionA, factionB, factionC, settlement], [contested, facEdge, setEdge])
    const parties = buildParties(contested, g, createSeededRng('p'))
    expect(parties[2].ref).toEqual(settlement)
  })

  it('never picks star or system entities as bystanders', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const starEdge = edge({ id: 'e2', type: 'DESTABILIZES', subject: star, object: factionA })
    const g = graph([factionA, factionB, star], [contested, starEdge])
    const parties = buildParties(contested, g, createSeededRng('p'))
    expect(parties).toHaveLength(2)
  })

  it('is deterministic for the same seed', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB })
    const e2 = edge({ id: 'e2', type: 'DEPENDS_ON', subject: settlement, object: factionA })
    const e3 = edge({ id: 'e3', type: 'CONTESTS', subject: factionC, object: factionB })
    const g = graph([factionA, factionB, factionC, settlement], [contested, e2, e3])
    const a = buildParties(contested, g, createSeededRng('same'))
    const b = buildParties(contested, g, createSeededRng('same'))
    expect(a).toEqual(b)
  })
})
