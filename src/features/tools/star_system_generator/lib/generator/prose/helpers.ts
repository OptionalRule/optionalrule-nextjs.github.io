export function lowerFirst(value: string): string {
  if (!value) return value
  if (/^(AI|GU|Sol|Iggygate|Pinchdrive)\b/.test(value)) return value
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`
}

export function sentenceFragment(value: string): string {
  if (/^(AI|GU|Sol|Iggygate|Pinchdrive)\b/.test(value)) return value
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(value)) return value.toLowerCase()
  return lowerFirst(value)
}

export function sentenceStart(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function stripTerminalPunctuation(value: string): string {
  return value.replace(/[.!?]+$/g, '')
}

export function smoothTechnicalPhrase(value: string): string {
  return value
    .replace(/\brefinery\/gate\/AI\b/gi, 'the refinery, gate, or AI systems')
    .replace(/\bmetric\/radiation\b/gi, 'metric and radiation')
    .replace(/\bshielding\/chiral\b/gi, 'shielding and chiral')
    .replace(/\bSol\/Gardener\b/g, 'Sol or Gardener')
}

export function definiteNounPhrase(value: string): string {
  const phrase = smoothTechnicalPhrase(stripTerminalPunctuation(sentenceFragment(value)).trim())
  if (!phrase) return phrase
  if (/^(the|a|an|access to|control of|custody of|safe transit|public|root)\b/i.test(phrase)) return phrase
  return `the ${phrase}`
}

const SITE_HOOK_CONNECTORS = /\s+(?:where|whose|with|running|still|sealed|listed|stocked|rebuilt|pumping|stalled|breached|stretching|redrawn|backed|patrolled|accepting|working|logged|kept|drifting|repeated|drawing|that|run\s+by|on\s+a\b|under\s+a\b|one\s+combination|two\s+names|the\s+pumps)\b/i

export function siteLeadNoun(site: string): string {
  if (!site) return site
  const match = site.match(SITE_HOOK_CONNECTORS)
  if (!match || match.index === undefined) return site
  return site.slice(0, match.index).trim()
}

export function normalizeNarrativeText(value: string): string {
  const normalized = value
    .replace(/\s+/g, ' ')
    .replace(/\bThe unrecognized local crews\b/g, 'Unrecognized local crews')
    .replace(/\bThe officially falsified records\b/g, 'Officially falsified records')
    .replace(/\bthe the\b/gi, 'the')
    .trim()

  if (!normalized) return normalized
  const capitalized = `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  return capitalized.endsWith('.') || capitalized.endsWith('?') || capitalized.endsWith('!')
    ? capitalized
    : `${capitalized}.`
}
