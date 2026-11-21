import type { NarrativeDomain } from './domains'
import { uniqueStrings } from './uniqueStrings'

export type NarrativeDomainClassifier = (value: string) => NarrativeDomain[]

export function classifyNarrativeDomainsV2(value: string): NarrativeDomain[] {
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

const TERRAFORM_FORMS = ['terraform', 'terraforming', 'terraformer', 'terraformed']
const RATION_FORMS = ['ration', 'rationing', 'rationed']

const V3_DOMAIN_RULES: ReadonlyArray<readonly [readonly string[], readonly NarrativeDomain[]]> = [
  [['navy', 'militia', 'military', 'mercenary', 'weapon', 'weaponized', 'weaponry', 'war', 'defense', 'basing', 'blockade', 'casualty'], ['war']],
  [['trade', 'traded', 'trader', 'customs', 'freeport', 'shipyard', 'depot', 'resource', 'ore', 'mine', 'mined', 'miner', 'extraction', 'concession', 'debt', 'bank', 'banking', 'fuel', 'refueling', 'tax', 'taxed', 'shipment', 'salvage', 'salvaged'], ['trade']],
  [['intelligence', 'erased', 'deleted', 'falsified', 'censored', 'secret', 'secretly', 'black site', 'hidden', 'sealed', 'sabotage', 'forged', 'impostor'], ['espionage', 'information-integrity']],
  [['survey', 'surveyed', 'surveyor', 'research', 'researcher', 'science', 'biosafety', 'medical', 'microbial', 'biosphere', 'ecology', ...TERRAFORM_FORMS, 'lab', 'laboratory', 'laboratories', 'academic'], ['science']],
  [['biosphere', 'microbial', 'ecology', 'contamination', 'quarantine', 'quarantined', 'chiral', 'chirality', ...TERRAFORM_FORMS], ['ecology']],
  [['medical', 'medicine', 'clinic', 'clinical', 'triage', 'exposure', 'neurological', 'vestibular', 'treatment', 'quarantine ward', 'chirality stock'], ['medicine']],
  [[...TERRAFORM_FORMS, 'climate', 'mirror', 'volatile import', 'garden dome', 'failed garden', 'greenhouse', 'biosphere project'], ['terraforming']],
  [['worker', 'labor', 'laborer', 'strike', 'striker', 'strikebreaker', 'draft', 'drafted', ...RATION_FORMS, 'life-support', 'forced', 'crew'], ['labor']],
  [['life-support', 'repair', 'repaired', 'shipyard', 'power', 'powered', 'radiator', 'maintenance', 'spare', 'parts', 'heat rejection', 'shield', 'shielded', 'shielding'], ['infrastructure']],
  [['election', 'authority', 'council', 'democracy', 'magistrate', 'govern', 'governance', 'government', 'governor', 'governing', 'governed', 'succession', 'autonomy', 'charter', 'chartered'], ['governance']],
  [['law', 'lawful', 'lawsuit', 'outlaw', 'legal', 'legally', 'illegal', 'illegally', 'court', 'courtroom', 'claim', 'claimed', 'claimant', 'title', 'liability', 'jurisdiction', 'evidence', 'docket', 'compliance'], ['law', 'information-integrity']],
  [['religious', 'cult', 'commune', 'gardener', 'sol'], ['religion']],
  [['gardener', 'sol-interdiction', 'interdiction', 'exclusion picket', 'compliance office', 'sealed sol'], ['gardener-interdiction']],
  [['pirate', 'criminal', 'criminalize', 'criminalizes', 'criminalized', 'smuggler', 'cartel', 'racket', 'black market'], ['crime']],
  [['refugee', 'exile', 'exiled', 'resettlement', 'evacuation', 'ark'], ['migration']],
  [['first-wave', 'ruin', 'ruined', 'remnant', 'inheritance', 'archive', 'archived', 'salvage title', 'old'], ['archaeology']],
  [['ai', 'narrow-ai', 'automation', 'simulation', 'root credentials', 'memory'], ['ai']],
  [['disaster', 'accident', 'breach', 'breached', 'cascade', 'storm', 'failure', 'hazard', 'hazardous', 'radiation', 'misjump', 'misjumped'], ['disaster']],
  [['flare', 'coronal', 'eclipse', 'stellar', 'radiation storm', 'white-dwarf', 'brown dwarf', 'periastron'], ['stellar-events']],
  [[...RATION_FORMS, 'festival', 'public', 'publicly', 'school', 'market', 'funeral', 'civilian', 'colony'], ['public-life', 'daily-life']],
  [['route', 'routed', 'iggygate', 'pinch', 'pinchdrive', 'gate', 'gateway', 'transit', 'corridor', 'anchor', 'anchorage', 'anchoring', 'anchored', 'reachability', 'survey', 'surveyed', 'surveyor', 'scout', 'scouted', 'scouting', 'chart', 'charted', 'beacon'], ['exploration', 'trade']],
  [['route weather', 'safe window', 'bleed-window', 'metric weather', 'pinch forecast', 'stormbound', 'schedule failure', 'calibration scar', 'moving node'], ['route-weather']],
]

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function withPlural(term: string): string {
  return `${escapeRegExp(term)}${/(?:s|x|z|ch|sh)$/.test(term) ? '(?:es)?' : 's?'}`
}

const V3_COMPILED_RULES: ReadonlyArray<readonly [RegExp, readonly NarrativeDomain[]]> = V3_DOMAIN_RULES.map(([terms, domains]) => [
  new RegExp(`\\b(?:${terms.map(withPlural).join('|')})\\b`),
  domains,
])

export function classifyNarrativeDomainsV3(value: string): NarrativeDomain[] {
  const text = value.toLowerCase()
  const domains = V3_COMPILED_RULES.flatMap(([pattern, ruleDomains]) => (pattern.test(text) ? [...ruleDomains] : []))
  return uniqueStrings(domains.length ? domains : ['public-life'])
}
