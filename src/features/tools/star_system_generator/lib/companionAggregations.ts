import type { GeneratedSystem } from '../types'

export interface AggregatedCounts {
  settlements: { primary: number; companion: number; total: number }
  gates: { primary: number; companion: number; total: number }
  ruins: { primary: number; companion: number; total: number }
  phenomena: { primary: number; companion: number; total: number }
}

export function aggregatedCounts(system: GeneratedSystem): AggregatedCounts {
  const subSettlements = system.companions.reduce((n, c) => n + (c.subSystem?.settlements.length ?? 0), 0)
  const subGates = system.companions.reduce((n, c) => n + (c.subSystem?.gates.length ?? 0), 0)
  const subRuins = system.companions.reduce((n, c) => n + (c.subSystem?.ruins.length ?? 0), 0)
  const subPhenomena = system.companions.reduce((n, c) => n + (c.subSystem?.phenomena.length ?? 0), 0)

  return {
    settlements: {
      primary: system.settlements.length,
      companion: subSettlements,
      total: system.settlements.length + subSettlements,
    },
    gates: {
      primary: system.gates.length,
      companion: subGates,
      total: system.gates.length + subGates,
    },
    ruins: {
      primary: system.ruins.length,
      companion: subRuins,
      total: system.ruins.length + subRuins,
    },
    phenomena: {
      primary: system.phenomena.length,
      companion: subPhenomena,
      total: system.phenomena.length + subPhenomena,
    },
  }
}

export function formatSplitCount(primary: number, companion: number): string {
  if (companion === 0) return String(primary)
  return `${primary + companion} (${primary} primary, ${companion} companion)`
}
