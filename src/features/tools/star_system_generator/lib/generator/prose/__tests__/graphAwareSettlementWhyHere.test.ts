import { describe, expect, it } from 'vitest'
import { graphAwareSettlementWhyHere } from '../graphAwareSettlementWhyHere'
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

function makeGraph(edges: RelationshipEdge[], entityEdgeIds: Record<string, string[]>): SystemRelationshipGraph {
  return {
    entities: [],
    edges,
    spineEdgeIds: [],
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

function makeSettlement(id: string, anchorName: string, name?: string): Settlement {
  return {
    id,
    name: { value: name ?? id, confidence: 'confirmed' },
    anchorName: { value: anchorName, confidence: 'confirmed' },
  } as unknown as Settlement
}

describe('graphAwareSettlementWhyHere', () => {
  it('returns null when settlement has no incident edges', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const graph = makeGraph([], {})
    expect(graphAwareSettlementWhyHere(settlement, graph)).toBeNull()
  })

  it('returns null when only unrelated edges exist (e.g., CONTROLS)', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const otherRef = makeEntityRef('f1', 'Kestrel Compact', 'namedFaction')
    const edge = makeEdge('edge-1', 'CONTROLS', sRef, otherRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    expect(graphAwareSettlementWhyHere(settlement, graph)).toBeNull()
  })

  it('returns DEPENDS_ON-only prose when only DEPENDS_ON edge exists', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('chiral ice belt')
    expect(result).toContain('Orison Hold')
  })

  it('returns HOSTS-only prose when only HOSTS edge exists', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const edge = makeEdge('edge-1', 'HOSTS', bodyRef, sRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('Nosaxa IV-b')
    expect(result).toContain('Orison Hold')
  })

  it('returns combined prose when both DEPENDS_ON and HOSTS exist', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const depEdge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const hostsEdge = makeEdge('edge-2', 'HOSTS', bodyRef, sRef)
    const graph = makeGraph([depEdge, hostsEdge], { s1: ['edge-1', 'edge-2'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).toContain('chiral ice belt')
    expect(result).toContain('Nosaxa IV-b')
    expect(result).toContain('Orison Hold')
  })

  it('output ends with terminal punctuation', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).not.toBeNull()
    expect(/[.!?]$/.test(result!)).toBe(true)
  })

  it('output contains no unresolved { placeholder', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).not.toBeNull()
    expect(result).not.toContain('{')
  })

  it('uses anchorName.value, not name.value or id', () => {
    const settlement = makeSettlement('s1', 'Orison Hold', 'Settlement-1')
    const sRef = makeEntityRef('s1', 'Settlement-1', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph)
    expect(result).toContain('Orison Hold')
    expect(result).not.toContain('Settlement-1')
    expect(result).not.toContain('s1')
  })
})
