import type { SeededRng } from '../rng'
import type { BuildGraphOptions, SystemRelationshipGraph } from '../graph/types'
import type { Settlement } from '../../../types'
import type { Conflict } from './types'
import { resolveStakeRef } from './stakes'
import { buildParties } from './parties'
import { selectTemperature } from './temperature'
import { bindComplication } from './complications'
import { derivePressure } from './pressure'
import { composeVisibleSign } from './visibleSigns'

export interface BuildConflictsInput {
  graph: SystemRelationshipGraph
  settlements: readonly Settlement[]
  options: BuildGraphOptions
}

export function buildConflicts(input: BuildConflictsInput, rng: SeededRng): Conflict[] {
  const { graph, settlements, options } = input
  const conflicts: Conflict[] = []
  for (const edgeId of graph.spineEdgeIds) {
    const edge = graph.edges.find(e => e.id === edgeId)
    if (!edge) continue
    const edgeRng = rng.fork(edge.id)
    const stakeRef = resolveStakeRef(edge, graph)
    const parties = buildParties(edge, graph, edgeRng)
    const { temperature, frozenReason } = selectTemperature(edge, graph, options, edgeRng)
    const complication = bindComplication(edge, parties, graph, settlements, edgeRng)
    const pressure = derivePressure(edge, stakeRef, edgeRng)
    const visibleSign = composeVisibleSign(edge.type, temperature, edgeRng)
    conflicts.push({
      id: `conflict-${edge.id}`,
      edgeId: edge.id,
      edgeType: edge.type,
      pressure,
      parties,
      stakeRef,
      temperature,
      frozenReason,
      complication,
      visibleSign,
    })
  }
  return conflicts
}
