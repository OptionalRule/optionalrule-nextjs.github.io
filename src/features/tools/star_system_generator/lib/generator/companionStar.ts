import type { Star } from '../../types'
import { fact } from './index'
import type { SeededRng } from './rng'
import { twoD6 } from './dice'

const SMALLER_SPECTRAL_PROGRESSION = [
  'O/B/A bright star',
  'F star',
  'G star',
  'K star',
  'M dwarf',
  'Brown dwarf/substellar primary',
] as const

function smallerOrEqualSpectral(primarySpectral: string): string {
  const idx = SMALLER_SPECTRAL_PROGRESSION.indexOf(primarySpectral as typeof SMALLER_SPECTRAL_PROGRESSION[number])
  if (idx < 0) return 'M dwarf'
  if (idx >= SMALLER_SPECTRAL_PROGRESSION.length - 1) return primarySpectral
  return SMALLER_SPECTRAL_PROGRESSION[idx + 1]
}

function pickCompanionSpectral(rng: SeededRng, primarySpectral: string): string {
  const roll = twoD6(rng)
  if (roll <= 4) {
    const idx = SMALLER_SPECTRAL_PROGRESSION.indexOf(primarySpectral as typeof SMALLER_SPECTRAL_PROGRESSION[number])
    if (idx < 0) return 'M dwarf'
    return SMALLER_SPECTRAL_PROGRESSION[Math.min(SMALLER_SPECTRAL_PROGRESSION.length - 1, idx + 2)]
  }
  if (roll <= 9) return smallerOrEqualSpectral(primarySpectral)
  return primarySpectral
}

function massForSpectral(spectral: string, rng: SeededRng): number {
  switch (spectral) {
    case 'O/B/A bright star': return 5 + (rng.next() * 10)
    case 'F star': return 1.05 + (rng.next() * 0.35)
    case 'G star': return 0.80 + (rng.next() * 0.30)
    case 'K star': return 0.50 + (rng.next() * 0.30)
    case 'M dwarf': return 0.10 + (rng.next() * 0.35)
    case 'Brown dwarf/substellar primary': return 0.05 + (rng.next() * 0.05)
    default: return 0.30
  }
}

function luminosityForMass(massSolar: number): number {
  if (massSolar < 0.45) return massSolar ** 2.3
  if (massSolar < 2.0) return massSolar ** 4
  return massSolar ** 3.5
}

export function generateCompanionStar(rng: SeededRng, primary: Star, name: string): Star {
  const spectral = pickCompanionSpectral(rng.fork('spectral'), primary.spectralType.value)
  const mass = Math.min(primary.massSolar.value, massForSpectral(spectral, rng.fork('mass')))
  const luminosity = luminosityForMass(mass)
  const activityRoll = twoD6(rng.fork('activity'))

  return {
    id: `companion-star-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name: fact(name, 'human-layer', 'Generated companion star name'),
    spectralType: fact(spectral, 'inferred', 'Companion spectral class, biased smaller than primary'),
    massSolar: fact(Number(mass.toFixed(2)), 'derived', `Companion mass for ${spectral}, capped at primary mass`),
    luminositySolar: fact(Number(luminosity.toFixed(3)), 'derived', 'Mass-luminosity relation'),
    ageState: fact(primary.ageState.value, 'inferred', 'Coeval with primary'),
    metallicity: fact(primary.metallicity.value, 'inferred', 'Shared protostellar nebula'),
    activity: fact(activityRoll >= 10 ? 'Flare-prone' : activityRoll >= 6 ? 'Active' : 'Quiet', 'inferred', `Companion activity roll ${activityRoll}`),
    activityRoll: fact(activityRoll, 'derived', '2d6'),
    activityModifiers: [],
  }
}
