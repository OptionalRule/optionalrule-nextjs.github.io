import { describe, expect, it } from 'vitest'
import { crisisTruthPairs, hiddenTruths, settlementCrises } from '../data/settlements'
import { selectCoherentHiddenTruth } from '../settlementCoherence'
import type { SeededRng } from '../rng'

function stubRng(values: readonly number[]): { rng: SeededRng; calls: () => number } {
  let i = 0
  const next = (): number => {
    const v = values[Math.min(i, values.length - 1)]
    i += 1
    return v
  }
  const rng: SeededRng = {
    seed: 'stub', next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: p => next() < p,
    fork: () => rng,
  }
  return { rng, calls: () => i }
}

describe('crisisTruthPairs data', () => {
  it('has at least 40 pairs', () => {
    expect(crisisTruthPairs.length).toBeGreaterThanOrEqual(40)
  })

  it('references only crises that exist in the crises pool', () => {
    const crises = new Set(settlementCrises)
    for (const pair of crisisTruthPairs) {
      expect(crises.has(pair.crisis), `unknown crisis "${pair.crisis}"`).toBe(true)
    }
  })

  it('references only truths that exist in the hiddenTruths pool', () => {
    const truths = new Set(hiddenTruths)
    for (const pair of crisisTruthPairs) {
      expect(pair.truths.length).toBeGreaterThan(0)
      for (const truth of pair.truths) {
        expect(truths.has(truth), `unknown truth "${truth}"`).toBe(true)
      }
    }
  })

  it('has no duplicate crisis entries', () => {
    const seen = new Set(crisisTruthPairs.map(p => p.crisis))
    expect(seen.size).toBe(crisisTruthPairs.length)
  })
})

describe('selectCoherentHiddenTruth', () => {
  const pairedCrisis = crisisTruthPairs[0].crisis
  const pairedTruths = crisisTruthPairs[0].truths

  it('draws a paired truth when the coherence chance passes', () => {
    const { rng, calls } = stubRng([0.1, 0.0])
    const truth = selectCoherentHiddenTruth(pairedCrisis, rng)
    expect(pairedTruths).toContain(truth)
    expect(calls()).toBe(2)
  })

  it('draws from the full pool when the coherence chance fails', () => {
    const { rng, calls } = stubRng([0.9, 0.0])
    const truth = selectCoherentHiddenTruth(pairedCrisis, rng)
    expect(truth).toBe(hiddenTruths[0])
    expect(calls()).toBe(2)
  })

  it('draws from the full pool for an unpaired crisis with identical draw shape', () => {
    const { rng, calls } = stubRng([0.1, 0.0])
    const truth = selectCoherentHiddenTruth('a crisis that is not in the table', rng)
    expect(truth).toBe(hiddenTruths[0])
    expect(calls()).toBe(2)
  })
})
