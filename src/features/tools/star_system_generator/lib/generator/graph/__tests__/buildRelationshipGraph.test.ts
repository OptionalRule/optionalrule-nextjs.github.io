import { describe, expect, it } from 'vitest'
import { buildRelationshipGraph } from '../buildRelationshipGraph'
import type { EntityInventoryInput } from '../entities'
import { createSeededRng } from '../../rng'
import type { NarrativeFact } from '../../../types'
import { namedFactions } from '../../data/narrative'

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

const controlsFaction = namedFactions[0]
const controlsDomain = controlsFaction.domains[0]

const inputWithControlsFixture = (): EntityInventoryInput => ({
  ...minimalInput(),
  settlements: [{ id: 'settlement-1', name: { value: 'Orison Hold' }, bodyId: 'body-1' }],
  narrativeFacts: [
    { kind: 'namedFaction', value: { value: controlsFaction.name } },
  ],
})

const controlsFacts = (): NarrativeFact[] => [
  {
    id: 'f-fac-a',
    kind: 'namedFaction',
    domains: [...controlsFaction.domains],
    subjectType: 'faction',
    value: { value: controlsFaction.name, confidence: 'derived' },
    tags: [],
    status: 'established',
    sourcePath: 'test',
  },
  {
    id: 'f-auth-1',
    kind: 'settlement.authority',
    domains: [],
    subjectType: 'settlement',
    subjectId: 'settlement-1',
    value: { value: `office of ${controlsDomain} oversight`, confidence: 'derived' },
    tags: [],
    status: 'established',
    sourcePath: 'test',
  },
]

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

  it('attaches historical edges for CONTROLS spine edges', () => {
    const rng = createSeededRng('graph-test-history-1')
    const graph = buildRelationshipGraph(inputWithControlsFixture(), controlsFacts(), rng)

    const controlsSpineEdges = graph.edges.filter(
      e => e.type === 'CONTROLS' && graph.spineEdgeIds.includes(e.id),
    )
    expect(controlsSpineEdges.length).toBeGreaterThanOrEqual(1)

    const historicalEdges = graph.edges.filter(e => e.era === 'historical')
    expect(historicalEdges.length).toBeGreaterThanOrEqual(1)
    expect(graph.historicalEdgeIds.length).toBe(historicalEdges.length)
    for (const histEdge of historicalEdges) {
      expect(graph.historicalEdgeIds).toContain(histEdge.id)
      expect(histEdge.consequenceEdgeIds).toBeDefined()
      expect(histEdge.consequenceEdgeIds?.length).toBeGreaterThanOrEqual(1)
    }

    const controlsSpineId = controlsSpineEdges[0].id
    const histForControls = historicalEdges.find(
      e => e.consequenceEdgeIds?.[0] === controlsSpineId,
    )
    expect(histForControls).toBeDefined()
  })

  it('produces no historical edges when no spine edges qualify for backstory', () => {
    const rng = createSeededRng('graph-test-history-2')
    const graph = buildRelationshipGraph(minimalInput(), [], rng)
    expect(graph.historicalEdgeIds).toEqual([])
    expect(graph.edges.filter(e => e.era === 'historical')).toEqual([])
  })

  it('produces deterministic edges and historicalEdgeIds for the same seed', () => {
    const a = buildRelationshipGraph(
      inputWithControlsFixture(),
      controlsFacts(),
      createSeededRng('graph-test-history-3'),
    )
    const b = buildRelationshipGraph(
      inputWithControlsFixture(),
      controlsFacts(),
      createSeededRng('graph-test-history-3'),
    )
    expect(a.edges).toEqual(b.edges)
    expect(a.historicalEdgeIds).toEqual(b.historicalEdgeIds)
  })
})
