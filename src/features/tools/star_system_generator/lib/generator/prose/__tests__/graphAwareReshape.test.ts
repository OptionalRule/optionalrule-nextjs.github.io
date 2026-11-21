import { describe, expect, it } from 'vitest'
import { graphAwareReshape } from '../graphAwareReshape'
import { createSeededRng } from '../../rng'
import type { Settlement, SystemPhenomenon, GenerationOptions } from '../../../../types'
import type { SystemRelationshipGraph, RelationshipEdge, EntityRef } from '../../graph'

function emptyGraph(): SystemRelationshipGraph {
  return {
    entities: [], edges: [], spineEdgeIds: [], settlementSpineEdgeIds: [], historicalEdgeIds: [],
    edgesByEntity: {},
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

function minimalSettlement(id: string): Settlement {
  return {
    id,
    name: { value: `Anchor-${id}`, confidence: 'confirmed', source: 'test' },
    anchorName: { value: `Anchor-${id}`, confidence: 'confirmed', source: 'test' },
    whyHere: { value: 'original whyHere', confidence: 'confirmed', source: 'test' },
    tagHook: { value: 'original tagHook', confidence: 'human-layer', source: 'test' },
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

function minimalPhenomenon(id: string): SystemPhenomenon {
  return { id } as unknown as SystemPhenomenon
}

const baseOptions: GenerationOptions = {
  seed: 't', distribution: 'frontier', tone: 'balanced',
  gu: 'normal', settlements: 'normal',
}

describe('graphAwareReshape', () => {
  it('iterates settlements unconditionally (whyHere runs without flags)', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).not.toBe(settlements)
    expect(result.settlements).toHaveLength(2)
    expect(result.settlements[0].whyHere.value).toContain('Anchor-s1')
    expect(result.settlements[1].whyHere.value).toContain('Anchor-s2')
  })

  it('returns the input phenomena by reference', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('reshape-test'),
    })
    expect(result.phenomena).toBe(phenomena)
  })

  it('iterates settlements while leaving phenomena untouched', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).not.toBe(settlements)
    expect(result.settlements[0].whyHere.value).toContain('Anchor-s1')
    expect(result.phenomena).toBe(phenomena)
  })

  it('forks rng with label "graph-prose"', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('fork-label-test'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('fork-label-test'),
    })
    expect(resultA).toEqual(resultB)
  })

  it('preserves determinism: same input + same seed → identical output', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('determinism-seed'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('determinism-seed'),
    })
    expect(resultA).toEqual(resultB)
  })
})

function makeEntityRef(id: string, displayName: string, kind: EntityRef['kind']): EntityRef {
  return { id, displayName, kind, layer: 'human' }
}

function makeDependsOnEdge(settlementId: string, resourceId: string): RelationshipEdge {
  return {
    id: `edge-${settlementId}-${resourceId}`,
    type: 'DEPENDS_ON',
    subject: makeEntityRef(settlementId, 'Orison Hold', 'settlement'),
    object: makeEntityRef(resourceId, 'chiral ice belt', 'guResource'),
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [],
    era: 'present',
    weight: 1,
  }
}

function graphWithEdges(edges: RelationshipEdge[]): SystemRelationshipGraph {
  const edgesByEntity: Record<string, string[]> = {}
  for (const edge of edges) {
    edgesByEntity[edge.subject.id] = [...(edgesByEntity[edge.subject.id] ?? []), edge.id]
    edgesByEntity[edge.object.id] = [...(edgesByEntity[edge.object.id] ?? []), edge.id]
  }
  return {
    ...emptyGraph(),
    edges,
    edgesByEntity,
  }
}

function settlementWithAnchor(id: string, anchorName: string): Settlement {
  return {
    id,
    name: { value: anchorName, confidence: 'confirmed', source: 'test' },
    anchorName: { value: anchorName, confidence: 'confirmed', source: 'test' },
    whyHere: { value: 'original whyHere', confidence: 'confirmed', source: 'test' },
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

function makePhenomenonWithFields(id: string, fields: {
  travelEffect?: string
  surveyQuestion?: string
  conflictHook?: string
  sceneAnchor?: string
  note?: string
}): SystemPhenomenon {
  return {
    id,
    travelEffect: { value: fields.travelEffect ?? '', confidence: 'inferred' },
    surveyQuestion: { value: fields.surveyQuestion ?? '', confidence: 'inferred' },
    conflictHook: { value: fields.conflictHook ?? '', confidence: 'inferred' },
    sceneAnchor: { value: fields.sceneAnchor ?? '', confidence: 'inferred' },
    note: { value: fields.note ?? 'original note', confidence: 'confirmed' },
    phenomenon: { value: 'test phenomenon', confidence: 'inferred' },
  } as unknown as SystemPhenomenon
}

function makeDestabilizesEdge(subjectId: string, objectId: string, objectDisplayName: string): RelationshipEdge {
  return {
    id: `edge-${subjectId}-${objectId}`,
    type: 'DESTABILIZES',
    subject: makeEntityRef(subjectId, 'The Signal Bloom', 'phenomenon'),
    object: makeEntityRef(objectId, objectDisplayName, 'settlement'),
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [],
    era: 'present',
    weight: 1,
  }
}

describe('graphAwareReshape — phenomena', () => {
  it('returns phenomena by reference even when a DESTABILIZES edge exists', () => {
    const phenomenon = makePhenomenonWithFields('p1', {
      travelEffect: 'Ships must navigate the bloom.',
      surveyQuestion: 'What pulses behind the static?',
      conflictHook: 'Whoever owns the recordings owns the question.',
      sceneAnchor: 'A drift of low-amplitude blooms.',
    })
    const phenomena = [phenomenon]
    const result = graphAwareReshape({
      settlements: [],
      phenomena,
      relationshipGraph: graphWithEdges([makeDestabilizesEdge('p1', 's1', 'Orison Hold')]),
      options: baseOptions,
      rng: createSeededRng('ph-integration-test'),
    })
    expect(result.phenomena).toBe(phenomena)
    expect(result.phenomena[0].note.value).toBe('original note')
  })
})

describe('graphAwareReshape — settlementWhyHere integration', () => {
  it('replaces whyHere when incident DEPENDS_ON exists', () => {
    const settlement = settlementWithAnchor('s1', 'Orison Hold')
    const graph = graphWithEdges([makeDependsOnEdge('s1', 'gu1')])
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: baseOptions,
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('Orison Hold')
    expect(result.settlements[0].whyHere.value).toContain('chiral ice belt')
    expect(result.settlements[0].whyHere.confidence).toBe('inferred')
  })

  it('replaces whyHere with presence/generic fallback content when no incident edges exist', () => {
    const settlement = settlementWithAnchor('s1', 'Orison Hold')
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('Orison Hold')
    expect(result.settlements[0].whyHere.value).not.toBe('original whyHere')
    expect(result.settlements[0].whyHere.confidence).toBe('inferred')
  })
})

function makeContestsEdge(subjectId: string, objectId: string, objectDisplayName: string): RelationshipEdge {
  return {
    id: `edge-${subjectId}-${objectId}`,
    type: 'CONTESTS',
    subject: makeEntityRef(subjectId, 'Settlement-1', 'settlement'),
    object: makeEntityRef(objectId, objectDisplayName, 'namedFaction'),
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [],
    era: 'present',
    weight: 1,
  }
}

function settlementWithTagHook(id: string, anchorName: string, tagHookValue: string): Settlement {
  return {
    id,
    name: { value: anchorName, confidence: 'confirmed', source: 'test' },
    anchorName: { value: anchorName, confidence: 'confirmed', source: 'test' },
    whyHere: { value: 'original whyHere', confidence: 'confirmed', source: 'test' },
    tagHook: { value: tagHookValue, confidence: 'human-layer', source: 'test' },
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

function graphWithEdgesAndSpine(edges: RelationshipEdge[], spineEdgeIds: string[]): SystemRelationshipGraph {
  const edgesByEntity: Record<string, string[]> = {}
  for (const edge of edges) {
    edgesByEntity[edge.subject.id] = [...(edgesByEntity[edge.subject.id] ?? []), edge.id]
    edgesByEntity[edge.object.id] = [...(edgesByEntity[edge.object.id] ?? []), edge.id]
  }
  return {
    ...emptyGraph(),
    edges,
    edgesByEntity,
    spineEdgeIds,
    settlementSpineEdgeIds: spineEdgeIds,
  }
}

describe('graphAwareReshape — tagHook', () => {
  it('rewrites whyHere but returns tagHook unchanged even with an eligible spine edge', () => {
    const tagHookValue = 'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.'
    const settlement = settlementWithTagHook('s1', 'Orison Hold', tagHookValue)
    const originalTagHook = settlement.tagHook
    const contestsEdge = makeContestsEdge('s1', 'f1', 'Route Authority')
    const graph = graphWithEdgesAndSpine([makeDependsOnEdge('s1', 'gu1'), contestsEdge], [contestsEdge.id])
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: baseOptions,
      rng: createSeededRng('hook-off-test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('chiral ice belt')
    expect(result.settlements[0].tagHook).toBe(originalTagHook)
  })
})
