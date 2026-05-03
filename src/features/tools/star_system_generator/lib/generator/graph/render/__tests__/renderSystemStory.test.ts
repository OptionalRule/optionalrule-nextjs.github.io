import { describe, expect, it } from 'vitest'
import { renderSystemStory } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../types'

const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }

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

  it('renders multiple spine edges of different types without crashing', () => {
    const guResource: EntityRef = { kind: 'guResource', id: 'gu1', displayName: 'chiral ice belt', layer: 'gu' }
    const hostsEdge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const dependsEdge = makeEdge({ id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: guResource })
    const graph = graphWith([hostsEdge, dependsEdge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('test'))
    expect(story.body[0]).toContain('Hold')
    expect(story.body[0]).not.toContain('{')
  })

  it('renders spineSummary from the top spine edge family', () => {
    const edge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const graph = graphWith([edge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('test'))
    expect(story.spineSummary).toMatch(/Orison Hold|Nosaxa IV-b/)
    expect(story.spineSummary).toMatch(/[.!?]$/)
    expect(story.spineSummary).not.toContain('{')
    expect(story.hooks).toEqual([])
  })

  it('returns empty spineSummary when no spine edges exist', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story.spineSummary).toBe('')
  })

  it('produces hooks for contested visibility edges', () => {
    const auth: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' }
    const compact: EntityRef = { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' }
    const edge = makeEdge({ id: 'c1', type: 'CONTESTS', subject: auth, object: compact, visibility: 'contested' })
    const graph = graphWith([edge], ['c1'])
    const story = renderSystemStory(graph, createSeededRng('hooks-contested'))
    expect(story.hooks.length).toBeGreaterThanOrEqual(1)
    expect(story.hooks.length).toBeLessThanOrEqual(5)
    for (const hook of story.hooks) {
      expect(hook).not.toContain('{')
      expect(hook).toMatch(/[.!?]$/)
    }
  })

  it('returns empty hooks for an empty graph', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story.hooks).toEqual([])
  })

  it('produces deterministic hooks for the same seed', () => {
    const auth: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' }
    const compact: EntityRef = { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' }
    const edge = makeEdge({ id: 'c1', type: 'CONTESTS', subject: auth, object: compact, visibility: 'contested' })
    const graph = graphWith([edge], ['c1'])
    const a = renderSystemStory(graph, createSeededRng('hooks-det'))
    const b = renderSystemStory(graph, createSeededRng('hooks-det'))
    expect(a.hooks).toEqual(b.hooks)
  })

  it('routes hidden HIDES_FROM edges into hooks, never body', () => {
    const settlementEntity: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Pale Choir Communion', layer: 'human' }
    const hiddenEdge = makeEdge({
      id: 'h1', type: 'HIDES_FROM',
      subject: settlementEntity, object: faction,
      visibility: 'hidden',
    })
    const graph = graphWith([hiddenEdge], [])
    const story = renderSystemStory(graph, createSeededRng('hidden-test'))
    for (const para of story.body) {
      expect(para).not.toContain('Pale Choir Communion')
    }
    expect(story.hooks.some(h => h.includes('Pale Choir Communion'))).toBe(true)
  })

  it('caps hooks at 5 even when many eligible edges exist', () => {
    const factions: EntityRef[] = Array.from({ length: 10 }, (_, i) => ({
      kind: 'namedFaction', id: `f${i}`, displayName: `Faction ${i}`, layer: 'human',
    }))
    const edges: RelationshipEdge[] = []
    for (let i = 0; i < 9; i += 2) {
      edges.push(makeEdge({
        id: `c${i}`, type: 'CONTESTS',
        subject: factions[i], object: factions[i + 1],
        visibility: 'contested',
      }))
    }
    const graph = graphWith(edges, [])
    const story = renderSystemStory(graph, createSeededRng('hooks-cap'))
    expect(story.hooks.length).toBeLessThanOrEqual(5)
  })

  it('weaves linked historical bridge clause into spineSummary', () => {
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Helion Debt Synod', layer: 'human' }
    const controlsEdge = makeEdge({
      id: 'c1', type: 'CONTROLS', subject: faction, object: settlement,
    })
    const foundedByEdge = makeEdge({
      id: 'h1', type: 'FOUNDED_BY', subject: faction, object: settlement,
      era: 'historical',
      approxEra: 'in the second wave',
      summary: 'Helion Debt Synod founded Orison Hold in the second wave.',
      consequenceEdgeIds: ['c1'],
    })
    const graph = graphWith([controlsEdge, foundedByEdge], ['c1'])
    const story = renderSystemStory(graph, createSeededRng('weave-test'))

    expect(story.spineSummary).toContain('the second wave')
    expect(story.spineSummary).toContain('Orison Hold')
    expect(story.spineSummary).toContain('writes the rules')
    expect(story.spineSummary).not.toContain('{')
    expect(story.spineSummary).toMatch(/[.!?]$/)
  })

  it('falls back to Phase 4 spineSummary when no historical edge is linked', () => {
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Helion Debt Synod', layer: 'human' }
    const controlsEdge = makeEdge({
      id: 'c1', type: 'CONTROLS', subject: faction, object: settlement,
    })
    const graph = graphWith([controlsEdge], ['c1'])
    const story = renderSystemStory(graph, createSeededRng('no-history-test'))

    expect(story.spineSummary).toContain('writes the rules')
    expect(story.spineSummary).toContain('Helion Debt Synod')
    expect(story.spineSummary).toContain('Orison Hold')
    expect(story.spineSummary).not.toContain('the second wave')
    expect(story.spineSummary).not.toContain(',')
    expect(story.spineSummary).not.toContain('{')
  })

  it('falls back to plain spineSummary when family has empty historicalBridge', () => {
    const hostsEdge = makeEdge({ id: 'h1', type: 'HOSTS', subject: body, object: settlement })
    const histEdge = makeEdge({
      id: 'hist1', type: 'BETRAYED', subject: body, object: settlement,
      era: 'historical', approxEra: 'in the long quiet',
      summary: 'fictional', consequenceEdgeIds: ['h1'],
    })
    const graph = graphWith([hostsEdge, histEdge], ['h1'])
    const story = renderSystemStory(graph, createSeededRng('hosts-defensive'))

    expect(story.spineSummary).not.toContain('in the long quiet')
    expect(story.spineSummary.length).toBeGreaterThan(0)
    expect(story.spineSummary).toContain('Orison Hold')
    expect(story.spineSummary).not.toContain('{')
  })

  it('produces deterministic spineSummary with linked historical bridge', () => {
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Helion Debt Synod', layer: 'human' }
    const controlsEdge = makeEdge({
      id: 'c1', type: 'CONTROLS', subject: faction, object: settlement,
    })
    const foundedByEdge = makeEdge({
      id: 'h1', type: 'FOUNDED_BY', subject: faction, object: settlement,
      era: 'historical',
      approxEra: 'in the second wave',
      summary: 'Helion Debt Synod founded Orison Hold in the second wave.',
      consequenceEdgeIds: ['c1'],
    })
    const graph = graphWith([controlsEdge, foundedByEdge], ['c1'])
    const a = renderSystemStory(graph, createSeededRng('weave-det'))
    const b = renderSystemStory(graph, createSeededRng('weave-det'))
    expect(a.spineSummary).toEqual(b.spineSummary)
  })

  it('produces a meaningfully longer spineSummary when bridge is woven in', () => {
    const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Helion Debt Synod', layer: 'human' }

    const controlsEdgeA = makeEdge({
      id: 'c1', type: 'CONTROLS', subject: faction, object: settlement,
    })
    const graphWithoutBridge = graphWith([controlsEdgeA], ['c1'])
    const storyWithout = renderSystemStory(graphWithoutBridge, createSeededRng('len-without'))

    const controlsEdgeB = makeEdge({
      id: 'c1', type: 'CONTROLS', subject: faction, object: settlement,
    })
    const foundedByEdge = makeEdge({
      id: 'h1', type: 'FOUNDED_BY', subject: faction, object: settlement,
      era: 'historical',
      approxEra: 'in the second wave',
      summary: 'Helion Debt Synod founded Orison Hold in the second wave.',
      consequenceEdgeIds: ['c1'],
    })
    const graphWithBridge = graphWith([controlsEdgeB, foundedByEdge], ['c1'])
    const storyWith = renderSystemStory(graphWithBridge, createSeededRng('len-with'))

    expect(storyWith.spineSummary.length).toBeGreaterThan(storyWithout.spineSummary.length + 30)
  })
})
