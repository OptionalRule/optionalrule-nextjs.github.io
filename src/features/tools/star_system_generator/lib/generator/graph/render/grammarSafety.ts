export type SlotShape = 'properNoun' | 'nounPhrase' | 'verbPhrase' | 'clause' | 'era'

export type Position = 'sentence-start' | 'after-comma' | 'after-semicolon' | 'mid-clause'

const LEADING_ARTICLE_PATTERN = /^(?:the|a|an)\s+/i
const TRAILING_PUNCT_PATTERN = /[.,;:!?]+$/

export function reshapeSlot(value: string, shape: SlotShape): string {
  let out = value.trim().replace(TRAILING_PUNCT_PATTERN, '').trim()
  if (shape === 'nounPhrase') {
    out = out.replace(LEADING_ARTICLE_PATTERN, '')
  }
  return out
}

export function capitalizeForPosition(value: string, position: Position): string {
  if (value.length === 0) return value
  if (position !== 'sentence-start') return value
  const first = value[0]
  if (first === first.toUpperCase()) return value
  return first.toUpperCase() + value.slice(1)
}

const DOUBLED_NOUNS = ['evidence', 'records', 'logs', 'claims', 'reports'] as const

export function guardDoubledNoun(rendered: string): string {
  let out = rendered
  for (const noun of DOUBLED_NOUNS) {
    const pattern = new RegExp(`\\bthe ${noun}\\s+(\\S+)\\s+${noun}\\s+(of|that)\\b`, 'gi')
    out = out.replace(pattern, `the ${noun} $2`)
  }
  return out
}
