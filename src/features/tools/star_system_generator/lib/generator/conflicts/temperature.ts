import type { SeededRng } from '../rng'
import type { BuildGraphOptions, RelationshipEdge, SystemRelationshipGraph } from '../graph/types'
import type { ConflictTemperature } from './types'

const TEMPERATURE_ORDER: readonly ConflictTemperature[] = ['simmering', 'open', 'aftermath', 'frozen']

const OPEN_BOOST_TYPES = new Set(['CONTESTS', 'DESTABILIZES'])
const SIMMER_BOOST_TYPES = new Set(['WITNESSES', 'CONTRADICTS', 'SUPPRESSES', 'HIDES_FROM'])
const QUIET_EDGE_TYPES = new Set(['SUPPRESSES', 'HIDES_FROM'])

export interface TemperatureResult {
  temperature: ConflictTemperature
  frozenReason?: string
}

function findFrozenReason(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
  options: BuildGraphOptions,
): string | undefined {
  const principalIds = new Set([edge.subject.id, edge.object.id])
  const touchesPrincipal = (candidate: RelationshipEdge): boolean =>
    principalIds.has(candidate.subject.id) || principalIds.has(candidate.object.id)

  const suppressed = graph.edges.some(e =>
    e.id !== edge.id && QUIET_EDGE_TYPES.has(e.type) && touchesPrincipal(e),
  )
  if (suppressed) return 'a suppressed record keeps both sides quiet'

  const dependsForward = graph.edges.some(e =>
    e.type === 'DEPENDS_ON' && e.subject.id === edge.subject.id && e.object.id === edge.object.id,
  )
  const dependsBack = graph.edges.some(e =>
    e.type === 'DEPENDS_ON' && e.subject.id === edge.object.id && e.object.id === edge.subject.id,
  )
  if (dependsForward && dependsBack) return "each side holds the other's lifeline"

  if (options.gu === 'high' || options.gu === 'fracture') {
    return 'escalation here looks, from orbit, like someone building toward an ASI — and the Gardener watches'
  }
  return undefined
}

export function selectTemperature(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
  options: BuildGraphOptions,
  rng: SeededRng,
): TemperatureResult {
  const weights: Record<ConflictTemperature, number> = { simmering: 3, open: 2, aftermath: 1, frozen: 1 }
  if (OPEN_BOOST_TYPES.has(edge.type)) weights.open += 2
  if (SIMMER_BOOST_TYPES.has(edge.type)) weights.simmering += 2

  const hasHistoricalConsequence = graph.edges.some(e =>
    e.era === 'historical' && e.consequenceEdgeIds?.includes(edge.id),
  )
  if (hasHistoricalConsequence) weights.aftermath += 2

  const frozenReason = findFrozenReason(edge, graph, options)
  weights.frozen = frozenReason === undefined ? 0 : weights.frozen + 3

  const total = TEMPERATURE_ORDER.reduce((sum, t) => sum + weights[t], 0)
  const draw = rng.next() * total
  let cumulative = 0
  for (const temperature of TEMPERATURE_ORDER) {
    cumulative += weights[temperature]
    if (draw < cumulative) {
      return temperature === 'frozen'
        ? { temperature, frozenReason }
        : { temperature }
    }
  }
  return { temperature: 'simmering' }
}
