import { describe, expect, it } from 'vitest'
import { scoreCandidates, isNamedEntity } from '../score'
import type { EntityRef, RelationshipEdge } from '../types'

const settlementRef: EntityRef = { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' }
const bodyRef: EntityRef = { kind: 'body', id: 'b1', displayName: 'Nosaxa IV-b', layer: 'physical' }
const factionRef: EntityRef = { kind: 'namedFaction', id: 'faction-route-authority', displayName: 'Route Authority', layer: 'human' }
const guResourceRef: EntityRef = { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' }
const starRef: EntityRef = { kind: 'star', id: 'star-primary', displayName: 'G2V', layer: 'physical' }

function makeEdge(overrides: Partial<RelationshipEdge>): RelationshipEdge {
  return {
    id: overrides.id ?? 'edge-x',
    type: overrides.type ?? 'HOSTS',
    subject: overrides.subject ?? bodyRef,
    object: overrides.object ?? settlementRef,
    visibility: 'public',
    confidence: 'derived',
    groundingFactIds: [],
    era: 'present',
    weight: 0.5,
    ...overrides,
  }
}

describe('isNamedEntity', () => {
  it('returns true for settlements with proper-noun displayName', () => {
    expect(isNamedEntity(settlementRef)).toBe(true)
  })
  it('returns true for namedFactions', () => {
    expect(isNamedEntity(factionRef)).toBe(true)
  })
  it('returns true for bodies with proper-noun displayName', () => {
    expect(isNamedEntity(bodyRef)).toBe(true)
  })
  it('returns false for stars (spectral type, not a proper name)', () => {
    expect(isNamedEntity(starRef)).toBe(false)
  })
  it('returns false for guResource', () => {
    expect(isNamedEntity(guResourceRef)).toBe(false)
  })
})

describe('scoreCandidates', () => {
  it('applies the base weight when no bonuses fire', () => {
    const otherStar: EntityRef = { kind: 'star', id: 'star-secondary', displayName: 'M5V', layer: 'physical' }
    const e1 = makeEdge({ id: 'first', subject: starRef, object: otherStar, weight: 0.5 })
    const e2 = makeEdge({ id: 'second', subject: otherStar, object: starRef, weight: 0.4 })
    const scored = scoreCandidates([e1, e2])
    const second = scored.find(s => s.edge.id === 'second')
    expect(second).toBeDefined()
    expect(second!.bonuses.novelty).toBe(0)
    expect(second!.bonuses.crossLayer).toBe(0)
    expect(second!.bonuses.namedEntity).toBe(0)
    expect(second!.score).toBeCloseTo(0.4)
  })

  it('adds +0.1 for novelty when this is the first edge of its type', () => {
    const otherBody: EntityRef = { kind: 'body', id: 'b2', displayName: 'Vellix III', layer: 'physical' }
    const otherSettlement: EntityRef = { kind: 'settlement', id: 's2', displayName: 'Quiet Reach', layer: 'human' }
    const e1 = makeEdge({ id: 'e1', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.5 })
    const e2 = makeEdge({ id: 'e2', type: 'HOSTS', subject: otherBody, object: otherSettlement, weight: 0.5 })
    const [s1, s2] = scoreCandidates([e1, e2])
    const novel = s1.bonuses.novelty + s2.bonuses.novelty
    expect(novel).toBeCloseTo(0.1)
  })

  it('adds +0.15 cross-layer bonus when subject and object differ in layer', () => {
    const edge = makeEdge({ subject: bodyRef, object: settlementRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.crossLayer).toBeCloseTo(0.15)
  })

  it('does NOT add cross-layer bonus when subject and object share a layer', () => {
    const edge = makeEdge({ subject: settlementRef, object: factionRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.crossLayer).toBe(0)
  })

  it('adds +0.1 named-entity bonus when both subject and object are named', () => {
    const edge = makeEdge({ subject: settlementRef, object: factionRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.namedEntity).toBeCloseTo(0.1)
  })

  it('does NOT add named-entity bonus when only one side is named', () => {
    const edge = makeEdge({ subject: bodyRef, object: guResourceRef })
    const [scored] = scoreCandidates([edge])
    expect(scored.bonuses.namedEntity).toBe(0)
  })

  it('sorts by score descending; ties broken by stable hash of edge.id ascending', () => {
    const e1 = makeEdge({ id: 'aaa', weight: 0.5 })
    const e2 = makeEdge({ id: 'bbb', weight: 0.7 })
    const e3 = makeEdge({ id: 'ccc', weight: 0.5 })
    const scored = scoreCandidates([e1, e2, e3])
    expect(scored[0].edge.id).toBe('bbb')
  })

  it('collapses duplicate (subject, object, type) edges keeping the highest-scored', () => {
    const e1 = makeEdge({ id: 'low', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.3 })
    const e2 = makeEdge({ id: 'high', type: 'HOSTS', subject: bodyRef, object: settlementRef, weight: 0.7 })
    const scored = scoreCandidates([e1, e2])
    expect(scored).toHaveLength(1)
    expect(scored[0].edge.id).toBe('high')
  })
})
