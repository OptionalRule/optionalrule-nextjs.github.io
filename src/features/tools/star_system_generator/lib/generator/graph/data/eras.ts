// Era pool for historical-edge attachment. Lowercase, noun phrases.
// The implementer may tune entries; reviewer's bar is "10-12 entries,
// lowercase, recognizable as setting era markers, no proper-noun-only entries."
export const ERAS = [
  'the first wave',
  'the second wave',
  'the long quiet',
  'before the quarantine',
  'the early charters',
  'the great compaction',
  'the pinchdrive era',
  'the iggygate dawn',
  'the bleed years',
  'pre-collapse',
] as const

export type Era = typeof ERAS[number]

export function pickEra(rng: { next: () => number }): Era {
  const index = Math.floor(rng.next() * ERAS.length)
  return ERAS[index]
}
