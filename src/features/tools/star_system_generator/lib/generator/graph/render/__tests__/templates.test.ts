import { describe, expect, it } from 'vitest'
import { templateFor } from '../templates'
import { EDGE_TYPES } from '../../types'
import { renderSystemStory } from '../renderSystemStory'
import { resolveSlots } from '../slotResolver'
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

describe('CONTESTS family', () => {
  const authority: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' }
  const compact: EntityRef = { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' }

  function makeContestsGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'c1', type: 'CONTESTS', subject: authority, object: compact,
      qualifier: 'the quota over the ice belt',
      visibility: 'public', confidence: 'inferred',
      groundingFactIds: [], era: 'present', weight: 0.7,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['c1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: ['c1'], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing both faction names, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeContestsGraph(), createSeededRng('contests-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Route Authority')
    expect(story.body[0]).toContain('Kestrel Free Compact')
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('DESTABILIZES family', () => {
  const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'flare-amplified bleed season', layer: 'physical' }
  const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }

  function makeDestabilizesGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'd1', type: 'DESTABILIZES', subject: phenomenon, object: settlement,
      qualifier: undefined, visibility: 'public', confidence: 'inferred',
      groundingFactIds: [], era: 'present', weight: 0.6,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['d1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: ['d1'], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing both endpoints, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeDestabilizesGraph(), createSeededRng('destabilizes-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Orison Hold')
    expect(story.body[0]).toMatch(/bleed season|flare-amplified/i)
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('CONTROLS family', () => {
  const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' }
  const body: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }

  function makeControlsGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'cc1', type: 'CONTROLS', subject: faction, object: body,
      qualifier: 'route', visibility: 'public', confidence: 'derived',
      groundingFactIds: [], era: 'present', weight: 0.6,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['cc1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: ['cc1'], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence with subject + object, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeControlsGraph(), createSeededRng('controls-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Route Authority')
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('SUPPRESSES family', () => {
  const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Pale Choir Communion', layer: 'human' }
  const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'sealed bleed-corridor', layer: 'gu' }

  function makeSuppressesGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'sp1', type: 'SUPPRESSES', subject: faction, object: phenomenon,
      qualifier: undefined, visibility: 'contested', confidence: 'derived',
      groundingFactIds: [], era: 'present', weight: 0.5,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['sp1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: ['sp1'],
        CONTRADICTS: [], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing subject + object, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeSuppressesGraph(), createSeededRng('suppresses-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Pale Choir Communion')
    expect(story.body[0]).toMatch(/sealed|bleed-corridor/)
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('CONTRADICTS family', () => {
  const ruin: EntityRef = { kind: 'ruin', id: 'r1', displayName: 'Mira Vault', layer: 'physical' }
  const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }

  function makeContradictsGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'cd1', type: 'CONTRADICTS', subject: ruin, object: settlement,
      qualifier: 'history', visibility: 'contested', confidence: 'derived',
      groundingFactIds: [], era: 'present', weight: 0.5,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['cd1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: ['cd1'], WITNESSES: [], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing subject + object, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeContradictsGraph(), createSeededRng('contradicts-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Mira Vault')
    expect(story.body[0]).toContain('Orison Hold')
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('WITNESSES family', () => {
  const settlement: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
  const ruin: EntityRef = { kind: 'ruin', id: 'r1', displayName: 'Mira Vault', layer: 'physical' }

  function makeWitnessesGraph(): SystemRelationshipGraph {
    const edge: RelationshipEdge = {
      id: 'wt1', type: 'WITNESSES', subject: settlement, object: ruin,
      qualifier: undefined, visibility: 'public', confidence: 'derived',
      groundingFactIds: [], era: 'present', weight: 0.45,
    }
    return {
      entities: [], edges: [edge], spineEdgeIds: ['wt1'], historicalEdgeIds: [],
      edgesByEntity: {},
      edgesByType: {
        HOSTS: [], CONTROLS: [], DEPENDS_ON: [],
        CONTESTS: [], DESTABILIZES: [], SUPPRESSES: [],
        CONTRADICTS: [], WITNESSES: ['wt1'], HIDES_FROM: [],
        FOUNDED_BY: [], BETRAYED: [], DISPLACED: [],
      },
    }
  }

  it('renders a body sentence containing subject + object, no unresolved slots, terminal punctuation', () => {
    const story = renderSystemStory(makeWitnessesGraph(), createSeededRng('witnesses-test'))
    expect(story.body).toHaveLength(1)
    expect(story.body[0]).toContain('Orison Hold')
    expect(story.body[0]).toContain('Mira Vault')
    expect(story.body[0]).not.toContain('{')
    expect(story.body[0]).toMatch(/[.!?]$/)
  })
})

describe('FOUNDED_BY family', () => {
  it('body template renders subject + object + era as a complete sentence', () => {
    const family = templateFor('FOUNDED_BY')
    expect(family.body.length).toBeGreaterThanOrEqual(1)
    const ctx = {
      subject: { kind: 'namedFaction', id: 'f', displayName: 'Helion Debt Synod', layer: 'human' } as const,
      object: { kind: 'settlement', id: 's', displayName: 'Orison Hold', layer: 'human' } as const,
      qualifier: 'the second wave',
      edgeType: 'FOUNDED_BY' as const,
      visibility: 'public' as const,
    }
    const text = resolveSlots(family.body[0].text, ctx, family.body[0].expects)
    expect(text).toContain('Helion Debt Synod')
    expect(text).toContain('Orison Hold')
    expect(text).toContain('the second wave')
    expect(text).not.toContain('{')
    expect(text).toMatch(/[.!?]$/)
  })
})

describe('BETRAYED family', () => {
  it('body template renders subject + object + era as a complete sentence', () => {
    const family = templateFor('BETRAYED')
    expect(family.body.length).toBeGreaterThanOrEqual(1)
    const ctx = {
      subject: { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' } as const,
      object: { kind: 'namedFaction', id: 'f2', displayName: 'Kestrel Free Compact', layer: 'human' } as const,
      qualifier: 'the long quiet',
      edgeType: 'BETRAYED' as const,
      visibility: 'public' as const,
    }
    const text = resolveSlots(family.body[0].text, ctx, family.body[0].expects)
    expect(text).toContain('Route Authority')
    expect(text).toContain('Kestrel Free Compact')
    expect(text).toContain('the long quiet')
    expect(text).not.toContain('{')
    expect(text).toMatch(/[.!?]$/)
  })
})

describe('DISPLACED family', () => {
  it('body template renders subject + object (with article) + era as a complete sentence', () => {
    const family = templateFor('DISPLACED')
    expect(family.body.length).toBeGreaterThanOrEqual(1)
    const ctx = {
      subject: { kind: 'settlement', id: 's', displayName: 'Orison Hold', layer: 'human' } as const,
      object: { kind: 'guResource', id: 'gu', displayName: 'chiral ice belt', layer: 'gu' } as const,
      qualifier: 'the great compaction',
      edgeType: 'DISPLACED' as const,
      visibility: 'public' as const,
    }
    const text = resolveSlots(family.body[0].text, ctx, family.body[0].expects)
    expect(text).toContain('Orison Hold')
    expect(text).toContain('the chiral ice belt')
    expect(text).toContain('the great compaction')
    expect(text).not.toContain('{')
    expect(text).toMatch(/[.!?]$/)
  })
})
