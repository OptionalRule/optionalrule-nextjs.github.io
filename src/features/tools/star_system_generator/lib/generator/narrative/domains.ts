export const NARRATIVE_DOMAINS = [
  'war',
  'trade',
  'espionage',
  'information-integrity',
  'science',
  'ecology',
  'medicine',
  'terraforming',
  'labor',
  'infrastructure',
  'governance',
  'law',
  'religion',
  'gardener-interdiction',
  'crime',
  'migration',
  'archaeology',
  'ai',
  'disaster',
  'stellar-events',
  'public-life',
  'daily-life',
  'exploration',
  'route-weather',
] as const

export type NarrativeDomain = (typeof NARRATIVE_DOMAINS)[number]

const NARRATIVE_DOMAIN_SET: ReadonlySet<string> = new Set(NARRATIVE_DOMAINS)

export function isNarrativeDomain(value: string): value is NarrativeDomain {
  return NARRATIVE_DOMAIN_SET.has(value)
}

const DOMAIN_WORD_PATTERNS: ReadonlyMap<NarrativeDomain, RegExp> = new Map(
  NARRATIVE_DOMAINS.map((domain) => [
    domain,
    new RegExp(`\\b${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  ]),
)

export function proseMentionsDomain(text: string, domain: NarrativeDomain): boolean {
  if (text.length === 0) return false
  return DOMAIN_WORD_PATTERNS.get(domain)?.test(text) ?? false
}

export function findDomainMentionedInProse(
  text: string,
  domains: readonly NarrativeDomain[],
): NarrativeDomain | undefined {
  return domains.find((domain) => proseMentionsDomain(text, domain))
}
