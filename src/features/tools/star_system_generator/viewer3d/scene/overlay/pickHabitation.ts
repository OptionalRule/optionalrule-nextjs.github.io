import type { BodyPopulation } from '../../../types'
import type { GlyphId, GlyphStatus } from './types'

export interface HabitationGlyphSpec {
  glyph: GlyphId
  status: GlyphStatus
  dominant: boolean
  terraformRing: boolean
}

const DOMINANT_BANDS: ReadonlySet<BodyPopulation['band']> = new Set([
  'established',
  'populous',
  'dense-world',
])

const ACTIVE_BANDS: ReadonlySet<BodyPopulation['band']> = new Set([
  'outpost',
  'frontier',
  'colony',
  'established',
  'populous',
  'dense-world',
])

export function pickHabitationGlyph(population: BodyPopulation): HabitationGlyphSpec | null {
  if (!ACTIVE_BANDS.has(population.band)) return null
  return {
    glyph: 'HB',
    status: 'active',
    dominant: DOMINANT_BANDS.has(population.band),
    terraformRing: population.terraformState === 'in-progress',
  }
}
