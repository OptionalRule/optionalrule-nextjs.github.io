import type { BodyCategory } from '../../types'

const romanNumerals: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Roman numeral value must be a positive integer; received ${value}.`)
  }

  let remaining = value
  let result = ''

  for (const [arabic, roman] of romanNumerals) {
    while (remaining >= arabic) {
      result += roman
      remaining -= arabic
    }
  }

  return result
}

export function bodyDesignation(systemName: string, index: number, category: BodyCategory): string {
  const ordinal = toRomanNumeral(index + 1)

  if (category === 'belt') return `${systemName} Belt ${ordinal}`
  if (category === 'dwarf-body') return `${systemName} Dwarf ${ordinal}`
  if (category === 'rogue-captured') return `${systemName} Captive ${ordinal}`
  if (category === 'anomaly') return `${systemName} Anomaly ${ordinal}`

  return `${systemName} ${ordinal}`
}

export function moonDesignation(parentDesignation: string, index: number): string {
  return `${parentDesignation} - Moon ${toRomanNumeral(index + 1)}`
}
