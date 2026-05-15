import type { DebrisField, DebrisFieldShape, GeneratedSystem, GenerationOptions, StellarCompanion, Star } from '../../types'
import { createSeededRng } from './rng'
import type { SeededRng } from './rng'

interface SelectionContext {
  hierarchicalTriple: boolean
}

interface SelectionResult {
  shape: DebrisFieldShape
}

export function selectArchetypeForCompanion(
  rngSeed: { seed: string },
  companion: StellarCompanion,
  primary: Star,
  context: SelectionContext,
): SelectionResult | null {
  const rng = createSeededRng(`${rngSeed.seed}:debris:${companion.id}`)
  const massRatio = companion.star.massSolar.value / (primary.massSolar.value + companion.star.massSolar.value)
  const activity = companion.star.activity.value
  const mode = companion.mode

  if (mode === 'linked-independent') return null

  if (context.hierarchicalTriple && companion.id === 'companion-1') {
    return { shape: 'inner-pair-halo' }
  }

  if (mode === 'volatile') {
    return { shape: 'mass-transfer-stream' }
  }

  if (mode === 'circumbinary') {
    if (massRatio <= 0.15) return { shape: 'trojan-camp' }
    return { shape: 'polar-ring' }
  }

  if (mode === 'orbital-sibling') {
    if (
      activity === 'Flare-prone' ||
      activity === 'Violent flare cycle' ||
      activity === 'Extreme activity / metric-amplified events'
    ) {
      return { shape: 'kozai-scattered-halo' }
    }
    const roll = rng.next()
    if (roll < 0.4) return { shape: 'hill-sphere-capture-cone' }
    return { shape: 'exocomet-swarm' }
  }

  return null
}

export function deriveDebrisFields(
  _rng: SeededRng,
  _system: GeneratedSystem,
  _options: GenerationOptions,
): DebrisField[] {
  return []
}

export function attachSettlementsToDebrisFields<T extends { debrisFieldId?: string; bodyId?: string }>(
  _rng: SeededRng,
  settlements: T[],
  _debrisFields: DebrisField[],
): T[] {
  return settlements
}

export function attachRuinsToDebrisFields<T extends { debrisFieldId?: string }>(
  _rng: SeededRng,
  ruins: T[],
  _debrisFields: DebrisField[],
): T[] {
  return ruins
}
