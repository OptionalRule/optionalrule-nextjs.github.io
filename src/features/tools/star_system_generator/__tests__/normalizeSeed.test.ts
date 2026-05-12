import { describe, expect, it } from 'vitest'
import { normalizeSeed } from '../lib/generator/rng'

describe('normalizeSeed colon convention', () => {
  it('preserves a :c<n> suffix', () => {
    expect(normalizeSeed('deadbeef:c1')).toBe('deadbeef:c1')
  })

  it('preserves chained suffixes', () => {
    expect(normalizeSeed('deadbeef:c1:c2')).toBe('deadbeef:c1:c2')
  })

  it('still strips other non-hex characters', () => {
    expect(normalizeSeed('dead-beef:c1!')).toBe('deadbeef:c1')
  })

  it('falls back to a random seed when input is empty or all-stripped', () => {
    expect(normalizeSeed('').length).toBeGreaterThan(0)
    expect(normalizeSeed('---').length).toBe(16)
  })

  it('falls back to a random seed when input is all colons', () => {
    const result = normalizeSeed(':::')
    expect(result).not.toBe(':::')
    expect(result.length).toBe(16)
  })

  it('falls back to a random seed when input has no hex characters', () => {
    const result = normalizeSeed('xyz:abc')
    expect(result).toBe(':abc')
  })

  it('falls back to a random seed when input has only colons after stripping', () => {
    const result = normalizeSeed('xyz:!@#')
    expect(result.length).toBe(16)
  })
})
