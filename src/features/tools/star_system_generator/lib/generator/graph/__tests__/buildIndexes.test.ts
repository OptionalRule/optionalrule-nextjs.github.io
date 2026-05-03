import { describe, expect, it } from 'vitest'
import { buildEdgeIndexes } from '../buildIndexes'
import type { RelationshipEdge } from '../types'

function makeEdge(o: Partial<RelationshipEdge>): RelationshipEdge {
  return {
    id: o.id ?? 'e',
    type: o.type ?? 'HOSTS',
    subject: o.subject ?? { kind: 'body', id: 'b1', displayName: 'Body 1', layer: 'physical' },
    object: o.object ?? { kind: 'settlement', id: 's1', displayName: 'Settlement 1', layer: 'human' },
    visibility: 'public',
    confidence: 'derived',
    groundingFactIds: [],
    era: 'present',
    weight: 0.5,
    ...o,
  }
}

describe('buildEdgeIndexes', () => {
  it('groups edge ids by subject and object entity ids', () => {
    const e1 = makeEdge({ id: 'e1' })
    const indexes = buildEdgeIndexes([e1])
    expect(indexes.edgesByEntity['b1']).toEqual(['e1'])
    expect(indexes.edgesByEntity['s1']).toEqual(['e1'])
  })

  it('groups edge ids by type', () => {
    const e1 = makeEdge({ id: 'e1', type: 'HOSTS' })
    const e2 = makeEdge({ id: 'e2', type: 'CONTESTS' })
    const indexes = buildEdgeIndexes([e1, e2])
    expect(indexes.edgesByType.HOSTS).toEqual(['e1'])
    expect(indexes.edgesByType.CONTESTS).toEqual(['e2'])
    expect(indexes.edgesByType.DEPENDS_ON).toEqual([])
  })

  it('initializes all 12 edgesByType keys to empty arrays', () => {
    const indexes = buildEdgeIndexes([])
    const keys = ['HOSTS', 'CONTROLS', 'DEPENDS_ON', 'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
      'CONTRADICTS', 'WITNESSES', 'HIDES_FROM', 'FOUNDED_BY', 'BETRAYED', 'DISPLACED'] as const
    for (const k of keys) {
      expect(indexes.edgesByType[k]).toEqual([])
    }
  })

  it('preserves edge order (insertion order from input)', () => {
    const e1 = makeEdge({ id: 'e1', subject: { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' } })
    const e2 = makeEdge({ id: 'e2', subject: { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' } })
    const indexes = buildEdgeIndexes([e1, e2])
    expect(indexes.edgesByEntity['b1']).toEqual(['e1', 'e2'])
  })

  it('handles edges with same subject and object (self-loop) — both refs map to the edge', () => {
    const ref = { kind: 'body', id: 'b1', displayName: 'B1', layer: 'physical' as const }
    const edge = makeEdge({ id: 'e1', subject: ref, object: ref })
    const indexes = buildEdgeIndexes([edge])
    expect(indexes.edgesByEntity['b1']).toEqual(['e1'])
  })
})
