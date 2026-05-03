import { describe, expect, it } from 'vitest'
import {
  reshapeSlot,
  capitalizeForPosition,
  guardDoubledNoun,
} from '../grammarSafety'

describe('reshapeSlot', () => {
  it('strips terminal punctuation', () => {
    expect(reshapeSlot('the dispute.', 'nounPhrase')).toBe('dispute')
    expect(reshapeSlot('a claim,', 'nounPhrase')).toBe('claim')
    expect(reshapeSlot('the route;', 'nounPhrase')).toBe('route')
  })

  it('removes leading articles for nounPhrase', () => {
    expect(reshapeSlot('the route', 'nounPhrase')).toBe('route')
    expect(reshapeSlot('a settlement', 'nounPhrase')).toBe('settlement')
    expect(reshapeSlot('an outpost', 'nounPhrase')).toBe('outpost')
  })

  it('does NOT remove leading articles for properNoun', () => {
    expect(reshapeSlot('Route Authority', 'properNoun')).toBe('Route Authority')
  })

  it('strips terminal punctuation for properNoun', () => {
    expect(reshapeSlot('Orison Hold.', 'properNoun')).toBe('Orison Hold')
  })

  it('trims whitespace', () => {
    expect(reshapeSlot('  Orison Hold  ', 'properNoun')).toBe('Orison Hold')
  })

  it('is idempotent', () => {
    const once = reshapeSlot('the dispute,', 'nounPhrase')
    const twice = reshapeSlot(once, 'nounPhrase')
    expect(once).toBe(twice)
  })

  it('handles empty string', () => {
    expect(reshapeSlot('', 'nounPhrase')).toBe('')
    expect(reshapeSlot('', 'properNoun')).toBe('')
  })
})

describe('capitalizeForPosition', () => {
  it('capitalizes first letter at sentence-start', () => {
    expect(capitalizeForPosition('orison hold', 'sentence-start')).toBe('Orison hold')
  })

  it('does not change letters at mid-clause', () => {
    expect(capitalizeForPosition('the route', 'mid-clause')).toBe('the route')
  })

  it('preserves proper-noun capitalization at any position', () => {
    expect(capitalizeForPosition('Orison Hold', 'mid-clause')).toBe('Orison Hold')
    expect(capitalizeForPosition('Orison Hold', 'sentence-start')).toBe('Orison Hold')
  })

  it('handles empty string', () => {
    expect(capitalizeForPosition('', 'sentence-start')).toBe('')
  })
})

describe('guardDoubledNoun', () => {
  it('strips doubled "evidence" pattern', () => {
    expect(guardDoubledNoun('the evidence is evidence of corrupted bleed metrics'))
      .toBe('the evidence of corrupted bleed metrics')
  })

  it('strips doubled "records" pattern', () => {
    expect(guardDoubledNoun('the records contradict records of the same event'))
      .toBe('the records of the same event')
  })

  it('leaves non-doubled prose alone', () => {
    const intact = 'the Route Authority controls the Iggygate'
    expect(guardDoubledNoun(intact)).toBe(intact)
  })

  it('handles empty string', () => {
    expect(guardDoubledNoun('')).toBe('')
  })
})
