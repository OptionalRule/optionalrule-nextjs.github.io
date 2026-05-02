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

describe('buildRelationshipGraph (Phase 1 scaffold — empty edges)', () => {
  it('returns a populated entity inventory and an empty edge list', () => {
    const rng = createSeededRng('graph-test-1')
    const graph = buildRelationshipGraph(minimalInput(), rng)
    expect(graph.entities.length).toBeGreaterThan(0)
    expect(graph.edges).toEqual([])
    expect(graph.spineEdgeIds).toEqual([])
    expect(graph.historicalEdgeIds).toEqual([])
  })

  it('initializes edgesByEntity as an empty object', () => {
    const rng = createSeededRng('graph-test-2')
    const graph = buildRelationshipGraph(minimalInput(), rng)
    expect(graph.edgesByEntity).toEqual({})
  })

  it('initializes edgesByType with all 12 keys mapped to empty arrays', () => {
    const rng = createSeededRng('graph-test-3')
    const graph = buildRelationshipGraph(minimalInput(), rng)
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
    const a = buildRelationshipGraph(minimalInput(), createSeededRng('graph-test-4'))
    const b = buildRelationshipGraph(minimalInput(), createSeededRng('graph-test-4'))
    expect(a).toEqual(b)
  })
})
