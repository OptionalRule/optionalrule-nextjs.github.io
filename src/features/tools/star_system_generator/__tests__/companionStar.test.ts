import { describe, expect, it } from 'vitest'
import { createSeededRng } from '../lib/generator/rng'
import { generateCompanionStar } from '../lib/generator/companionStar'
import type { Star } from '../types'

function fact<T>(value: T): { value: T; confidence: 'derived' } {
  return { value, confidence: 'derived' }
}

const gPrimary: Star = {
  id: 'primary-test',
  name: fact('Test Primary'),
  spectralType: fact('G star'),
  massSolar: fact(1.0),
  luminositySolar: fact(1.0),
  ageState: fact('Main sequence, mature'),
  metallicity: fact('Solar'),
  activity: fact('Quiet'),
  activityRoll: fact(7),
  activityModifiers: [],
}

describe('generateCompanionStar', () => {
  it('returns a deterministic Star for a given seed string', () => {
    const a = generateCompanionStar(createSeededRng('seed-A:companion-1'), gPrimary, 'Test Primary B')
    const b = generateCompanionStar(createSeededRng('seed-A:companion-1'), gPrimary, 'Test Primary B')
    expect(a).toEqual(b)
  })

  it('produces a companion mass less than or equal to the primary mass for G primaries', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']) {
      const c = generateCompanionStar(createSeededRng(`${seed}:companion-1`), gPrimary, 'Test')
      expect(c.massSolar.value).toBeLessThanOrEqual(gPrimary.massSolar.value)
    }
  })

  it('inherits the primary age state (coeval)', () => {
    const c = generateCompanionStar(createSeededRng('coeval'), gPrimary, 'Test')
    expect(c.ageState.value).toBe(gPrimary.ageState.value)
  })

  it('uses the provided name', () => {
    const c = generateCompanionStar(createSeededRng('named'), gPrimary, 'Sirius B')
    expect(c.name.value).toBe('Sirius B')
  })
})
