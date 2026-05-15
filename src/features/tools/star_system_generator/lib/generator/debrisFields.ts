import type { DebrisField, GeneratedSystem, GenerationOptions } from '../../types'
import type { SeededRng } from './rng'

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
