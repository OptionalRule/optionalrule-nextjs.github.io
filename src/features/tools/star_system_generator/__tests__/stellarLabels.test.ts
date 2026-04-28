import { describe, expect, it } from 'vitest'
import { formatStellarClass, stellarClassNote } from '../lib/stellarLabels'

describe('stellarLabels', () => {
  it('describes ordinary stellar classes with source-table labels', () => {
    expect(formatStellarClass('G star')).toBe('G-type star')
    expect(stellarClassNote('G star')).toContain('Solar-like')
    expect(stellarClassNote('K star')).toContain('Stable, long-lived star')
  })

  it('preserves remnant and substellar distinctions', () => {
    expect(formatStellarClass('White dwarf/remnant')).toBe('White dwarf/remnant')
    expect(formatStellarClass('Brown dwarf/substellar primary')).toBe('Brown dwarf/substellar primary')
  })
})
