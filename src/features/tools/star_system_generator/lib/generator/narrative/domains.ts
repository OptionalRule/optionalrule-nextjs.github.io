import { uniqueStrings } from './uniqueStrings'

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

export function classifyNarrativeDomains(value: string): NarrativeDomain[] {
  const text = value.toLowerCase()
  const domains: NarrativeDomain[] = []

  if (/(navy|militia|military|mercenary|weapon|war|defense|basing|blockade|casualty)/.test(text)) domains.push('war')
  if (/(trade|customs|freeport|shipyard|depot|resource|ore|mine|extraction|concession|debt|bank|fuel|tax|shipment|salvage)/.test(text)) domains.push('trade')
  if (/(intelligence|erased|deleted|falsified|censored|secret|black site|hidden|sealed|sabotage|forged|impostor)/.test(text)) domains.push('espionage', 'information-integrity')
  if (/(survey|research|science|biosafety|medical|microbial|biosphere|ecology|terrafor|lab|academic)/.test(text)) domains.push('science')
  if (/(biosphere|microbial|ecology|contamination|quarantine|chiral|terraform)/.test(text)) domains.push('ecology')
  if (/(medical|medicine|clinic|triage|exposure|neurological|vestibular|treatment|quarantine ward|chirality stock)/.test(text)) domains.push('medicine')
  if (/(terraform|climate|mirror|volatile import|garden dome|failed garden|greenhouse|biosphere project)/.test(text)) domains.push('terraforming')
  if (/(worker|labor|strike|draft|ration|life-support|forced|crew)/.test(text)) domains.push('labor')
  if (/(life-support|repair|shipyard|power|radiator|maintenance|spare|parts|heat rejection|shield)/.test(text)) domains.push('infrastructure')
  if (/(election|authority|council|democracy|magistrate|govern|succession|autonomy|charter)/.test(text)) domains.push('governance')
  if (/(law|legal|court|claim|title|liability|jurisdiction|evidence|docket|compliance)/.test(text)) domains.push('law', 'information-integrity')
  if (/(religious|cult|commune|gardener|sol)/.test(text)) domains.push('religion')
  if (/(gardener|sol-interdiction|interdiction|exclusion picket|compliance office|sealed sol)/.test(text)) domains.push('gardener-interdiction')
  if (/(pirate|criminal|smuggler|cartel|racket|black market)/.test(text)) domains.push('crime')
  if (/(refugee|exile|resettlement|evacuation|ark)/.test(text)) domains.push('migration')
  if (/(first-wave|ruin|remnant|inheritance|archive|salvage title|old)/.test(text)) domains.push('archaeology')
  if (/(ai|narrow-ai|automation|simulation|root credentials|memory)/.test(text)) domains.push('ai')
  if (/(disaster|accident|breach|cascade|storm|failure|hazard|radiation|misjump)/.test(text)) domains.push('disaster')
  if (/(flare|coronal|eclipse|stellar|radiation storm|white-dwarf|brown dwarf|periastron)/.test(text)) domains.push('stellar-events')
  if (/(ration|festival|public|school|market|funeral|civilian|colony)/.test(text)) domains.push('public-life', 'daily-life')
  if (/(route|iggygate|pinch|gate|transit|corridor|anchor|reachability|survey|scout|chart|beacon)/.test(text)) domains.push('exploration', 'trade')
  if (/(route weather|safe window|bleed-window|metric weather|pinch forecast|stormbound|schedule failure|calibration scar|moving node)/.test(text)) domains.push('route-weather')

  return uniqueStrings(domains.length ? domains : ['public-life'])
}
