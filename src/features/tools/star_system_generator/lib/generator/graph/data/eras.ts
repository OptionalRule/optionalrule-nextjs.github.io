import type { GeneratorTone } from '../../../../types'

// Era pool for historical-edge attachment. Each entry is a self-contained
// adjunct phrase ("in the first wave" / "before the quarantine") so it can
// be substituted into a clause without a hanging preposition. Reviewer's bar
// is "8-12 entries per pool, lowercase, recognizable as setting era markers,
// preposition-self-contained, no proper-noun-only entries."
//
// Phase C splits the era pool into 3 tone-conditioned sub-pools.
// `balanced` preserves the existing voice-neutral pool exactly (same order)
// so balanced-tone seeds remain byte-identical for historical bridges.
// `cinematic` carries dramatic, character-anchored time markers
// (betrayals, oaths, fall-of-houses) so historical bridges read in voice.
// `astronomy` carries clinical, instrument-anchored time markers
// (cycles, calibrations, surveys) so historical bridges read in voice.

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

const CINEMATIC_ERAS = [
  'in the betrayal years',
  'after the crown fell',
  'in the silent decade',
  'before the salt-debt',
  'in the reckoning era',
  'after the last vow',
  'in the broken-oath era',
  'before the witness died',
  'in the funeral years',
  'after the keep was sealed',
] as const

const ASTRONOMY_ERAS = [
  'in the third pulse cycle',
  'between the calibration runs',
  'in the Bonn-Tycho census',
  'after Cycle 7',
  'during the spectral survey',
  'in the long-baseline era',
  'before the catalog was sealed',
  'after the eighth pulse',
  'in the first ephemeris pass',
  'before the photometric reset',
] as const

const ERAS_BY_TONE: Record<GeneratorTone, readonly string[]> = {
  balanced: ERAS,
  cinematic: CINEMATIC_ERAS,
  astronomy: ASTRONOMY_ERAS,
}

export type Era = string

export function pickEra(
  rng: { next: () => number },
  tone: GeneratorTone = 'balanced',
): Era {
  const pool = ERAS_BY_TONE[tone]
  const index = Math.floor(rng.next() * pool.length)
  return pool[index]
}

export function erasForTone(tone: GeneratorTone): readonly string[] {
  return ERAS_BY_TONE[tone]
}
