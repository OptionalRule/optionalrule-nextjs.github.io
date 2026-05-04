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
  return { id } as unknown as Settlement
}

function minimalPhenomenon(id: string): SystemPhenomenon {
  return { id } as unknown as SystemPhenomenon
}

const baseOptions: GenerationOptions = {
  seed: 't', distribution: 'frontier', tone: 'balanced',
  gu: 'normal', settlements: 'normal',
}

describe('graphAwareReshape', () => {
  it('returns input unchanged when no flags are set', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
    expect(result.phenomena).toBe(phenomena)
  })

  it('returns input unchanged when graphAware is empty object', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: {} },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
    expect(result.phenomena).toBe(phenomena)
  })

  it('iterates settlements when settlementWhyHere flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).not.toBe(settlements)
    expect(result.settlements).toEqual(settlements)
  })

  it('iterates phenomena when phenomenonNote flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1'), minimalPhenomenon('p2')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.phenomena).not.toBe(phenomena)
    expect(result.phenomena).toEqual(phenomena)
  })

  it('does not iterate phenomena when only settlement flags are on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.phenomena).toBe(phenomena)
  })

  it('does not iterate settlements when only phenomenonNote flag is on', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const result = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('reshape-test'),
    })
    expect(result.settlements).toBe(settlements)
  })

  it('forks rng with label "graph-prose"', () => {
    const settlements: Settlement[] = [minimalSettlement('s1')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('fork-label-test'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('fork-label-test'),
    })
    expect(resultA).toEqual(resultB)
  })

  it('preserves determinism: same input + same seed → identical output', () => {
    const settlements: Settlement[] = [minimalSettlement('s1'), minimalSettlement('s2')]
    const phenomena: SystemPhenomenon[] = [minimalPhenomenon('p1')]
    const options: GenerationOptions = { ...baseOptions, graphAware: { settlementWhyHere: true, phenomenonNote: true } }
    const resultA = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options,
      rng: createSeededRng('determinism-seed'),
    })
    const resultB = graphAwareReshape({
      settlements, phenomena,
      relationshipGraph: emptyGraph(),
      options,
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
    anchorName: { value: anchorName, confidence: 'confirmed' },
    whyHere: { value: 'original whyHere', confidence: 'confirmed' },
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

describe('graphAwareReshape — phenomenonNote integration', () => {
  it('replaces note when phenomenonNote flag is on AND DESTABILIZES exists', () => {
    const phenomenon = makePhenomenonWithFields('p1', {
      travelEffect: 'Ships must navigate the bloom.',
      surveyQuestion: 'What pulses behind the static?',
      conflictHook: 'Whoever owns the recordings owns the question.',
      sceneAnchor: 'A drift of low-amplitude blooms.',
    })
    const edge = makeDestabilizesEdge('p1', 's1', 'Orison Hold')
    const graph = graphWithEdges([edge])
    const result = graphAwareReshape({
      settlements: [],
      phenomena: [phenomenon],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('ph-integration-test'),
    })
    expect(result.phenomena[0].note.value).toContain('Orison Hold')
    expect(result.phenomena[0].note.value).not.toContain('Transit:')
    expect(result.phenomena[0].note.confidence).toBe('inferred')
  })

  it('preserves note when phenomenonNote flag is off', () => {
    const phenomenon = makePhenomenonWithFields('p1', {
      travelEffect: 'Ships must navigate the bloom.',
      surveyQuestion: 'What pulses behind the static?',
    })
    const originalNote = phenomenon.note
    const result = graphAwareReshape({
      settlements: [],
      phenomena: [phenomenon],
      relationshipGraph: emptyGraph(),
      options: baseOptions,
      rng: createSeededRng('ph-flag-off'),
    })
    expect(result.phenomena[0].note).toBe(originalNote)
  })

  it('preserves note when flag on but reshape returns null (all-empty fields)', () => {
    const phenomenon = makePhenomenonWithFields('p1', {
      travelEffect: '', surveyQuestion: '', conflictHook: '', sceneAnchor: '',
    })
    const originalNote = phenomenon.note
    const result = graphAwareReshape({
      settlements: [],
      phenomena: [phenomenon],
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { phenomenonNote: true } },
      rng: createSeededRng('ph-null-fields'),
    })
    expect(result.phenomena[0].note).toBe(originalNote)
  })
})

describe('graphAwareReshape — settlementWhyHere integration', () => {
  it('replaces whyHere when settlementWhyHere flag is on AND incident DEPENDS_ON exists', () => {
    const settlement = settlementWithAnchor('s1', 'Orison Hold')
    const graph = graphWithEdges([makeDependsOnEdge('s1', 'gu1')])
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('Orison Hold')
    expect(result.settlements[0].whyHere.value).toContain('chiral ice belt')
    expect(result.settlements[0].whyHere.confidence).toBe('inferred')
  })

  it('preserves whyHere when settlementWhyHere flag is off', () => {
    const settlement = settlementWithAnchor('s1', 'Orison Hold')
    const originalWhyHere = settlement.whyHere
    const graph = graphWithEdges([makeDependsOnEdge('s1', 'gu1')])
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: baseOptions,
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere).toBe(originalWhyHere)
  })

  it('preserves whyHere when flag on but no incident edges', () => {
    const settlement = settlementWithAnchor('s1', 'Orison Hold')
    const originalWhyHere = settlement.whyHere
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementWhyHere: true } },
      rng: createSeededRng('test'),
    })
    expect(result.settlements[0].whyHere).toBe(originalWhyHere)
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
    anchorName: { value: anchorName, confidence: 'confirmed' },
    whyHere: { value: 'original whyHere', confidence: 'confirmed' },
    tagHook: { value: tagHookValue, confidence: 'human-layer' },
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

describe('graphAwareReshape — settlementHookSynthesis integration', () => {
  it('rewrites tagHook 4th sentence when settlementHookSynthesis flag on + spine edge exists', () => {
    const tagHookValue = 'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.'
    const settlement = settlementWithTagHook('s1', 'Settlement-1', tagHookValue)
    const edge = makeContestsEdge('s1', 'f1', 'Route Authority')
    const graph = graphWithEdgesAndSpine([edge], [edge.id])
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementHookSynthesis: true } },
      rng: createSeededRng('hook-test'),
    })
    expect(result.settlements[0].tagHook.value).toContain('standoff with Route Authority')
    expect(result.settlements[0].tagHook.value).not.toContain('decides who has leverage')
    expect(result.settlements[0].tagHook.confidence).toBe('inferred')
  })

  it('combines whyHere + settlementHookSynthesis flags independently', () => {
    const tagHookValue = 'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.'
    const settlement = {
      id: 's1',
      anchorName: { value: 'Orison Hold', confidence: 'confirmed' },
      whyHere: { value: 'original whyHere', confidence: 'confirmed' },
      tagHook: { value: tagHookValue, confidence: 'human-layer' },
    } as unknown as Settlement

    const depEdge = makeDependsOnEdge('s1', 'gu1')
    const contestsEdge = makeContestsEdge('s1', 'f1', 'Route Authority')
    const graph = graphWithEdgesAndSpine([depEdge, contestsEdge], [contestsEdge.id])

    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: { ...baseOptions, graphAware: { settlementWhyHere: true, settlementHookSynthesis: true } },
      rng: createSeededRng('combined-test'),
    })
    expect(result.settlements[0].whyHere.value).toContain('Orison Hold')
    expect(result.settlements[0].whyHere.value).toContain('chiral ice belt')
    expect(result.settlements[0].tagHook.value).toContain('standoff with Route Authority')
    expect(result.settlements[0].tagHook.value).not.toContain('decides who has leverage')
  })

  it('preserves tagHook when settlementHookSynthesis flag is off', () => {
    const tagHookValue = 'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.'
    const settlement = settlementWithTagHook('s1', 'Settlement-1', tagHookValue)
    const edge = makeContestsEdge('s1', 'f1', 'Route Authority')
    const graph = graphWithEdgesAndSpine([edge], [edge.id])
    const originalTagHook = settlement.tagHook
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: graph,
      options: baseOptions,
      rng: createSeededRng('hook-off-test'),
    })
    expect(result.settlements[0].tagHook).toBe(originalTagHook)
  })

  it('preserves tagHook when flag on but no eligible spine edge', () => {
    const tagHookValue = 'Sentence one. Pressure sentence. Privately, secret. Control of the function decides who has leverage.'
    const settlement = settlementWithTagHook('s1', 'Settlement-1', tagHookValue)
    const originalTagHook = settlement.tagHook
    const result = graphAwareReshape({
      settlements: [settlement],
      phenomena: [],
      relationshipGraph: emptyGraph(),
      options: { ...baseOptions, graphAware: { settlementHookSynthesis: true } },
      rng: createSeededRng('hook-no-edge-test'),
    })
    expect(result.settlements[0].tagHook).toBe(originalTagHook)
  })
})
