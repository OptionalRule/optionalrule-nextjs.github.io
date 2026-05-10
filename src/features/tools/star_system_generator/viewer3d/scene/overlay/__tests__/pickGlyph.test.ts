import { describe, expect, it } from 'vitest'
import {
  isAiRun,
  pickSettlementGlyph,
  pickSettlementStatus,
  populationTier,
} from '../pickGlyph'
import type {
  SettlementHabitationPattern,
  SettlementPopulation,
} from '../../../../types'

describe('populationTier', () => {
  it.each<[SettlementPopulation, 'small' | 'medium' | 'large']>([
    ['Minimal (<5)', 'small'],
    ['1-20', 'small'],
    ['21-100', 'small'],
    ['101-1,000', 'small'],
    ['Unknown', 'small'],
    ['1,001-10,000', 'medium'],
    ['10,001-100,000', 'medium'],
    ['100,001-1 million', 'large'],
    ['1-10 million', 'large'],
    ['10+ million', 'large'],
  ])('buckets %s to %s', (value, expected) => {
    expect(populationTier(value)).toBe(expected)
  })
})

describe('pickSettlementGlyph', () => {
  describe('surface family', () => {
    it.each<[SettlementHabitationPattern, SettlementPopulation, string]>([
      ['Sealed arcology', 'Minimal (<5)', 'A3'],
      ['Sealed arcology', '10+ million', 'A3'],
      ['Underground city', '1,001-10,000', 'A3'],
      ['Surface settlement', '10+ million', 'A1'],
      ['Surface settlement', '21-100', 'A2'],
      ['Sky platform', '1-10 million', 'A1'],
      ['Sky platform', '1,001-10,000', 'A2'],
      ['Tethered tower', '100,001-1 million', 'A1'],
      ['Tethered tower', 'Unknown', 'A2'],
    ])('%s @ %s → %s', (pattern, pop, expected) => {
      expect(pickSettlementGlyph(pattern, pop)).toBe(expected)
    })
  })

  describe('belt/rock family', () => {
    it.each<[SettlementHabitationPattern]>([
      ['Asteroid or belt base'],
      ['Hollow asteroid'],
      ['Belt cluster'],
      ['Moon base'],
    ])('%s → BR', (pattern) => {
      expect(pickSettlementGlyph(pattern, '21-100')).toBe('BR')
      expect(pickSettlementGlyph(pattern, '1-10 million')).toBe('BR')
    })
  })

  describe('drift family', () => {
    it.each<[SettlementHabitationPattern]>([
      ['Distributed swarm'],
      ['Drift colony'],
      ['Generation ship'],
      ['Deep-space platform'],
    ])('%s → DR', (pattern) => {
      expect(pickSettlementGlyph(pattern, '21-100')).toBe('DR')
      expect(pickSettlementGlyph(pattern, '10+ million')).toBe('DR')
    })
  })

  describe('orbital family', () => {
    it('Ring station / O\'Neill cylinder large → B2', () => {
      expect(pickSettlementGlyph('Ring station', '10+ million')).toBe('B2')
      expect(pickSettlementGlyph("O'Neill cylinder", '1-10 million')).toBe('B2')
    })

    it('Ring station / O\'Neill cylinder smaller → B5', () => {
      expect(pickSettlementGlyph('Ring station', '1,001-10,000')).toBe('B5')
      expect(pickSettlementGlyph("O'Neill cylinder", 'Minimal (<5)')).toBe('B5')
    })

    it('Hub complex tiered → B3 / B1 / B5', () => {
      expect(pickSettlementGlyph('Hub complex', '10+ million')).toBe('B3')
      expect(pickSettlementGlyph('Hub complex', '1,001-10,000')).toBe('B1')
      expect(pickSettlementGlyph('Hub complex', '21-100')).toBe('B5')
    })

    it('Modular island station → B4 large, B5 else', () => {
      expect(pickSettlementGlyph('Modular island station', '1-10 million')).toBe('B4')
      expect(pickSettlementGlyph('Modular island station', '101-1,000')).toBe('B5')
    })

    it('Orbital station tiered → B1 / B5 / B6', () => {
      expect(pickSettlementGlyph('Orbital station', '10+ million')).toBe('B1')
      expect(pickSettlementGlyph('Orbital station', '10,001-100,000')).toBe('B5')
      expect(pickSettlementGlyph('Orbital station', '21-100')).toBe('B6')
    })
  })

  describe('special and fallthrough', () => {
    it('legacy Gate or route node → GT', () => {
      expect(pickSettlementGlyph('Gate or route node', 'Unknown')).toBe('GT')
    })

    it('Abandoned + Automated patterns fall through to safe B7 fallback', () => {
      expect(pickSettlementGlyph('Abandoned', 'Unknown')).toBe('B7')
      expect(pickSettlementGlyph('Automated', 'Unknown')).toBe('B7')
    })
  })
})

describe('pickSettlementStatus', () => {
  it('Abandoned pattern → abandoned', () => {
    expect(pickSettlementStatus('Abandoned', '')).toBe('abandoned')
  })

  it('Automated pattern → automated', () => {
    expect(pickSettlementStatus('Automated', '')).toBe('automated')
  })

  it('AI-run aiSituation text → automated', () => {
    expect(pickSettlementStatus('Surface settlement', 'fully autonomous mining facility')).toBe('automated')
    expect(pickSettlementStatus('Orbital station', 'no crew, machine-tended')).toBe('automated')
    expect(pickSettlementStatus('Surface settlement', 'AI-run refinery')).toBe('automated')
  })

  it('default → active', () => {
    expect(pickSettlementStatus('Surface settlement', 'Permanent civic AI assists residents')).toBe('active')
    expect(pickSettlementStatus('Hub complex', '')).toBe('active')
  })
})

describe('isAiRun', () => {
  it.each<[string, boolean]>([
    ['fully autonomous research lab', true],
    ['no crew', true],
    ['ai-run habitat', true],
    ['ai run habitat', true],
    ['machine-tended', true],
    ['machine tended', true],
    ['Automated freighter dock', true],
    ['Civic AI offers cultural counsel', false],
    ['', false],
    ['Light AI presence in commerce district', false],
  ])('%s → %s', (input, expected) => {
    expect(isAiRun(input)).toBe(expected)
  })
})
