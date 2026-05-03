import type { EdgeType, RelationshipEdge, SystemRelationshipGraph } from '../types'

const ACTIVE_TYPES: ReadonlySet<EdgeType> = new Set(['CONTESTS', 'DESTABILIZES', 'SUPPRESSES'])
const EPISTEMIC_TYPES: ReadonlySet<EdgeType> = new Set(['CONTRADICTS', 'WITNESSES', 'HIDES_FROM'])
const STRUCTURAL_TYPES: ReadonlySet<EdgeType> = new Set(['HOSTS', 'CONTROLS', 'DEPENDS_ON'])

export interface EdgeClusters {
  spineCluster: RelationshipEdge[]
  activeCluster: RelationshipEdge[]
  epistemicCluster: RelationshipEdge[]
}

export function clusterEdges(graph: SystemRelationshipGraph): EdgeClusters {
  const spineIds = new Set(graph.spineEdgeIds)
  const spineEdges = graph.edges.filter(e => spineIds.has(e.id))
  const spinedEntityIds = new Set<string>()
  for (const e of spineEdges) {
    spinedEntityIds.add(e.subject.id)
    spinedEntityIds.add(e.object.id)
  }

  const spineCluster: RelationshipEdge[] = []
  const activeCluster: RelationshipEdge[] = []
  const epistemicCluster: RelationshipEdge[] = []

  for (const edge of graph.edges) {
    if (spineIds.has(edge.id)) {
      spineCluster.push(edge)
      continue
    }
    if (STRUCTURAL_TYPES.has(edge.type)) {
      if (spinedEntityIds.has(edge.subject.id) || spinedEntityIds.has(edge.object.id)) {
        spineCluster.push(edge)
      }
      continue
    }
    if (ACTIVE_TYPES.has(edge.type)) {
      activeCluster.push(edge)
      continue
    }
    if (EPISTEMIC_TYPES.has(edge.type) && edge.visibility !== 'hidden') {
      epistemicCluster.push(edge)
    }
  }

  return { spineCluster, activeCluster, epistemicCluster }
}
