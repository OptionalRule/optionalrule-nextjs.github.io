import { describe, expect, it } from 'vitest'
import { templateFor } from '../templates'
import { EDGE_TYPES } from '../../types'

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
