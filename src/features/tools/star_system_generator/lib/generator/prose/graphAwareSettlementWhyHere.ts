import type { Settlement } from '../../../types'
import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

export function graphAwareSettlementWhyHere(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
): string | null {
  const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
  if (incidentEdgeIds.length === 0) return null

  const incidentEdges = incidentEdgeIds
    .map(id => graph.edges.find(e => e.id === id))
    .filter((e): e is RelationshipEdge => e !== undefined)

  const dependsOn = incidentEdges.find(e =>
    e.type === 'DEPENDS_ON' && e.subject.id === settlement.id,
  )
  const hosts = incidentEdges.find(e =>
    e.type === 'HOSTS' && e.object.id === settlement.id,
  )

  if (!dependsOn && !hosts) return null

  const anchorName = settlement.anchorName.value

  if (dependsOn && hosts) {
    return `${anchorName} sits on ${hosts.subject.displayName} and depends on ${dependsOn.object.displayName}.`
  }
  if (dependsOn) {
    return `${anchorName} survives by depending on ${dependsOn.object.displayName}.`
  }
  return `${anchorName} sits on ${hosts!.subject.displayName}.`
}
