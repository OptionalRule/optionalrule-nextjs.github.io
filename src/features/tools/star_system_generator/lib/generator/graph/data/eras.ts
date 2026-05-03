// Era pool for historical-edge attachment. Each entry is a self-contained
// adjunct phrase ("in the first wave" / "before the quarantine") so it can
// be substituted into a clause without a hanging preposition. Reviewer's bar
// is "10-12 entries, lowercase, recognizable as setting era markers,
// preposition-self-contained, no proper-noun-only entries."
export const ERAS = [
  'in the first wave',
  'in the second wave',
  'in the long quiet',
  'before the quarantine',
  'in the early charters',
  'in the great compaction',
  'in the pinchdrive era',
  'in the iggygate dawn',
  'in the bleed years',
  'before the collapse',
] as const

export type Era = typeof ERAS[number]

export function pickEra(rng: { next: () => number }): Era {
  const index = Math.floor(rng.next() * ERAS.length)
  return ERAS[index]
}
