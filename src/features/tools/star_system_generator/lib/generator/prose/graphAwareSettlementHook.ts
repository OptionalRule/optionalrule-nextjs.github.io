import type { Settlement } from '../../../types'
import type { SeededRng } from '../rng'
import type { SystemRelationshipGraph, RelationshipEdge, EdgeType, EntityRef } from '../graph'
import { articleizeNounPhrase } from '../graph/render/slotResolver'

const ELIGIBLE_TYPES: ReadonlyArray<EdgeType> = ['CONTESTS', 'DEPENDS_ON', 'SUPPRESSES']

export const HOOK_REWRITE_POOLS: Record<'CONTESTS' | 'DEPENDS_ON' | 'SUPPRESSES', readonly string[]> = {
  CONTESTS: [
    'The standoff with {other} is the political reality of this site.',
    'Every schedule posted here is a move in the quarrel with {other}.',
    'Nothing gets decided without first asking what {other} will do about it.',
    "Half the site's budget is contingency against {other}.",
    'Visitors pick a side in the dispute with {other} just by choosing where to dock.',
    'The feud with {other} has outlasted three administrators and shows no strain.',
  ],
  DEPENDS_ON: [
    'Everything here turns on access to {other}.',
    'The site lives at the pleasure of whoever moves {other}.',
    'Every contingency plan on file assumes {other} keeps flowing.',
    'Ask about {other} in any corridor and watch the conversation stop.',
    'The real constitution of this site is the supply schedule for {other}.',
    'Cut the line to {other} and the org chart becomes a casualty list.',
  ],
  SUPPRESSES: [
    'Whoever controls {other} decides what gets reported.',
    'The quiet around {other} is enforced, and everyone knows the enforcer.',
    'Questions about {other} get answered with docking fees.',
    "The site's records are complete except where {other} would appear.",
    'What happened at {other} is known, unfiled, and priced into everything.',
    'Officially, {other} is routine; the guard rotation says otherwise.',
  ],
}

const NOUN_PHRASE_KINDS = new Set(['phenomenon', 'guHazard', 'guResource'])

function formatOther(ref: EntityRef): string {
  if (NOUN_PHRASE_KINDS.has(ref.kind)) return articleizeNounPhrase(ref.displayName)
  return ref.displayName
}

export function graphAwareSettlementHook(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
): string | null {
  const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
  if (incidentEdgeIds.length === 0) return null

  const incidentEdges = incidentEdgeIds
    .map(id => graph.edges.find(e => e.id === id))
    .filter((e): e is RelationshipEdge => e !== undefined)
    .filter(e => ELIGIBLE_TYPES.includes(e.type))

  const spineSet = new Set(graph.settlementSpineEdgeIds)
  const eligible = incidentEdges
    .filter(e => spineSet.has(e.id))
    .sort((a, b) => graph.settlementSpineEdgeIds.indexOf(a.id) - graph.settlementSpineEdgeIds.indexOf(b.id))

  if (eligible.length === 0) return null
  const edge = eligible[0]
  const other = edge.subject.id === settlement.id ? edge.object : edge.subject
  const pool = HOOK_REWRITE_POOLS[edge.type as 'CONTESTS' | 'DEPENDS_ON' | 'SUPPRESSES']
  const template = pool[rng.int(0, pool.length - 1)]
  return template.replaceAll('{other}', formatOther(other))
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
