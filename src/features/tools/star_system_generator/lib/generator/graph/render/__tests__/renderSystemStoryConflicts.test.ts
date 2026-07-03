import { describe, expect, it } from 'vitest'
import { renderSystemStory } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { BuildGraphOptions, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../types'
import { EDGE_TYPES } from '../../types'
import type { Conflict } from '../../../conflicts/types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }

function edge(partial: Partial<RelationshipEdge> & Pick<RelationshipEdge, 'id' | 'type' | 'subject' | 'object'>): RelationshipEdge {
  return {
    visibility: 'public', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
    ...partial,
  }
}

function graphWith(edges: RelationshipEdge[], spineEdgeIds: string[]): SystemRelationshipGraph {
  const edgesByEntity: Record<string, string[]> = {}
  for (const e of edges) {
    for (const ref of [e.subject, e.object]) {
      edgesByEntity[ref.id] = edgesByEntity[ref.id] ?? []
      edgesByEntity[ref.id].push(e.id)
    }
  }
  const edgesByType = Object.fromEntries(EDGE_TYPES.map(t => [t, edges.filter(e => e.type === t).map(e => e.id)])) as SystemRelationshipGraph['edgesByType']
  return {
    entities: [], edges, edgesByEntity, edgesByType,
    spineEdgeIds, settlementSpineEdgeIds: [], historicalEdgeIds: [],
  }
}

const OPTIONS: BuildGraphOptions = { tone: 'balanced', gu: 'normal', distribution: 'frontier', settlements: 'normal' }

function makeConflict(edgeId: string): Conflict {
  return {
    id: `conflict-${edgeId}`,
    edgeId,
    edgeType: 'CONTESTS',
    pressure: 'there is only one stable route chart, and two charters that each name it',
    parties: [
      { ref: factionA, role: 'aggressor', stake: 'first claim on the next harvest window' },
      { ref: factionB, role: 'defender', stake: 'the margin that keeps the lights on' },
      { ref: settlement, role: 'bystander', stake: 'rationed air while the principals negotiate' },
    ],
    stakeRef: null,
    temperature: 'open',
    visibleSign: 'Recruiters from both sides work the same ration queue, one table apart.',
  }
}

function makeSharedContentConflict(edgeId: string, i: number): Conflict {
  return {
    id: `conflict-${edgeId}`,
    edgeId,
    edgeType: 'CONTESTS',
    pressure: 'there is only one stable route chart, and two charters that each name it',
    parties: [
      { ref: factionA, role: 'aggressor', stake: 'first claim on the next harvest window' },
      { ref: factionB, role: 'defender', stake: 'the margin that keeps the lights on' },
      { ref: settlement, role: 'bystander', stake: 'rationed air while the principals negotiate' },
    ],
    stakeRef: null,
    temperature: 'open',
    visibleSign: `Recruiters from both sides work the same ration queue, table ${i}.`,
  }
}

describe('renderSystemStory with conflicts', () => {
  it('renders a conflict-backed spine edge as a multi-sentence narrative naming the parties', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested' })
    const graph = graphWith([contested], ['e1'])
    const story = renderSystemStory(graph, createSeededRng('conflict-spine'), OPTIONS, [makeConflict('e1')])
    expect(story.body.length).toBeGreaterThanOrEqual(1)
    const spinePara = story.body[0]
    expect(spinePara).toContain('Kestrel Free Compact')
    expect(spinePara).toContain('Red Vane Labor Combine')
    expect(spinePara.match(/[.!?]/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(spinePara).not.toContain('{')
  })

  it('echoes the conflicts on the output', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested' })
    const graph = graphWith([contested], ['e1'])
    const conflicts = [makeConflict('e1')]
    const story = renderSystemStory(graph, createSeededRng('echo'), OPTIONS, conflicts)
    expect(story.conflicts).toEqual(conflicts)
  })

  it('never repeats a body template within a paragraph while alternatives remain', () => {
    const edges: RelationshipEdge[] = []
    for (let i = 0; i < 5; i++) {
      edges.push(edge({
        id: `d${i}`, type: 'DEPENDS_ON',
        subject: { kind: 'settlement', id: `s${i}`, displayName: `Hold ${i + 1}`, layer: 'human' },
        object: { kind: 'guResource', id: `r${i}`, displayName: `resource stream ${i + 1}`, layer: 'gu' },
      }))
    }
    const graph = graphWith(edges, edges.map(e => e.id))
    const story = renderSystemStory(graph, createSeededRng('deck-check'), OPTIONS)
    const paragraph = story.body.join(' ')
    const skeletons = new Set<string>()
    for (let i = 0; i < 5; i++) {
      const holdIdx = paragraph.indexOf(`Hold ${i + 1}`)
      expect(holdIdx).toBeGreaterThanOrEqual(0)
    }
    const sentences = paragraph.split(/(?<=[.?!])\s+/)
    for (const sentence of sentences) {
      const skeleton = sentence
        .replaceAll(/Hold \d/g, 'X')
        .replaceAll(/resource stream \d/g, 'Y')
      expect(skeletons.has(skeleton), `repeated template skeleton: "${skeleton}"`).toBe(false)
      skeletons.add(skeleton)
    }
  })

  it('works without conflicts exactly as before (optional param)', () => {
    const contested = edge({ id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested' })
    const graph = graphWith([contested], ['e1'])
    const story = renderSystemStory(graph, createSeededRng('no-conflicts'), OPTIONS)
    expect(story.spineSummary.length).toBeGreaterThan(0)
    expect(story.conflicts ?? []).toEqual([])
  })

  it('never repeats a beat template across multiple conflicts within the same system body', () => {
    const edges = ['c0', 'c1', 'c2'].map((id) =>
      edge({ id, type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested' }),
    )
    const conflicts = edges.map((e, i) => makeSharedContentConflict(e.id, i))
    const graph = graphWith(edges, edges.map((e) => e.id))
    for (let s = 0; s < 20; s++) {
      const story = renderSystemStory(graph, createSeededRng(`beat-deck-${s}`), OPTIONS, conflicts)
      const sentences = story.body.join(' ').split(/(?<=[.?!])\s+/)
      const seen = new Set<string>()
      for (const sentence of sentences) {
        expect(seen.has(sentence), `seed sweep-${s}: repeated beat template "${sentence}"`).toBe(false)
        seen.add(sentence)
      }
    }
  })

  it('produces deterministic body output across two runs with multiple conflicts sharing beat decks', () => {
    const edges = ['c0', 'c1', 'c2'].map((id) =>
      edge({ id, type: 'CONTESTS', subject: factionA, object: factionB, visibility: 'contested' }),
    )
    const conflicts = edges.map((e, i) => makeSharedContentConflict(e.id, i))
    const graph = graphWith(edges, edges.map((e) => e.id))
    const a = renderSystemStory(graph, createSeededRng('multi-conflict-det'), OPTIONS, conflicts)
    const b = renderSystemStory(graph, createSeededRng('multi-conflict-det'), OPTIONS, conflicts)
    expect(a).toEqual(b)
  })
})
