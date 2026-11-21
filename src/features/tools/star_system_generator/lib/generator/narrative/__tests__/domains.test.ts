import { describe, expect, it } from 'vitest'
import guData from '../../../../data/gu.json'
import narrativeData from '../../../../data/narrative.json'
import { astronomyBank } from '../../factions/banks/astronomyBank'
import { balancedBank } from '../../factions/banks/balancedBank'
import { cinematicBank } from '../../factions/banks/cinematicBank'
import { containsWord } from '../../graph/rules/settingPatterns'
import {
  findDomainMentionedInProse,
  isNarrativeDomain,
  NARRATIVE_DOMAINS,
  proseMentionsDomain,
} from '../domains'

const EXPECTED_DOMAINS = [
  'war', 'trade', 'espionage', 'information-integrity', 'science', 'ecology', 'medicine', 'terraforming',
  'labor', 'infrastructure', 'governance', 'law', 'religion', 'gardener-interdiction', 'crime', 'migration',
  'archaeology', 'ai', 'disaster', 'stellar-events', 'public-life', 'daily-life', 'exploration', 'route-weather',
]

describe('narrative domain vocabulary', () => {
  it('is the closed set the classifier can return, in classifier order', () => {
    expect([...NARRATIVE_DOMAINS]).toEqual(EXPECTED_DOMAINS)
  })

  it('recognises only vocabulary members', () => {
    expect(isNarrativeDomain('trade')).toBe(true)
    expect(isNarrativeDomain('route')).toBe(false)
    expect(isNarrativeDomain('')).toBe(false)
  })

  it('accepts every faction bank domain', () => {
    for (const bank of [astronomyBank, balancedBank, cinematicBank]) {
      for (const key of Object.keys(bank.kindByDomain)) expect(isNarrativeDomain(key), key).toBe(true)
      for (const seed of bank.seedFactions) {
        for (const domain of seed.domains) expect(isNarrativeDomain(domain), domain).toBe(true)
      }
    }
  })

  it('accepts every GU domain tag in the data files', () => {
    for (const table of Object.values(guData.domainTags)) {
      for (const domains of Object.values(table)) {
        for (const domain of domains) expect(isNarrativeDomain(domain), domain).toBe(true)
      }
    }
  })

  it('matches the narrative data vocabulary used by the data audit', () => {
    expect(new Set(Object.keys(narrativeData.narrativeDomains))).toEqual(new Set(NARRATIVE_DOMAINS))
  })
})

describe('domain words in prose', () => {
  const samples = [
    '',
    'War council holds the port',
    'Postwar trade compact',
    'TRADE-guild magistrates under law',
    'information-integrity board',
    'information integrity board',
    'AI-run ration office',
    'Raid crews and daily-life wardens',
    'gardener-interdiction picket; route-weather office',
    'Lawful stellar-events watch',
  ]

  it('matches exactly what containsWord matches for every domain', () => {
    for (const text of samples) {
      for (const domain of NARRATIVE_DOMAINS) {
        expect(proseMentionsDomain(text, domain)).toBe(containsWord(text, domain))
      }
    }
  })

  it('returns the first listed domain found in the prose', () => {
    expect(findDomainMentionedInProse('Trade and war council', ['war', 'trade'])).toBe('war')
    expect(findDomainMentionedInProse('Trade and war council', ['trade', 'war'])).toBe('trade')
    expect(findDomainMentionedInProse('Postwar council', ['war', 'law'])).toBeUndefined()
  })
})
