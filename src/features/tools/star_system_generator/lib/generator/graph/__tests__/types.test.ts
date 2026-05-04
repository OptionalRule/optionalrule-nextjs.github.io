import { describe, expect, it } from 'vitest'
import type {
  EntityRef,
  EntityKind,
  EdgeType,
  EdgeVisibility,
  EdgeEra,
  EntityLayer,
  RelationshipEdge,
  SystemRelationshipGraph,
} from '../types'
import type { Confidence } from '../../../../types'

describe('graph/types', () => {
  it('EntityRef accepts all 12 kinds', () => {
    const kinds: EntityKind[] = [
      'system', 'star', 'body', 'settlement', 'guResource', 'guHazard',
      'phenomenon', 'ruin', 'namedFaction', 'localInstitution', 'route', 'gate',
    ]
    expect(kinds.length).toBe(12)
    const ref: EntityRef = {
      kind: 'settlement',
      id: 'orison-hold',
      displayName: 'Orison Hold',
      layer: 'human',
    }
    expect(ref.kind).toBe('settlement')
  })

  it('EdgeType accepts all 12 types', () => {
    const types: EdgeType[] = [
      'HOSTS', 'CONTROLS', 'DEPENDS_ON',
      'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
      'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
    ]
    expect(types.length).toBe(12)
  })

  it('RelationshipEdge required and optional fields compile', () => {
    const presentEdge: RelationshipEdge = {
      id: 'edge-1',
      type: 'HOSTS',
      subject: { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' },
      object: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      visibility: 'public',
      confidence: 'derived' satisfies Confidence,
      groundingFactIds: ['fact-1'],
      era: 'present',
      weight: 1.0,
    }
    expect(presentEdge.era).toBe('present')

    const historicalEdge: RelationshipEdge = {
      id: 'edge-2',
      type: 'FOUNDED_BY',
      subject: { kind: 'namedFaction', id: 'authority', displayName: 'Route Authority', layer: 'human' },
      object: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
      visibility: 'public',
      confidence: 'human-layer',
      groundingFactIds: [],
      era: 'historical',
      weight: 0.8,
      approxEra: 'second wave',
      summary: 'Orison Hold was founded by the Route Authority during the second wave.',
      consequenceEdgeIds: ['edge-1'],
    }
    expect(historicalEdge.approxEra).toBe('second wave')
  })

  it('SystemRelationshipGraph initial empty shape compiles', () => {
    const graph: SystemRelationshipGraph = {
      entities: [],
      edges: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
      spineEdgeIds: [],
      settlementSpineEdgeIds: [],
      historicalEdgeIds: [],
    }
    expect(graph.entities.length).toBe(0)
    expect(Object.keys(graph.edgesByType).length).toBe(12)
  })

  it('EdgeVisibility is the literal union public | contested | hidden', () => {
    const v: EdgeVisibility[] = ['public', 'contested', 'hidden']
    expect(v.length).toBe(3)
  })

  it('EntityLayer covers all 3 layer values', () => {
    const layers: EntityLayer[] = ['physical', 'gu', 'human']
    expect(layers.length).toBe(3)
  })

  it('EdgeEra covers both era values', () => {
    const eras: EdgeEra[] = ['present', 'historical']
    expect(eras.length).toBe(2)
  })
})
