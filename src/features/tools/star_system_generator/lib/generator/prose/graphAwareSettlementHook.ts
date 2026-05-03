import type { Settlement } from '../../../types'
import type { SystemRelationshipGraph, RelationshipEdge, EdgeType } from '../graph'

const ELIGIBLE_TYPES: ReadonlyArray<EdgeType> = ['CONTESTS', 'DEPENDS_ON', 'SUPPRESSES']

export function graphAwareSettlementHook(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
): string | null {
  const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
  if (incidentEdgeIds.length === 0) return null

  const incidentEdges = incidentEdgeIds
    .map(id => graph.edges.find(e => e.id === id))
    .filter((e): e is RelationshipEdge => e !== undefined)
    .filter(e => ELIGIBLE_TYPES.includes(e.type))

  const spineSet = new Set(graph.spineEdgeIds)
  const eligible = incidentEdges
    .filter(e => spineSet.has(e.id))
    .sort((a, b) => graph.spineEdgeIds.indexOf(a.id) - graph.spineEdgeIds.indexOf(b.id))

  if (eligible.length === 0) return null
  const edge = eligible[0]
  const otherDisplayName =
    edge.subject.id === settlement.id ? edge.object.displayName : edge.subject.displayName

  if (edge.type === 'CONTESTS') {
    return `The standoff with ${otherDisplayName} is the political reality of this site.`
  }
  if (edge.type === 'DEPENDS_ON') {
    return `Everything here turns on access to ${otherDisplayName}.`
  }
  return `Whoever controls ${otherDisplayName} decides what gets reported.`
}

export function rewriteFourthSentence(
  existing: string,
  replacement: string,
): string {
  const lastPeriodBefore = findFourthSentenceStart(existing)
  if (lastPeriodBefore === -1) return existing
  return existing.slice(0, lastPeriodBefore + 1).trim() + ' ' + replacement
}

function findFourthSentenceStart(text: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.') {
      count += 1
      if (count === 3) return i
    }
  }
  return -1
}
