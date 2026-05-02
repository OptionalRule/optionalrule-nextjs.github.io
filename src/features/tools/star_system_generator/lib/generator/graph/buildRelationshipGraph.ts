import type { SeededRng } from '../rng'
import { buildEntityInventory, type EntityInventoryInput } from './entities'
import type { EdgeType, SystemRelationshipGraph } from './types'

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
  _rng: SeededRng,
): SystemRelationshipGraph {
  const entities = buildEntityInventory(input)
  return {
    entities,
    edges: [],
    edgesByEntity: {},
    edgesByType: emptyEdgesByType(),
    spineEdgeIds: [],
    historicalEdgeIds: [],
  }
}
