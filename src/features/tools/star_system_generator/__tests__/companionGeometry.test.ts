import { describe, expect, it } from 'vitest'
import { separationToBucketAu, companionBucketKeys } from '../lib/generator/companionGeometry'

describe('separationToBucketAu', () => {
  it('returns numeric AU for each defined keyword bucket', () => {
    for (const key of companionBucketKeys) {
      const au = separationToBucketAu(key)
      expect(typeof au).toBe('number')
      expect(au).toBeGreaterThan(0)
    }
  })

  it('matches keywords case-insensitively from a separation string', () => {
    expect(separationToBucketAu('Close binary')).toBe(separationToBucketAu('close'))
    expect(separationToBucketAu('Wide binary')).toBe(separationToBucketAu('wide'))
  })

  it('falls back to moderate for unknown separation strings', () => {
    expect(separationToBucketAu('made up label')).toBe(separationToBucketAu('moderate'))
  })

  it('orders buckets close < near < moderate < wide < distant', () => {
    expect(separationToBucketAu('close')).toBeLessThan(separationToBucketAu('near'))
    expect(separationToBucketAu('near')).toBeLessThan(separationToBucketAu('moderate'))
    expect(separationToBucketAu('moderate')).toBeLessThan(separationToBucketAu('wide'))
    expect(separationToBucketAu('wide')).toBeLessThan(separationToBucketAu('distant'))
  })

  it('matches every separation string produced by binarySeparationProfile', () => {
    const expectations: Array<[string, number]> = [
      ['Contact / near-contact', separationToBucketAu('near')],
      ['Close binary', separationToBucketAu('close')],
      ['Tight binary', separationToBucketAu('tight')],
      ['Moderate binary', separationToBucketAu('moderate')],
      ['Wide binary', separationToBucketAu('wide')],
      ['Very wide', separationToBucketAu('wide')],
      ['Hierarchical triple', separationToBucketAu('triple')],
    ]
    for (const [sep, expected] of expectations) {
      expect(separationToBucketAu(sep)).toBe(expected)
    }
  })

  it('Tight binary maps to a tighter AU than Moderate binary', () => {
    expect(separationToBucketAu('Tight binary')).toBeLessThan(separationToBucketAu('Moderate binary'))
  })

  it('Hierarchical triple inner pair maps to a tight AU', () => {
    expect(separationToBucketAu('Hierarchical triple')).toBeLessThanOrEqual(separationToBucketAu('Near binary'))
  })
})
