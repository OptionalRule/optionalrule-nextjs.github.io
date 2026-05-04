import type { NarrativeFact } from '../../../types'
import type { SeededRng } from '../rng'
import { buildEntityInventory, type EntityInventoryInput } from './entities'
import type { BuildGraphOptions, EdgeType, RelationshipEdge, SystemRelationshipGraph } from './types'
import { EDGE_TYPES } from './types'
import { allRules, buildFactIndexes, type BuildCtx } from './rules'
import { scoreCandidates, selectEdges } from './score'
import { buildEdgeIndexes } from './buildIndexes'
import { attachHistoricalEvents } from './history'
import { selectSettlementSpineEdgeIds } from './settlementSpineEligibility'

function emptyEdgesByType(): Record<EdgeType, string[]> {
  const result = {} as Record<EdgeType, string[]>
  for (const type of EDGE_TYPES) {
    result[type] = []
  }
  return result
}

export function buildRelationshipGraph(
  input: EntityInventoryInput,
  options: BuildGraphOptions,
  facts: NarrativeFact[],
  rng: SeededRng,
): SystemRelationshipGraph {
  const entities = buildEntityInventory(input)
  const entitiesById = new Map(entities.map(e => [e.id, e]))
  const indexes = buildFactIndexes(facts)
  const ctx: BuildCtx = {
    facts,
    entities,
    input,
    rng: rng.fork('rules'),
    ...indexes,
    entitiesById,
  }

  const candidates: RelationshipEdge[] = []
  for (const rule of allRules) {
    const matches = rule.match(ctx)
    for (const match of matches) {
      const edge = rule.build(match, rule, ctx)
      if (edge !== null) candidates.push(edge)
    }
  }

  const scored = scoreCandidates(candidates, options.tone, options.gu, options.distribution)
  const selection = selectEdges(scored, {
    numSettlements: input.settlements.length,
    numPhenomena: input.phenomena.length,
  }, options.gu)
  const edges = [...selection.spine, ...selection.peripheral]

  const { historicalEdges } = attachHistoricalEvents({
    spineEdges: selection.spine,
    rng,
  })
  const allEdges = [...edges, ...historicalEdges]

  const { edgesByEntity, edgesByType } = buildEdgeIndexes(allEdges)
  const completeEdgesByType = { ...emptyEdgesByType(), ...edgesByType }

  const settlementIds = new Set(input.settlements.map(s => s.id))
  const finalEdgeIds = new Set(allEdges.map(e => e.id))
  const candidatesInGraph = scored.filter(c => finalEdgeIds.has(c.edge.id))
  const settlementSpineEdgeIds = selectSettlementSpineEdgeIds(candidatesInGraph, settlementIds)

  return {
    entities,
    edges: allEdges,
    edgesByEntity,
    edgesByType: completeEdgesByType,
    spineEdgeIds: selection.spineIds,
    settlementSpineEdgeIds,
    historicalEdgeIds: historicalEdges.map(e => e.id),
  }
}
