import type { EntityKind, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../graph/types'

const STAKE_KINDS: ReadonlySet<EntityKind> = new Set([
  'guResource', 'phenomenon', 'body', 'route', 'gate', 'settlement',
])

const NEIGHBOR_EDGE_TYPES = new Set(['DEPENDS_ON', 'CONTROLS'])

export function resolveStakeRef(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
): EntityRef | null {
  if (edge.qualifier) {
    const qualifier = edge.qualifier.toLowerCase()
    const match = graph.entities.find(e => e.displayName.toLowerCase() === qualifier)
    if (match) return match
  }

  const principalIds = new Set([edge.subject.id, edge.object.id])
  for (const candidate of graph.edges) {
    if (candidate.id === edge.id) continue
    if (!NEIGHBOR_EDGE_TYPES.has(candidate.type)) continue
    const subjectIsPrincipal = principalIds.has(candidate.subject.id)
    const objectIsPrincipal = principalIds.has(candidate.object.id)
    if (!subjectIsPrincipal && !objectIsPrincipal) continue
    const other = subjectIsPrincipal ? candidate.object : candidate.subject
    if (principalIds.has(other.id)) continue
    if (STAKE_KINDS.has(other.kind)) return other
  }

  const fallback = graph.entities.find(e => e.kind === 'phenomenon' || e.kind === 'guResource')
  return fallback ?? null
}
