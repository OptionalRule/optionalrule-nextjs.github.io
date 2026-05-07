import type { SeededRng } from '../rng'
import type { SystemPhenomenon } from '../../../types'
import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

const DECLARATIVE_FRAMERS = [
  'The open question is',
  'No one has settled',
  'Crews still ask',
  'What stays contested is',
] as const

const INTERROGATIVE_FRAMERS = [
  'Open question:',
  'Crews still argue:',
  'Unsettled:',
  'Contested:',
] as const

const WH_LEADER = /^(Which|Who|Whose|Whom|What|When|Where|Why|How)\b/
const WH_INVERTED_AUX = /^(Which|Who|Whose|Whom|What|When|Where|Why|How)\s+(is|are|was|were|do|does|did|has|have|had)\b/

function frameQuestion(question: string, rng: SeededRng): string {
  const trimmed = question.trim().replace(/\?+$/, '')
  if (WH_LEADER.test(trimmed) && !WH_INVERTED_AUX.test(trimmed)) {
    const framer = DECLARATIVE_FRAMERS[rng.int(0, DECLARATIVE_FRAMERS.length - 1)]
    const lowered = trimmed.replace(/^([A-Z])/, c => c.toLowerCase())
    return `${framer} ${lowered}.`
  }
  const framer = INTERROGATIVE_FRAMERS[rng.int(0, INTERROGATIVE_FRAMERS.length - 1)]
  return `${framer} ${trimmed}?`
}

export function graphAwarePhenomenonNote(
  phenomenon: SystemPhenomenon,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
): string | null {
  const travelEffect = (phenomenon.travelEffect?.value ?? '').trim().replace(/[.,;:!?]+$/, '')
  const surveyQuestion = (phenomenon.surveyQuestion?.value ?? '').trim()
  const conflictHook = (phenomenon.conflictHook?.value ?? '').trim()
  const sceneAnchor = (phenomenon.sceneAnchor?.value ?? '').trim()

  if (travelEffect === '' && surveyQuestion === '' && conflictHook === '' && sceneAnchor === '') {
    return null
  }

  const incidentEdgeIds = graph.edgesByEntity[phenomenon.id] ?? []
  const incidentEdges = incidentEdgeIds
    .map(id => graph.edges.find(e => e.id === id))
    .filter((e): e is RelationshipEdge => e !== undefined)

  const destabilizes = incidentEdges.find(e =>
    e.type === 'DESTABILIZES' && e.subject.id === phenomenon.id,
  )

  const sentence1 = travelEffect !== '' ? `${travelEffect}.` : ''
  const sentence2 = surveyQuestion !== '' ? frameQuestion(surveyQuestion, rng) : ''

  if (destabilizes) {
    const target = destabilizes.object.displayName
    const destabilizationClause = `The destabilization centers on ${target}:`
    const afterTarget = [conflictHook, sceneAnchor].filter(s => s !== '').join(' ')
    const sentence3 = afterTarget !== '' ? `${destabilizationClause} ${afterTarget}` : `${destabilizationClause.replace(/:$/, '.')}`
    return [sentence1, sentence2, sentence3].filter(s => s !== '').join(' ')
  }

  const sentence3Parts = [conflictHook, sceneAnchor].filter(s => s !== '')
  const sentence3 = sentence3Parts.join(' ')
  return [sentence1, sentence2, sentence3].filter(s => s !== '').join(' ')
}
