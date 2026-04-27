import { describe, expect, it } from 'vitest'
import { formatStellarClass, stellarClassNote } from '../lib/stellarLabels'

describe('stellarLabels', () => {
  it('describes ordinary dwarf classes as main-sequence stars for display', () => {
    expect(formatStellarClass('G dwarf')).toBe('G-type main-sequence star')
    expect(stellarClassNote('G dwarf')).toContain('Sun-like')
    expect(stellarClassNote('G dwarf')).toContain('normal luminosity class')
  })

  it('preserves remnant and substellar distinctions', () => {
    expect(formatStellarClass('White dwarf')).toBe('White dwarf remnant')
    expect(formatStellarClass('Brown dwarf')).toBe('Brown dwarf / substellar primary')
  })
})
