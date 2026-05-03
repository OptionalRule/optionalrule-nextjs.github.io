import { describe, expect, it } from 'vitest'
import { buildRelationshipGraph } from '../buildRelationshipGraph'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'

const minimalInput = (): EntityInventoryInput => ({
  systemName: 'Nosaxa IV',
  primary: { spectralType: { value: 'G2V' } },
  companions: [],
  bodies: [{ id: 'body-1', name: { value: 'Nosaxa IV-a' } }],
  settlements: [{ id: 'settlement-1', name: { value: 'Orison Hold' } }],
  guOverlay: {
    resource: { value: 'chiral ice belt' },
    hazard: { value: 'flare-amplified bleed season' },
  },
  phenomena: [],
  ruins: [],
  narrativeFacts: [],
})

const inputWithHostedSettlement = (): EntityInventoryInput => ({
  ...minimalInput(),
  settlements: [{ id: 'settlement-1', name: { value: 'Orison Hold' }, bodyId: 'body-1' }],
})

describe('buildRelationshipGraph', () => {
  it('returns a populated entity inventory and an empty edge list when no rules match', () => {
    const rng = createSeededRng('graph-test-1')
    const graph = buildRelationshipGraph(minimalInput(), [], rng)
    expect(graph.entities.length).toBeGreaterThan(0)
    expect(graph.edges).toEqual([])
    expect(graph.spineEdgeIds).toEqual([])
    expect(graph.historicalEdgeIds).toEqual([])
  })

  it('initializes edgesByEntity as an empty object when no rules match', () => {
    const rng = createSeededRng('graph-test-2')
    const graph = buildRelationshipGraph(minimalInput(), [], rng)
    expect(graph.edgesByEntity).toEqual({})
  })

  it('initializes edgesByType with all 12 keys mapped to empty arrays when no rules match', () => {
    const rng = createSeededRng('graph-test-3')
    const graph = buildRelationshipGraph(minimalInput(), [], rng)
    const expectedKeys = [
      'HOSTS', 'CONTROLS', 'DEPENDS_ON',
      'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
      'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
    ] as const
    for (const key of expectedKeys) {
      expect(graph.edgesByType[key]).toEqual([])
    }
    expect(Object.keys(graph.edgesByType).length).toBe(12)
  })

  it('produces deterministic output for the same seed and input', () => {
    const a = buildRelationshipGraph(minimalInput(), [], createSeededRng('graph-test-4'))
    const b = buildRelationshipGraph(minimalInput(), [], createSeededRng('graph-test-4'))
    expect(a).toEqual(b)
  })

  it('produces a HOSTS edge when a settlement has a bodyId', () => {
    const rng = createSeededRng('graph-test-hosts')
    const graph = buildRelationshipGraph(inputWithHostedSettlement(), [], rng)
    expect(graph.edges.length).toBeGreaterThanOrEqual(1)
    const hostsEdges = graph.edges.filter(e => e.type === 'HOSTS')
    expect(hostsEdges.length).toBe(1)
    expect(graph.edgesByType.HOSTS).toHaveLength(1)
    const edgeId = hostsEdges[0].id
    expect(graph.edgesByEntity['body-1']).toContain(edgeId)
    expect(graph.edgesByEntity['settlement-1']).toContain(edgeId)
  })
})
