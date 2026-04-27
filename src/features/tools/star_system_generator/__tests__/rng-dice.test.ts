import { describe, expect, it } from 'vitest'
import { d100, d66, pickTable, rollDice } from '../lib/generator/dice'
import { createSeededRng } from '../lib/generator/rng'

describe('seeded RNG and dice helpers', () => {
  it('replays the same random sequence for the same seed', () => {
    const first = createSeededRng('7f3a9c2e')
    const second = createSeededRng('7f3a9c2e')

    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next())
    )
  })

  it('keeps dice rolls inside expected ranges', () => {
    const rng = createSeededRng('dice-test')

    for (let i = 0; i < 100; i++) {
      expect(d100(rng)).toBeGreaterThanOrEqual(1)
      expect(d100(rng)).toBeLessThanOrEqual(100)
      expect(d66(rng)).toBeGreaterThanOrEqual(11)
      expect(d66(rng)).toBeLessThanOrEqual(66)
      expect(rollDice(rng, 2, 6)).toBeGreaterThanOrEqual(2)
      expect(rollDice(rng, 2, 6)).toBeLessThanOrEqual(12)
    }
  })

  it('selects ranged table entries', () => {
    const rng = createSeededRng('table-test')

    expect(
      pickTable(rng, 7, [
        { min: 1, max: 5, value: 'low' },
        { min: 6, max: 10, value: 'high' },
      ])
    ).toBe('high')
  })
})
