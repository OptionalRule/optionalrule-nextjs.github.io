import { describe, expect, it } from 'vitest'
import { selectSettlementSpineEdgeIds } from '../settlementSpineEligibility'
import type { ScoredCandidate } from '../score'
import type { EdgeType, EntityRef, RelationshipEdge } from '../types'

function makeRef(id: string, kind: EntityRef['kind'], displayName: string): EntityRef {
  return { id, kind, displayName, layer: kind === 'settlement' ? 'human' : 'gu' }
}

function makeEdge(
  id: string,
  type: EdgeType,
  subject: EntityRef,
  object: EntityRef,
): RelationshipEdge {
  return {
    id,
    type,
    subject,
    object,
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [],
    era: 'present',
    weight: 1,
  }
}

function scored(edge: RelationshipEdge, score = 1): ScoredCandidate {
  return { edge, score, bonuses: { novelty: 0, crossLayer: 0, namedEntity: 0 } }
}

describe('selectSettlementSpineEdgeIds', () => {
  it('includes DEPENDS_ON edges with settlement endpoint', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const r = makeRef('r1', 'guResource', 'chiral ice belt')
    const edge = makeEdge('e1', 'DEPENDS_ON', s, r)
    const result = selectSettlementSpineEdgeIds([scored(edge)], new Set(['s1']))
    expect(result).toEqual(['e1'])
  })

  it('includes CONTESTS edges with settlement endpoint', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const f = makeRef('f1', 'namedFaction', 'Route Authority')
    const edge = makeEdge('e1', 'CONTESTS', s, f)
    const result = selectSettlementSpineEdgeIds([scored(edge)], new Set(['s1']))
    expect(result).toEqual(['e1'])
  })

  it('includes SUPPRESSES edges with settlement endpoint', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const f = makeRef('f1', 'namedFaction', 'Iron Compact')
    const edge = makeEdge('e1', 'SUPPRESSES', f, s)
    const result = selectSettlementSpineEdgeIds([scored(edge)], new Set(['s1']))
    expect(result).toEqual(['e1'])
  })

  it('excludes ineligible edge types (HOSTS, FOUNDED_BY)', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const b = makeRef('b1', 'body', 'Nosaxa IV-b')
    const f = makeRef('f1', 'namedFaction', 'Route Authority')
    const hostsEdge = makeEdge('e1', 'HOSTS', b, s)
    const foundedEdge = makeEdge('e2', 'FOUNDED_BY', s, f)
    const result = selectSettlementSpineEdgeIds(
      [scored(hostsEdge), scored(foundedEdge)],
      new Set(['s1']),
    )
    expect(result).toEqual([])
  })

  it('excludes eligible-typed edges with no settlement endpoint', () => {
    const f1 = makeRef('f1', 'namedFaction', 'Route Authority')
    const f2 = makeRef('f2', 'namedFaction', 'Iron Compact')
    const edge = makeEdge('e1', 'CONTESTS', f1, f2)
    const result = selectSettlementSpineEdgeIds([scored(edge)], new Set(['s1']))
    expect(result).toEqual([])
  })

  it('caps at 1 edge per settlement (highest-scored wins via input order)', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const f1 = makeRef('f1', 'namedFaction', 'Route Authority')
    const f2 = makeRef('f2', 'namedFaction', 'Iron Compact')
    const edgeA = makeEdge('eA', 'CONTESTS', s, f1)
    const edgeB = makeEdge('eB', 'DEPENDS_ON', s, f2)
    // Input order represents score descending — first arg wins.
    const result = selectSettlementSpineEdgeIds(
      [scored(edgeA, 2), scored(edgeB, 1)],
      new Set(['s1']),
    )
    expect(result).toEqual(['eA'])
  })

  it('allows separate settlements each to claim one edge', () => {
    const s1 = makeRef('s1', 'settlement', 'Orison Hold')
    const s2 = makeRef('s2', 'settlement', 'Mira Junction')
    const r1 = makeRef('r1', 'guResource', 'chiral ice belt')
    const r2 = makeRef('r2', 'guResource', 'salt aquifer')
    const edge1 = makeEdge('e1', 'DEPENDS_ON', s1, r1)
    const edge2 = makeEdge('e2', 'DEPENDS_ON', s2, r2)
    const result = selectSettlementSpineEdgeIds(
      [scored(edge1), scored(edge2)],
      new Set(['s1', 's2']),
    )
    expect(result).toEqual(['e1', 'e2'])
  })

  it('returns empty when settlementIds is empty', () => {
    const s = makeRef('s1', 'settlement', 'Orison Hold')
    const r = makeRef('r1', 'guResource', 'chiral ice belt')
    const edge = makeEdge('e1', 'DEPENDS_ON', s, r)
    const result = selectSettlementSpineEdgeIds([scored(edge)], new Set())
    expect(result).toEqual([])
  })
})
