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

export function matchesAny(text: string, keywords: ReadonlyArray<string>): boolean {
  if (text.length === 0 || keywords.length === 0) return false
  const lower = text.toLowerCase()
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) return true
  }
  return false
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
