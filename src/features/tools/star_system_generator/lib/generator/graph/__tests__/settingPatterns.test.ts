import { describe, expect, it } from 'vitest'
import {
  RESOURCE_KEYWORDS,
  CRISIS_DESTABILIZE_KEYWORDS,
  CRISIS_DEPENDENCY_KEYWORDS,
  CRISIS_CONTEST_KEYWORDS,
  matchesAny,
  sharedDomains,
} from '../rules/settingPatterns'

describe('keyword tables', () => {
  it('RESOURCE_KEYWORDS includes the canonical resource families', () => {
    expect(RESOURCE_KEYWORDS).toContain('chiral')
    expect(RESOURCE_KEYWORDS).toContain('volatile')
    expect(RESOURCE_KEYWORDS).toContain('bleed')
  })

  it('CRISIS_DESTABILIZE_KEYWORDS includes physical-disruption signals', () => {
    expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('flare')
    expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('radiation')
    expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('bleed')
    expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('metric')
    expect(CRISIS_DESTABILIZE_KEYWORDS).toContain('iggygate')
  })

  it('CRISIS_DEPENDENCY_KEYWORDS names resource-disruption signals', () => {
    expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('water')
    expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('chiral')
    expect(CRISIS_DEPENDENCY_KEYWORDS).toContain('volatile')
  })

  it('CRISIS_CONTEST_KEYWORDS names rival-claim signals', () => {
    expect(CRISIS_CONTEST_KEYWORDS).toContain('strike')
    expect(CRISIS_CONTEST_KEYWORDS).toContain('coup')
    expect(CRISIS_CONTEST_KEYWORDS).toContain('crackdown')
    expect(CRISIS_CONTEST_KEYWORDS).toContain('seizes')
  })
})

describe('matchesAny', () => {
  it('returns true when text contains at least one keyword (case-insensitive)', () => {
    expect(matchesAny('Bleed node changed course', ['bleed', 'metric'])).toBe(true)
    expect(matchesAny('BLEED storm', ['bleed'])).toBe(true)
  })

  it('returns false when no keyword is present', () => {
    expect(matchesAny('Routine harvest cycle', ['bleed', 'metric'])).toBe(false)
  })

  it('returns false on empty input', () => {
    expect(matchesAny('', ['anything'])).toBe(false)
    expect(matchesAny('text', [])).toBe(false)
  })
})

describe('sharedDomains', () => {
  it('returns the intersection of two domain arrays', () => {
    expect(sharedDomains(['trade', 'labor'], ['labor', 'science'])).toEqual(['labor'])
  })

  it('preserves order from the first array', () => {
    expect(sharedDomains(['a', 'b', 'c'], ['c', 'a'])).toEqual(['a', 'c'])
  })

  it('returns empty when no overlap', () => {
    expect(sharedDomains(['a'], ['b'])).toEqual([])
  })
})
