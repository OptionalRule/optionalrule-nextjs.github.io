import { describe, it, expect } from 'vitest'
import { buildSeedParams } from '../seedUrl'
import type { GenerationOptions } from '../../types'

const defaults: GenerationOptions = {
  seed: 'abc123',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('buildSeedParams', () => {
  it('emits only the seed when all options are default', () => {
    expect(buildSeedParams(defaults).toString()).toBe('seed=abc123')
  })

  it('includes only non-default options', () => {
    const params = buildSeedParams({
      ...defaults,
      gu: 'fracture',
      settlements: 'crowded',
    })
    expect(params.get('seed')).toBe('abc123')
    expect(params.get('gu')).toBe('fracture')
    expect(params.get('settlements')).toBe('crowded')
    expect(params.has('distribution')).toBe(false)
    expect(params.has('tone')).toBe(false)
  })

  it('percent-encodes a derived companion seed and round-trips it', () => {
    const params = buildSeedParams({ ...defaults, seed: 'abc123:c1' })
    expect(params.toString()).toContain('seed=abc123%3Ac1')
    expect(new URLSearchParams(params.toString()).get('seed')).toBe('abc123:c1')
  })
})
