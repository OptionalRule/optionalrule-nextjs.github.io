export const RESOURCE_KEYWORDS = [
  'chiral', 'volatile', 'bleed', 'plasma', 'ice', 'pinchdrive',
  'iggygate', 'metric', 'organism', 'spore',
] as const

export const CRISIS_DESTABILIZE_KEYWORDS = [
  'bleed', 'metric', 'flare', 'radiation', 'iggygate', 'pinchdrive',
  'storm', 'cascade', 'breach', 'sabotage', 'mirror', 'dome',
] as const

export const CRISIS_DEPENDENCY_KEYWORDS = [
  'water', 'chiral', 'volatile', 'medical', 'oxygen', 'ration',
  'imported', 'stock', 'feedstock', 'tank',
] as const

export const CRISIS_CONTEST_KEYWORDS = [
  'strike', 'revolt', 'coup', 'crackdown', 'seizes', 'dispute',
  'rival', 'compliance team', 'blockade', 'embargo',
] as const

export const INTERDICTION_KEYWORDS = [
  'sol-interdiction', 'sol interdiction', 'gardener', 'sealed', 'compliance',
  'exclusion', 'interdiction', 'censored', 'redacted',
] as const

export const WITNESS_KEYWORDS = [
  'last witness', 'only witness', 'sole record', 'memory gap', 'memory gaps',
  'unrecorded', 'before the quarantine', 'first wave', 'second wave',
  'pre-collapse', 'pre-arrival', 'archive', 'archives',
] as const

export const CONTRADICTION_KEYWORDS = [
  'edited', 'falsified', 'reclassified', 'rewritten', 'altered', 'forged',
  'doctored', 'discrepancy', 'two accounts', 'conflicting', 'official version',
  'unofficial', 'unrecorded',
] as const

export const CONTROL_DOMAINS = [
  'route', 'transit', 'compliance', 'gardener-interdiction', 'authority',
  'enforcement', 'customs', 'patrol',
] as const

export function matchesAny(text: string, keywords: ReadonlyArray<string>): boolean {
  if (text.length === 0 || keywords.length === 0) return false
  const lower = text.toLowerCase()
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) return true
  }
  return false
}

export function containsWord(text: string, word: string): boolean {
  if (text.length === 0 || word.length === 0) return false
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}

export function sharedDomains(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>,
): string[] {
  const setB = new Set(b)
  const out: string[] = []
  for (const item of a) {
    if (setB.has(item)) out.push(item)
  }
  return out
}

const DOMAIN_TO_PHRASE: Record<string, string> = {
  'war': 'conflict record',
  'trade': 'trade ledger',
  'science': 'survey data',
  'ecology': 'biosphere dispute',
  'crime': 'criminal record',
  'governance': 'chain of authority',
  'route-weather': 'safe-window forecast',
  'medicine': 'medical findings',
  'religion': 'doctrinal record',
  'law': 'legal ruling',
  'labor': 'labor agreement',
  'archaeology': 'recovered-relic record',
  'exploration': 'exploration log',
  'stellar-events': 'flare record',
  'disaster': 'casualty register',
  'daily-life': 'daily record',
  'public-life': 'public record',
  'espionage': 'intelligence report',
  'gardener-interdiction': 'Gardener interdiction notice',
  'ai': 'AI testimony',
  'information-integrity': 'audit trail',
}

export function concretizeDomain(domain: string | undefined): string {
  if (!domain) return 'record'
  return DOMAIN_TO_PHRASE[domain] ?? `${domain.replace(/-/g, ' ')} record`
}
