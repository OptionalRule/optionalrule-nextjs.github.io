import { describe, expect, it } from 'vitest'
import { templateFor } from '../templates'
import { EDGE_TYPES } from '../../types'
import { renderSystemStory } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../../types'

describe('templateFor', () => {
  it('returns a family for every EdgeType', () => {
    for (const t of EDGE_TYPES) {
      const family = templateFor(t)
      expect(family.edgeType).toBe(t)
      expect(Array.isArray(family.body)).toBe(true)
      expect(family.body.length).toBeGreaterThanOrEqual(1)
      expect(family.spineSummary).toBeDefined()
      expect(family.historicalBridge).toBeDefined()
      expect(Array.isArray(family.hook)).toBe(true)
    }
  })
})

describe('DEPENDS_ON family', () => {
  const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
  const guResource: EntityRef = { kind: 'guResource', id: 'gu1', displayName: 'chiral ice belt', layer: 'gu' }

  function makeDependsOnGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'd1', type: 'DEPENDS_ON', subject: settlement, object: guResource,
      qualifier: undefined, visibility: 'public', confidence: 'inferred',
      groundingFactIds: [], era: 'present', weight: 0.6,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['d1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: ['d1'],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing both endpoints, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeDependsOnGraph(), createSeededRng('depends-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Orison Hold')
    expect(story.body[0]).toContain('chiral')
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})
