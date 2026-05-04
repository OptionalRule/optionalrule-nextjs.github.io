import { describe, expect, it } from 'vitest'
import { graphAwareSettlementWhyHere } from '../graphAwareSettlementWhyHere'
import { createSeededRng } from '../../rng'
import type { Settlement, GeneratorTone } from '../../../../types'
import type { SystemRelationshipGraph, RelationshipEdge, EntityRef } from '../../graph'

const rng = () => createSeededRng('whyhere-test').fork('case')
const tone: GeneratorTone = 'balanced'

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
    settlementSpineEdgeIds: [],
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
    presence: {
      score: { value: 5, confidence: 'human-layer', source: 'test' },
      roll: { value: 7, confidence: 'human-layer', source: 'test' },
      tier: { value: 'Active', confidence: 'human-layer', source: 'test' },
      resource: { value: 1, confidence: 'human-layer', source: 'test' },
      access: { value: 1, confidence: 'human-layer', source: 'test' },
      strategic: { value: 1, confidence: 'human-layer', source: 'test' },
      guValue: { value: 0, confidence: 'gu-layer', source: 'test' },
      habitability: { value: 1, confidence: 'inferred', source: 'test' },
      hazard: { value: 0, confidence: 'inferred', source: 'test' },
      legalHeat: { value: 0, confidence: 'human-layer', source: 'test' },
    },
  } as unknown as Settlement
}

describe('graphAwareSettlementWhyHere', () => {
  it('returns generic fallback content when settlement has no incident edges', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const graph = makeGraph([], {})
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).toContain('Orison Hold')
    expect(result.length).toBeGreaterThan(20)
  })

  it('falls through to presence/generic fallback when only unrelated edges exist', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const otherRef = makeEntityRef('f1', 'Kestrel Compact', 'namedFaction')
    const edge = makeEdge('edge-1', 'CONTROLS', sRef, otherRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).toContain('Orison Hold')
    expect(result.length).toBeGreaterThan(20)
  })

  it('returns DEPENDS_ON-only prose when only DEPENDS_ON edge exists', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
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
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).toContain('Orison Hold')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns combined prose when both DEPENDS_ON and HOSTS exist', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const depEdge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const hostsEdge = makeEdge('edge-2', 'HOSTS', bodyRef, sRef)
    const graph = makeGraph([depEdge, hostsEdge], { s1: ['edge-1', 'edge-2'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
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
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).not.toBeNull()
    expect(/[.!?]$/.test(result!)).toBe(true)
  })

  it('output contains no unresolved { placeholder', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).not.toBeNull()
    expect(result).not.toContain('{')
  })

  it('uses anchorName.value, not name.value or id', () => {
    const settlement = makeSettlement('s1', 'Orison Hold', 'Settlement-1')
    const sRef = makeEntityRef('s1', 'Settlement-1', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).toContain('Orison Hold')
    expect(result).not.toContain('Settlement-1')
    expect(result).not.toContain('s1')
  })

  it('cinematic tone selects from cinematic template register', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const seeds = ['cinematic-a', 'cinematic-b', 'cinematic-c', 'cinematic-d', 'cinematic-e']
    const cinematicMarkers = ['breathing on', 'goes dark', 'lit window', 'overdue']
    const balancedMarkers = ['continued operation', 'permanent infrastructure', 'wholly tied']
    const cinematicHits = seeds.filter(seed => {
      const out = graphAwareSettlementWhyHere(settlement, graph, createSeededRng(seed), 'cinematic')
      return cinematicMarkers.some(m => out.includes(m))
    }).length
    const balancedHits = seeds.filter(seed => {
      const out = graphAwareSettlementWhyHere(settlement, graph, createSeededRng(seed), 'balanced')
      return cinematicMarkers.some(m => out.includes(m))
    }).length
    expect(cinematicHits).toBeGreaterThan(0)
    expect(balancedHits).toBe(0)
    void balancedMarkers
  })

  it('returns presence-fallback content when guValue >= 3 and no graph edges', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    settlement.presence.guValue = { value: 3, confidence: 'gu-layer', source: 'test' } as Settlement['presence']['guValue']
    const result = graphAwareSettlementWhyHere(settlement, makeGraph([], {}), rng(), tone)
    expect(result).toContain('Orison Hold')
    expect(result.length).toBeGreaterThan(20)
  })

  it('produces deterministic output for the same rng + inputs', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edge = makeEdge('edge-1', 'DEPENDS_ON', sRef, guRef)
    const graph = makeGraph([edge], { s1: ['edge-1'] })
    const a = graphAwareSettlementWhyHere(settlement, graph, createSeededRng('det'), tone)
    const b = graphAwareSettlementWhyHere(settlement, graph, createSeededRng('det'), tone)
    expect(a).toBe(b)
  })

  it('emits at most two sentences (sentence cap)', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    settlement.presence.guValue = { value: 3, confidence: 'gu-layer', source: 'test' } as Settlement['presence']['guValue']
    settlement.presence.legalHeat = { value: 3, confidence: 'human-layer', source: 'test' } as Settlement['presence']['legalHeat']
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const factionRef = makeEntityRef('f1', 'Kestrel Compact', 'namedFaction')
    const phenRef = makeEntityRef('ph1', 'the bleed corridor', 'phenomenon')
    const edges = [
      makeEdge('e1', 'DEPENDS_ON', sRef, guRef),
      makeEdge('e2', 'HOSTS', bodyRef, sRef),
      makeEdge('e3', 'DESTABILIZES', phenRef, sRef),
      makeEdge('e4', 'CONTROLS', factionRef, sRef),
    ]
    const graph = makeGraph(edges, { s1: ['e1', 'e2', 'e3', 'e4'] })
    const seeds = ['cap-1', 'cap-2', 'cap-3', 'cap-4', 'cap-5']
    for (const seed of seeds) {
      const result = graphAwareSettlementWhyHere(settlement, graph, createSeededRng(seed), tone)
      const sentences = result.split(/(?<=[.!?])\s+/).filter(s => s.length > 0)
      expect(sentences.length).toBeLessThanOrEqual(2)
    }
  })

  it('combines hazard + faction into a single sentence-2 (combined template)', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const factionRef = makeEntityRef('f1', 'Kestrel Compact', 'namedFaction')
    const phenRef = makeEntityRef('ph1', 'the bleed corridor', 'phenomenon')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const edges = [
      makeEdge('e1', 'DEPENDS_ON', sRef, guRef),
      makeEdge('e2', 'DESTABILIZES', phenRef, sRef),
      makeEdge('e3', 'CONTROLS', factionRef, sRef),
    ]
    const graph = makeGraph(edges, { s1: ['e1', 'e2', 'e3'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    expect(result).toContain('the bleed corridor')
    expect(result).toContain('Kestrel Compact')
    const sentences = result.split(/(?<=[.!?])\s+/).filter(s => s.length > 0)
    expect(sentences.length).toBeLessThanOrEqual(2)
  })

  it('omits sentence 2 when only structural edges exist and presence is low', () => {
    const settlement = makeSettlement('s1', 'Orison Hold')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const guRef = makeEntityRef('gu1', 'chiral ice belt', 'guResource')
    const bodyRef = makeEntityRef('b1', 'Nosaxa IV-b', 'body')
    const edges = [
      makeEdge('e1', 'DEPENDS_ON', sRef, guRef),
      makeEdge('e2', 'HOSTS', bodyRef, sRef),
    ]
    const graph = makeGraph(edges, { s1: ['e1', 'e2'] })
    const result = graphAwareSettlementWhyHere(settlement, graph, rng(), tone)
    const sentences = result.split(/(?<=[.!?])\s+/).filter(s => s.length > 0)
    expect(sentences.length).toBe(1)
  })

  it('avoids tautology when anchor and host share a prefix', () => {
    const settlement = makeSettlement('s1', "Meissa's Forge II orbital space")
    const sRef = makeEntityRef('s1', "Meissa's Forge II orbital space", 'settlement')
    const bodyRef = makeEntityRef('b1', "Meissa's Forge II", 'body')
    const edge = makeEdge('e1', 'HOSTS', bodyRef, sRef)
    const graph = makeGraph([edge], { s1: ['e1'] })
    const seeds = ['taut-1', 'taut-2', 'taut-3', 'taut-4', 'taut-5']
    for (const seed of seeds) {
      const result = graphAwareSettlementWhyHere(settlement, graph, createSeededRng(seed), tone)
      expect(result).not.toMatch(/Meissa's Forge II orbital space.+(on|onto|into) Meissa's Forge II\b/)
    }
  })
})
