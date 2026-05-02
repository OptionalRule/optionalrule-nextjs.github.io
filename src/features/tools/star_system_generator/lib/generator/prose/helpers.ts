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
