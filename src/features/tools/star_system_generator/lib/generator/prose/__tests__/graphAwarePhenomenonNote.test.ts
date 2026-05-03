import { describe, expect, it } from 'vitest'
import { graphAwarePhenomenonNote } from '../graphAwarePhenomenonNote'
import { createSeededRng } from '../../rng'
import type { SystemPhenomenon } from '../../../../types'
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

function makeGraph(edges: RelationshipEdge[], edgesByEntity: Record<string, string[]> = {}): SystemRelationshipGraph {
  return {
    entities: [],
    edges,
    spineEdgeIds: [],
    historicalEdgeIds: [],
    edgesByEntity,
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

function makePhenomenon(id: string, fields: {
  travelEffect?: string
  surveyQuestion?: string
  conflictHook?: string
  sceneAnchor?: string
}): SystemPhenomenon {
  return {
    id,
    travelEffect: { value: fields.travelEffect ?? '', confidence: 'inferred' },
    surveyQuestion: { value: fields.surveyQuestion ?? '', confidence: 'inferred' },
    conflictHook: { value: fields.conflictHook ?? '', confidence: 'inferred' },
    sceneAnchor: { value: fields.sceneAnchor ?? '', confidence: 'inferred' },
    note: { value: 'original note', confidence: 'inferred' },
    phenomenon: { value: 'test phenomenon', confidence: 'inferred' },
  } as unknown as SystemPhenomenon
}

const fullPhenomenon = makePhenomenon('p1', {
  travelEffect: 'Drives subliminal between transits',
  surveyQuestion: 'What pulses behind the static?',
  conflictHook: 'Whoever owns the recordings owns the question.',
  sceneAnchor: 'A drift of low-amplitude blooms.',
})

const emptyGraph = makeGraph([], {})

describe('graphAwarePhenomenonNote', () => {
  it('returns prose without target name when no DESTABILIZES edge exists', () => {
    const rng = createSeededRng('p-test')
    const result = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, rng)
    expect(result).not.toBeNull()
    expect(result).toContain('Drives subliminal between transits')
    expect(result).not.toContain('Transit:')
    expect(result).not.toContain('destabilization centers on')
  })

  it('returns prose with target name when DESTABILIZES edge exists', () => {
    const phenomenon = makePhenomenon('p1', {
      travelEffect: 'Drives subliminal between transits',
      surveyQuestion: 'What pulses behind the static?',
      conflictHook: 'Whoever owns the recordings owns the question.',
      sceneAnchor: 'A drift of low-amplitude blooms.',
    })
    const pRef = makeEntityRef('p1', 'The Signal Bloom', 'phenomenon')
    const sRef = makeEntityRef('s1', 'Orison Hold', 'settlement')
    const edge = makeEdge('edge-p1-s1', 'DESTABILIZES', pRef, sRef)
    const graph = makeGraph([edge], { p1: ['edge-p1-s1'] })
    const rng = createSeededRng('p-test-2')
    const result = graphAwarePhenomenonNote(phenomenon, graph, rng)
    expect(result).not.toBeNull()
    expect(result).toContain('destabilization centers on Orison Hold')
  })

  it('returns null when all fields are empty strings', () => {
    const phenomenon = makePhenomenon('p1', {
      travelEffect: '', surveyQuestion: '', conflictHook: '', sceneAnchor: '',
    })
    const rng = createSeededRng('p-test-3')
    expect(graphAwarePhenomenonNote(phenomenon, emptyGraph, rng)).toBeNull()
  })

  it('output contains no Transit: / Question: / Hook: / Image: labels', () => {
    const rng = createSeededRng('p-labels')
    const result = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, rng)
    expect(result).not.toBeNull()
    expect(result).not.toContain('Transit:')
    expect(result).not.toContain('Question:')
    expect(result).not.toContain('Hook:')
    expect(result).not.toContain('Image:')
  })

  it('output contains no unresolved {', () => {
    const rng = createSeededRng('p-unresolved')
    const result = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, rng)
    expect(result).not.toBeNull()
    expect(result).not.toContain('{')
  })

  it('output ends with terminal punctuation', () => {
    const rng = createSeededRng('p-terminal')
    const result = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, rng)
    expect(result).not.toBeNull()
    expect(/[.!?]$/.test(result!)).toBe(true)
  })

  it('connector is deterministic per seed', () => {
    const a = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, createSeededRng('det-1'))
    const b = graphAwarePhenomenonNote(fullPhenomenon, emptyGraph, createSeededRng('det-1'))
    expect(a).toBe(b)
  })
})
