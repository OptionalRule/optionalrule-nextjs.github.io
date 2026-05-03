import { describe, expect, it } from 'vitest'
import { renderSystemStory } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../types'

const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }

function emptyGraph(): SystemRelationshipGraph {
  return {
    entities: [], edges: [], spineEdgeIds: [], historicalEdgeIds: [],
    edgesByEntity: {},
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
  }
}

function makeEdge(o: Partial<RelationshipEdge> & { id: string; type: RelationshipEdge['type'] }): RelationshipEdge {
  return {
    id: o.id, type: o.type,
    subject: o.subject ?? body,
    object: o.object ?? settlement,
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

function graphWith(edges: RelationshipEdge[], spineEdgeIds: string[] = []): SystemRelationshipGraph {
  return { ...emptyGraph(), edges, spineEdgeIds }
}

describe('renderSystemStory', () => {
  it('renders an empty story for an empty graph', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story).toEqual({ spineSummary: '', body: [], hooks: [] })
  })

  it('renders a body paragraph for a single HOSTS edge', () => {
    const edge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const graph = graphWith([edge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toMatch(/Orison Hold|Nosaxa IV-b/)
    expect(story.body[0]).toMatch(/[.!?]$/)
    expect(story.body[0]).not.toContain('{')
  })

  it('produces deterministic output for the same seed', () => {
    const edge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const graph = graphWith([edge], ['h1'])
    const a = renderSystemStory(graph, createSeededRng('det'))
    const b = renderSystemStory(graph, createSeededRng('det'))
    expect(a).toEqual(b)
  })

  it('renders HOSTS in spine cluster but skips DEPENDS_ON (still stub) without crashing', () => {
    const guResource: EntityRef = { kind: 'guResource', id: 'gu1', displayName: 'chiral ice belt', layer: 'gu' }
    const hostsEdge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const dependsEdge = makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: guResource })
    const graph = graphWith([hostsEdge, dependsEdge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('test'))
    expect(story.body[0]).toContain('Hold')
    expect(story.body[0]).not.toContain('{')
  })

  it('still returns spineSummary === "" and hooks === [] in Task 7', () => {
    const edge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const graph = graphWith([edge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('test'))
    expect(story.spineSummary).toBe('')
    expect(story.hooks).toEqual([])
  })
})
