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
})
