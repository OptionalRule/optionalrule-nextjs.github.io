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
