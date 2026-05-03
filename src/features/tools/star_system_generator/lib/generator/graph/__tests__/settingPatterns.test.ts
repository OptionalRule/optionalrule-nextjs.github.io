import { describe, expect, it } from 'vitest'
import {
  RESOURCE_KEYWORDS,
  CRISIS_DESTABILIZE_KEYWORDS,
  CRISIS_DEPENDENCY_KEYWORDS,
  CRISIS_CONTEST_KEYWORDS,
  INTERDICTION_KEYWORDS,
  WITNESS_KEYWORDS,
  CONTRADICTION_KEYWORDS,
  CONTROL_DOMAINS,
  matchesAny,
  sharedDomains,
  containsWord,
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

describe('INTERDICTION_KEYWORDS', () => {
  it('includes the gardener-interdiction theme keywords', () => {
    expect(INTERDICTION_KEYWORDS).toContain('gardener')
    expect(INTERDICTION_KEYWORDS).toContain('sol-interdiction')
    expect(INTERDICTION_KEYWORDS).toContain('sealed')
  })
})

describe('WITNESS_KEYWORDS', () => {
  it('includes "last witness" and era markers', () => {
    expect(WITNESS_KEYWORDS).toContain('last witness')
    expect(WITNESS_KEYWORDS).toContain('first wave')
    expect(WITNESS_KEYWORDS).toContain('archive')
  })
})

describe('CONTRADICTION_KEYWORDS', () => {
  it('includes "edited records" theme markers', () => {
    expect(CONTRADICTION_KEYWORDS).toContain('edited')
    expect(CONTRADICTION_KEYWORDS).toContain('falsified')
    expect(CONTRADICTION_KEYWORDS).toContain('discrepancy')
  })
})

describe('CONTROL_DOMAINS', () => {
  it('includes route/compliance/interdiction control axes', () => {
    expect(CONTROL_DOMAINS).toContain('route')
    expect(CONTROL_DOMAINS).toContain('compliance')
    expect(CONTROL_DOMAINS).toContain('gardener-interdiction')
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

describe('containsWord', () => {
  it('matches a standalone word case-insensitively', () => {
    expect(containsWord('Trade house', 'trade')).toBe(true)
    expect(containsWord('Trade House', 'TRADE')).toBe(true)
  })

  it('does not match a substring inside a larger word', () => {
    expect(containsWord('Warden of the Hall', 'war')).toBe(false)
    expect(containsWord('warehouse district', 'war')).toBe(false)
  })

  it('returns false on empty input', () => {
    expect(containsWord('', 'anything')).toBe(false)
    expect(containsWord('text', '')).toBe(false)
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
