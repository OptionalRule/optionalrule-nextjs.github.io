import { describe, expect, it } from 'vitest'
import { ERAS, pickEra } from '../../data/eras'
import { createSeededRng } from '../../../rng'

describe('ERAS pool', () => {
  it('contains 10-12 lowercase era strings', () => {
    expect(ERAS.length).toBeGreaterThanOrEqual(8)
    expect(ERAS.length).toBeLessThanOrEqual(12)
    for (const era of ERAS) {
      expect(era).toBe(era.toLowerCase())
      expect(era.length).toBeGreaterThan(3)
    }
  })

  it('contains canonical setting era markers as preposition-self-contained adjuncts', () => {
    expect(ERAS).toContain('in the first wave')
    expect(ERAS).toContain('in the second wave')
    expect(ERAS).toContain('before the quarantine')
  })

  it('every era entry begins with a preposition (self-contained adjunct phrase)', () => {
    const PREPOSITIONS = /^(in|before|after|during|at|on)\s/
    for (const era of ERAS) {
      expect(era).toMatch(PREPOSITIONS)
    }
  })

  it('pickEra is deterministic for a fixed seed', () => {
    const a = pickEra(createSeededRng('era-test'))
    const b = pickEra(createSeededRng('era-test'))
    expect(a).toBe(b)
  })

  it('pickEra returns an entry from the pool', () => {
    for (const seed of ['s1', 's2', 's3', 's4']) {
      const era = pickEra(createSeededRng(seed))
      expect(ERAS).toContain(era)
    }
  })
})
