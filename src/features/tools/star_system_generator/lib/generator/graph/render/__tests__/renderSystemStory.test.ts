import { describe, expect, it } from 'vitest'
import { renderSystemStory } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { SystemRelationshipGraph } from '../../types'

function emptyGraph(): SystemRelationshipGraph {
  return {
    entities: [],
    edges: [],
    edgesByEntity: {},
    edgesByType: {
      HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
      CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
      CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
      FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
    },
    spineEdgeIds: [],
    historicalEdgeIds: [],
  }
}

describe('renderSystemStory (Phase 3 scaffold — empty output)', () => {
  it('returns the empty-output shape for an empty graph', () => {
    const story = renderSystemStory(emptyGraph(), createSeededRng('test'))
    expect(story).toEqual({ spineSummary: '', body: [], hooks: [] })
  })

  it('is deterministic — same graph + same seed → same story', () => {
    const a = renderSystemStory(emptyGraph(), createSeededRng('det'))
    const b = renderSystemStory(emptyGraph(), createSeededRng('det'))
    expect(a).toEqual(b)
  })
})
