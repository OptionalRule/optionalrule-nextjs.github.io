import type { Settlement, SettlementHabitationPattern, SettlementPopulation } from '../../../types'
import type { GlyphId, GlyphStatus, PopulationTier } from './types'

const SMALL_POPULATIONS: ReadonlySet<SettlementPopulation> = new Set([
  'Minimal (<5)',
  '1-20',
  '21-100',
  '101-1,000',
  'Unknown',
])
const MEDIUM_POPULATIONS: ReadonlySet<SettlementPopulation> = new Set([
  '1,001-10,000',
  '10,001-100,000',
])
const LARGE_POPULATIONS: ReadonlySet<SettlementPopulation> = new Set([
  '100,001-1 million',
  '1-10 million',
  '10+ million',
])

export function populationTier(value: SettlementPopulation): PopulationTier {
  if (LARGE_POPULATIONS.has(value)) return 'large'
  if (MEDIUM_POPULATIONS.has(value)) return 'medium'
  if (SMALL_POPULATIONS.has(value)) return 'small'
  return 'small'
}

const AI_RUN_PATTERN = /\b(automated|fully autonomous|no crew|ai[- ]run|machine[- ]tended)\b/i

export function isAiRun(aiSituation: string): boolean {
  return AI_RUN_PATTERN.test(aiSituation)
}

export function pickSettlementGlyph(
  pattern: SettlementHabitationPattern,
  population: SettlementPopulation,
): GlyphId {
  const tier = populationTier(population)

  if (pattern === 'Sealed arcology' || pattern === 'Underground city') return 'A3'

  if (
    pattern === 'Surface settlement' ||
    pattern === 'Sky platform' ||
    pattern === 'Tethered tower'
  ) {
    return tier === 'large' ? 'A1' : 'A2'
  }

  if (
    pattern === 'Asteroid or belt base' ||
    pattern === 'Hollow asteroid' ||
    pattern === 'Belt cluster' ||
    pattern === 'Moon base'
  ) {
    return 'BR'
  }

  if (
    pattern === 'Distributed swarm' ||
    pattern === 'Drift colony' ||
    pattern === 'Generation ship' ||
    pattern === 'Deep-space platform'
  ) {
    return 'DR'
  }

  if (pattern === 'Ring station' || pattern === "O'Neill cylinder") {
    return tier === 'large' ? 'B2' : 'B5'
  }

  if (pattern === 'Hub complex') {
    if (tier === 'large') return 'B3'
    if (tier === 'medium') return 'B1'
    return 'B5'
  }

  if (pattern === 'Modular island station') {
    return tier === 'large' ? 'B4' : 'B5'
  }

  if (pattern === 'Orbital station') {
    if (tier === 'large') return 'B1'
    if (tier === 'medium') return 'B5'
    return 'B6'
  }

  if (pattern === 'Gate or route node') return 'GT'

  return 'B7'
}

export function pickSettlementStatus(
  pattern: SettlementHabitationPattern,
  aiSituation: string,
): GlyphStatus {
  if (pattern === 'Abandoned') return 'abandoned'
  if (pattern === 'Automated') return 'automated'
  if (isAiRun(aiSituation)) return 'automated'
  return 'active'
}

export function pickGlyphForSettlement(s: Settlement): { glyph: GlyphId; status: GlyphStatus } {
  return {
    glyph: pickSettlementGlyph(s.habitationPattern.value, s.population.value),
    status: pickSettlementStatus(s.habitationPattern.value, s.aiSituation.value),
  }
}
