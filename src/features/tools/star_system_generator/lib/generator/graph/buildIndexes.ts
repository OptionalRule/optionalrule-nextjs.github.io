import type { EdgeType, RelationshipEdge } from './types'

const ALL_EDGE_TYPES = [
  'HOSTS', 'CONTROLS', 'DEPENDS_ON',
  'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
  'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
  'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
] as const satisfies readonly EdgeType[]

export interface EdgeIndexes {
  edgesByEntity: Record<string, string[]>
  edgesByType: Record<EdgeType, string[]>
}

export function buildEdgeIndexes(edges: ReadonlyArray<RelationshipEdge>): EdgeIndexes {
  const edgesByEntity: Record<string, string[]> = {}
  const edgesByType = {} as Record<EdgeType, string[]>
  for (const t of ALL_EDGE_TYPES) edgesByType[t] = []

  for (const edge of edges) {
    pushUnique(edgesByEntity, edge.subject.id, edge.id)
    if (edge.object.id !== edge.subject.id) {
      pushUnique(edgesByEntity, edge.object.id, edge.id)
    }
    edgesByType[edge.type].push(edge.id)
  }
  return { edgesByEntity, edgesByType }
}

function pushUnique(map: Record<string, string[]>, key: string, value: string): void {
  const arr = map[key] ?? []
  if (arr[arr.length - 1] !== value) arr.push(value)
  map[key] = arr
}
