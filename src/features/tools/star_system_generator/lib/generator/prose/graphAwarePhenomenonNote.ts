import type { SeededRng } from '../rng'
import type { SystemPhenomenon } from '../../../types'
import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

const CONNECTORS = ['And', 'But', 'Meanwhile'] as const

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

  const connector = CONNECTORS[rng.int(0, CONNECTORS.length - 1)]

  const sentence1 = travelEffect !== '' ? `${travelEffect}.` : ''
  const sentence2Parts = [surveyQuestion].filter(s => s !== '')
  const sentence2 = sentence2Parts.length > 0 ? `${connector}, ${sentence2Parts.join(' ')}` : ''

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
