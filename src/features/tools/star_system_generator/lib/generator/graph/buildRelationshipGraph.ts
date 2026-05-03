import type { NarrativeFact } from '../../../types'
import type { SeededRng } from '../rng'
import { buildEntityInventory, type EntityInventoryInput } from './entities'
import type { EdgeType, RelationshipEdge, SystemRelationshipGraph } from './types'
import { allRules, buildFactIndexes, type BuildCtx } from './rules'
import { scoreCandidates, selectEdges } from './score'
import { buildEdgeIndexes } from './buildIndexes'

const ALL_EDGE_TYPES = [
  'HOSTS', 'CONTROLS', 'DEPENDS_ON',
  'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
  'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
  'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
] as const satisfies readonly EdgeType[]

function emptyEdgesByType(): Record<EdgeType, string[]> {
  const result = {} as Record<EdgeType, string[]>
  for (const type of ALL_EDGE_TYPES) {
    result[type] = []
  }
  return result
}

export function buildRelationshipGraph(
  input: EntityInventoryInput,
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

  const scored = scoreCandidates(candidates)
  const selection = selectEdges(scored, {
    numSettlements: input.settlements.length,
    numPhenomena: input.phenomena.length,
  })
  const edges = [...selection.spine, ...selection.peripheral]

  const { edgesByEntity, edgesByType } = buildEdgeIndexes(edges)
  const completeEdgesByType = { ...emptyEdgesByType(), ...edgesByType }

  return {
    entities,
    edges,
    edgesByEntity,
    edgesByType: completeEdgesByType,
    spineEdgeIds: selection.spineIds,
    historicalEdgeIds: [],
  }
}
