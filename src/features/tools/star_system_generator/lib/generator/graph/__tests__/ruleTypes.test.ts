import { describe, expect, it } from 'vitest'
import { stableHashString, CONFIDENCE_RANK, mintEdgeId } from '../rules/ruleTypes'

describe('stableHashString', () => {
  it('produces the same hash for identical input', () => {
    expect(stableHashString('hello')).toBe(stableHashString('hello'))
  })

  it('produces different hashes for different input', () => {
    expect(stableHashString('hello')).not.toBe(stableHashString('hellp'))
  })

  it('returns a non-negative integer', () => {
    const h = stableHashString('any-string-at-all')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
  })

  it('handles empty string deterministically', () => {
    expect(stableHashString('')).toBe(stableHashString(''))
    expect(typeof stableHashString('')).toBe('number')
  })
})

describe('CONFIDENCE_RANK', () => {
  it('orders most-confident first, least-confident last', () => {
    expect(CONFIDENCE_RANK.indexOf('confirmed'))
      .toBeLessThan(CONFIDENCE_RANK.indexOf('derived'))
    expect(CONFIDENCE_RANK.indexOf('derived'))
      .toBeLessThan(CONFIDENCE_RANK.indexOf('human-layer'))
    expect(CONFIDENCE_RANK.indexOf('human-layer'))
      .toBeLessThan(CONFIDENCE_RANK.indexOf('gu-layer'))
    expect(CONFIDENCE_RANK.indexOf('gu-layer'))
      .toBeLessThan(CONFIDENCE_RANK.indexOf('inferred'))
  })

  it('contains all 5 Confidence values', () => {
    expect(CONFIDENCE_RANK.length).toBe(5)
  })
})

describe('mintEdgeId', () => {
  it('produces a stable id from rule.id + subject.id + object.id', () => {
    const id = mintEdgeId('HOSTS:body-settlement', 'body-1', 'settlement-1')
    expect(id).toBe('HOSTS:body-settlement--body-1--settlement-1')
  })

  it('appends a hash suffix when qualifier is provided', () => {
    const a = mintEdgeId('CONTESTS:foo', 's1', 's2', 'over-the-quota')
    const b = mintEdgeId('CONTESTS:foo', 's1', 's2', 'over-the-quota')
    const c = mintEdgeId('CONTESTS:foo', 's1', 's2', 'something-else')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toContain('CONTESTS:foo--s1--s2--')
  })
})
