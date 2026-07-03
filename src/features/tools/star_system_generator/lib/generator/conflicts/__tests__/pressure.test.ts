import { describe, expect, it } from 'vitest'
import { derivePressure, PRESSURE_POOLS } from '../pressure'
import { createSeededRng } from '../../rng'
import { EDGE_TYPES } from '../../graph/types'
import type { EntityRef, RelationshipEdge } from '../../graph/types'

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const resource: EntityRef = { kind: 'guResource', id: 'gu-1', displayName: 'Chiral ice belt', layer: 'gu' }

const contested: RelationshipEdge = {
  id: 'e1', type: 'CONTESTS', subject: factionA, object: factionB,
  visibility: 'public', confidence: 'inferred', groundingFactIds: [], era: 'present', weight: 1,
}

describe('derivePressure', () => {
  it('has a pool of at least 5 phrases for every edge type', () => {
    for (const type of EDGE_TYPES) {
      expect(PRESSURE_POOLS[type].length, `pool for ${type}`).toBeGreaterThanOrEqual(5)
    }
  })

  it('only uses {stake} and {subject} placeholders', () => {
    for (const type of EDGE_TYPES) {
      for (const phrase of PRESSURE_POOLS[type]) {
        const slots = [...phrase.matchAll(/\{(\w+)\}/g)].map(m => m[1])
        for (const slot of slots) expect(['stake', 'subject']).toContain(slot)
      }
    }
  })

  it('is deterministic and returns a non-empty phrase', () => {
    const a = derivePressure(contested, resource, createSeededRng('p'))
    const b = derivePressure(contested, resource, createSeededRng('p'))
    expect(a).toBe(b)
    expect(a.length).toBeGreaterThan(0)
  })
})
