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
})
