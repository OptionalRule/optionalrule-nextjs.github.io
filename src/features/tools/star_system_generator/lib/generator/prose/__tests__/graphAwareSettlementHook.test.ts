import { describe, expect, it } from 'vitest'
import { graphAwareSettlementHook, rewriteFourthSentence } from '../graphAwareSettlementHook'
import type { Settlement } from '../../../../types'
import type { SystemRelationshipGraph, RelationshipEdge, EntityRef } from '../../graph'

function makeEntityRef(id: string, displayName: string, kind: EntityRef['kind']): EntityRef {
  return { id, displayName, kind, layer: 'human' }
}

function makeEdge(
  id: string,
  type: RelationshipEdge['type'],
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

function makeGraph(
  edges: RelationshipEdge[],
  entityEdgeIds: Record<string, string[]>,
  spineEdgeIds: string[] = [],
): SystemRelationshipGraph {
  return {
    entities: [],
    edges,
    spineEdgeIds,
    historicalEdgeIds: [],
    edgesByEntity: entityEdgeIds,
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

function makeSettlement(id: string): Settlement {
  return { id } as unknown as Settlement
}

describe('graphAwareSettlementHook', () => {
  it('returns null when no incident edges exist', () => {
    const settlement = makeSettlement('s1')
    const graph = makeGraph([], {}, [])
    expect(graphAwareSettlementHook(settlement, graph)).toBeNull()
  })

  it('returns null when only non-eligible incident edges exist (CONTROLS, HOSTS)', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const otherRef = makeEntityRef('f1', 'Kestrel Compact', 'namedFaction')
    const controlsEdge = makeEdge('edge-1', 'CONTROLS', sRef, otherRef)
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const hostsEdge = makeEdge('edge-2', 'HOSTS', bodyRef, sRef)
    const graph = makeGraph(
      [controlsEdge, hostsEdge],
      { s1: ['edge-1', 'edge-2'] },
      ['edge-1', 'edge-2'],
    )
    expect(graphAwareSettlementHook(settlement, graph)).toBeNull()
  })

  it('returns null when CONTESTS edge exists but is not in spine', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const fRef = makeEntityRef('f1', 'Route Authority', 'namedFaction')
    const edge = makeEdge('edge-1', 'CONTESTS', sRef, fRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, [])
    expect(graphAwareSettlementHook(settlement, graph)).toBeNull()
  })

  it('returns CONTESTS prose when settlement is in an incident CONTESTS spine edge', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const fRef = makeEntityRef('f1', 'Route Authority', 'namedFaction')
    const edge = makeEdge('edge-1', 'CONTESTS', sRef, fRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('standoff with Route Authority')
    expect(result).toBe('The standoff with Route Authority is the political reality of this site.')
  })

  it('returns CONTESTS prose when settlement is the object of a CONTESTS spine edge', () => {
    const settlement = makeSettlement('s1')
    const fRef = makeEntityRef('f1', 'Iron Compact', 'namedFaction')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const edge = makeEdge('edge-1', 'CONTESTS', fRef, sRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).toContain('standoff with Iron Compact')
  })

  it('returns DEPENDS_ON prose for incident DEPENDS_ON spine edge', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const rRef = makeEntityRef('r1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, rRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('turns on access to chiral ice belt')
  })

  it('returns SUPPRESSES prose for incident SUPPRESSES spine edge', () => {
    const settlement = makeSettlement('s1')
    const fRef = makeEntityRef('f1', 'Iron Compact', 'namedFaction')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const edge = makeEdge('edge-1', 'SUPPRESSES', fRef, sRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('Whoever controls Iron Compact')
  })

  it('picks the highest-spine-rank edge when multiple eligible spine edges exist', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const fRef1 = makeEntityRef('f1', 'First Authority', 'namedFaction')
    const fRef2 = makeEntityRef('f2', 'Second Authority', 'namedFaction')
    const edgeA = makeEdge('edge-a', 'CONTESTS', sRef, fRef1)
    const edgeB = makeEdge('edge-b', 'CONTESTS', sRef, fRef2)
    const graph = makeGraph(
      [edgeA, edgeB],
      { s1: ['edge-a', 'edge-b'] },
      ['edge-a', 'edge-b'],
    )
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).toContain('First Authority')
    expect(result).not.toContain('Second Authority')
  })

  it('output contains no unresolved {', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const rRef = makeEntityRef('r1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, rRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).not.toContain('{')
  })

  it('output ends with terminal punctuation', () => {
    const settlement = makeSettlement('s1')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const rRef = makeEntityRef('r1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, rRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] }, ['edge-1'])
    const result = graphAwareSettlementHook(settlement, graph)
    expect(result).not.toBeNull()
    expect(/[.!?]$/.test(result!)).toBe(true)
  })
})

describe('rewriteFourthSentence', () => {
  it('replaces the 4th sentence with the replacement', () => {
    const existing = 'Sentence one. Sentence two. Sentence three. Sentence four.'
    const replacement = 'New fourth sentence.'
    expect(rewriteFourthSentence(existing, replacement))
      .toBe('Sentence one. Sentence two. Sentence three. New fourth sentence.')
  })

  it('returns input unchanged if fewer than 3 sentence-terminating periods found', () => {
    const existing = 'Only one. Two.'
    const replacement = 'X.'
    expect(rewriteFourthSentence(existing, replacement)).toBe(existing)
  })
})
