import { describe, expect, it } from 'vitest'
import { clusterEdges } from '../clusters'
import type { EdgeType, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../types'

const defaultSubject: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
const defaultObject: EntityRef = { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' }

function makeEdge(o: Partial<RelationshipEdge> & { id: string; type: EdgeType }): RelationshipEdge {
  return {
    id: o.id,
    type: o.type,
    subject: o.subject ?? defaultSubject,
    object: o.object ?? defaultObject,
    qualifier: o.qualifier,
    visibility: o.visibility ?? 'public',
    confidence: o.confidence ?? 'inferred',
    groundingFactIds: o.groundingFactIds ?? [],
    era: o.era ?? 'present',
    weight: o.weight ?? 0.5,
    approxEra: o.approxEra,
    summary: o.summary,
    consequenceEdgeIds: o.consequenceEdgeIds,
  }
}

function makeGraph(edges: RelationshipEdge[], spineEdgeIds: string[] = []): SystemRelationshipGraph {
  return {
    entities: [],
    edges,
    spineEdgeIds,
    settlementSpineEdgeIds: [],
    historicalEdgeIds: [],
    edgesByEntity: {},
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

describe('clusterEdges', () => {
  it('puts spine edges in spineCluster', () => {
    const e1 = makeEdge({ id: 'e1', type: 'CONTESTS' })
    const result = clusterEdges(makeGraph([e1], ['e1']))
    expect(result.spineCluster.map(e => e.id)).toEqual(['e1'])
  })

  it('puts non-spine active edges in activeCluster', () => {
    const e1 = makeEdge({ id: 'spine', type: 'CONTESTS' })
    const e2 = makeEdge({ id: 'active', type: 'DESTABILIZES' })
    const result = clusterEdges(makeGraph([e1, e2], ['spine']))
    expect(result.activeCluster.map(e => e.id)).toEqual(['active'])
  })

  it('puts visible epistemic edges in epistemicCluster', () => {
    const e1 = makeEdge({ id: 'pub', type: 'CONTRADICTS', visibility: 'public' })
    const e2 = makeEdge({ id: 'cont', type: 'WITNESSES', visibility: 'contested' })
    const result = clusterEdges(makeGraph([e1, e2]))
    expect(result.epistemicCluster.map(e => e.id).sort()).toEqual(['cont', 'pub'])
  })

  it('excludes hidden epistemic edges from epistemicCluster (they go to hooks)', () => {
    const e = makeEdge({ id: 'hidden', type: 'CONTRADICTS', visibility: 'hidden' })
    const result = clusterEdges(makeGraph([e]))
    expect(result.epistemicCluster).toHaveLength(0)
  })

  it('puts HOSTS / DEPENDS_ON edges into spineCluster as neighbors when they touch a spined entity', () => {
    const sharedFaction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Authority', layer: 'human' }
    const otherFaction: EntityRef = { kind: 'namedFaction', id: 'f2', displayName: 'Compact', layer: 'human' }
    const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }

    const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: sharedFaction, object: otherFaction })
    const neighbor = makeEdge({ id: 'host', type: 'HOSTS', subject: body, object: sharedFaction })
    const result = clusterEdges(makeGraph([spine, neighbor], ['spine']))
    expect(result.spineCluster.map(e => e.id).sort()).toEqual(['host', 'spine'])
  })

  it('handles sparse graph (only HOSTS, no spine) — HOSTS without spine is dropped', () => {
    const e = makeEdge({ id: 'h1', type: 'HOSTS' })
    const result = clusterEdges(makeGraph([e]))
    expect(result.spineCluster).toHaveLength(0)
    expect(result.activeCluster).toHaveLength(0)
  })

  it('preserves edge insertion order within each cluster', () => {
    const e1 = makeEdge({ id: 'e1', type: 'DESTABILIZES' })
    const e2 = makeEdge({ id: 'e2', type: 'DESTABILIZES' })
    const result = clusterEdges(makeGraph([e1, e2], []))
    expect(result.activeCluster.map(e => e.id)).toEqual(['e1', 'e2'])
  })
})

describe('clusterEdges density conditioning', () => {
  const factionA: EntityRef = { kind: 'namedFaction', id: 'fa', displayName: 'Kestrel Compact', layer: 'human' }
  const factionB: EntityRef = { kind: 'namedFaction', id: 'fb', displayName: 'Red Vane Guild', layer: 'human' }
  const factionC: EntityRef = { kind: 'namedFaction', id: 'fc', displayName: 'Glasshouse Compact', layer: 'human' }
  const orphanA: EntityRef = { kind: 'namedFaction', id: 'orphan-a', displayName: 'Orphan Alpha', layer: 'human' }
  const orphanB: EntityRef = { kind: 'namedFaction', id: 'orphan-b', displayName: 'Orphan Beta', layer: 'human' }

  it('sparse drops multi-faction structural edges from spineCluster', () => {
    const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: factionA, object: factionB })
    const multiFactionEdge = makeEdge({
      id: 'mf',
      type: 'CONTROLS',
      subject: factionA,
      object: factionC,
    })
    const graph = makeGraph([spine, multiFactionEdge], ['spine'])
    const sparse = clusterEdges(graph, { settlements: 'sparse' })
    const normal = clusterEdges(graph, { settlements: 'normal' })
    expect(sparse.spineCluster.map(e => e.id)).not.toContain('mf')
    expect(normal.spineCluster.map(e => e.id)).toContain('mf')
  })

  it('hub pulls non-spine-touching CONTROLS into spineCluster', () => {
    const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: factionA, object: factionB })
    const orphanCtrl = makeEdge({
      id: 'orphan-ctrl',
      type: 'CONTROLS',
      subject: orphanA,
      object: orphanB,
    })
    const graph = makeGraph([spine, orphanCtrl], ['spine'])
    const hub = clusterEdges(graph, { settlements: 'hub' })
    const normal = clusterEdges(graph, { settlements: 'normal' })
    expect(hub.spineCluster.map(e => e.id)).toContain('orphan-ctrl')
    expect(normal.spineCluster.map(e => e.id)).not.toContain('orphan-ctrl')
  })

  it('hub pulls non-spine-touching DEPENDS_ON into spineCluster', () => {
    const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: factionA, object: factionB })
    const orphanDep = makeEdge({
      id: 'orphan-dep',
      type: 'DEPENDS_ON',
      subject: orphanA,
      object: orphanB,
    })
    const graph = makeGraph([spine, orphanDep], ['spine'])
    const hub = clusterEdges(graph, { settlements: 'hub' })
    const normal = clusterEdges(graph, { settlements: 'normal' })
    expect(hub.spineCluster.map(e => e.id)).toContain('orphan-dep')
    expect(normal.spineCluster.map(e => e.id)).not.toContain('orphan-dep')
  })

  it('normal preserves baseline behavior (default)', () => {
    const spine = makeEdge({ id: 'spine', type: 'CONTESTS', subject: factionA, object: factionB })
    const neighbor = makeEdge({ id: 'neighbor', type: 'CONTROLS', subject: factionA, object: factionC })
    const graph = makeGraph([spine, neighbor], ['spine'])
    const explicit = clusterEdges(graph, { settlements: 'normal' })
    const defaulted = clusterEdges(graph)
    expect(defaulted.spineCluster.map(e => e.id)).toEqual(explicit.spineCluster.map(e => e.id))
  })
})
