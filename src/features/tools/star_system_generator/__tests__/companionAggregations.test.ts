import { describe, expect, it } from 'vitest'
import { aggregatedCounts, formatSplitCount } from '../lib/companionAggregations'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'agg-test',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'crowded',
}

function findOrbitalSiblingSeed(max = 800): string {
  for (let i = 0; i < max; i++) {
    const seed = `agg-seek-${i}`
    const sys = generateSystem({ ...baseOptions, seed })
    if (sys.companions[0]?.mode === 'orbital-sibling') return seed
  }
  throw new Error('No orbital-sibling seed found')
}

describe('companion aggregations', () => {
  it('sums primary + companion settlements/gates/ruins', () => {
    const seed = findOrbitalSiblingSeed()
    const sys = generateSystem({ ...baseOptions, seed })
    const counts = aggregatedCounts(sys)
    expect(counts.settlements.total).toBe(sys.settlements.length + sys.companions[0].subSystem!.settlements.length)
    expect(counts.gates.total).toBe(sys.gates.length + sys.companions[0].subSystem!.gates.length)
    expect(counts.ruins.total).toBe(sys.ruins.length + sys.companions[0].subSystem!.ruins.length)
  })

  it('formats split count strings as "N total (P primary, C companion)" only when companion is non-zero', () => {
    expect(formatSplitCount(3, 0)).toBe('3')
    expect(formatSplitCount(3, 2)).toBe('5 (3 primary, 2 companion)')
    expect(formatSplitCount(0, 2)).toBe('2 (0 primary, 2 companion)')
  })
})
