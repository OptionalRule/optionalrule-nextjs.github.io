import type { SeededRng } from '../rng'
import type { RelationshipEdge, SystemRelationshipGraph } from '../graph/types'
import type { Settlement } from '../../types'
import { lowerFirst } from '../prose/helpers'
import type { ConflictComplication, ConflictParty } from './types'

const DEADLINE_POOL: readonly string[] = [
  'the next resupply convoy leaves in nine days, and it will not wait for a verdict',
  'the harvest window closes with the coming flare season',
  'an audit team is already inbound, and both sides know whose books are worse',
  'the arbitration clock runs out at the end of the quarter, then the guns decide',
  'life-support consumables run to four weeks on the current draw',
  'the gate authority reviews the charter next transit cycle',
]

const GU_ANOMALY_POOL: readonly string[] = [
  'the readings underneath the dispute have started drifting, and neither side trusts its own instruments',
  'a bleed surge could move the whole prize a million kilometers overnight',
  'the anomaly both sides are pricing has begun pricing them back',
  'every survey pass returns numbers that contradict the pass before it',
  'the phenomenon is growing, and the safety margins were written for what it used to be',
  'harvest crews report the site remembers where they worked yesterday',
]

function isGuAnchored(edge: RelationshipEdge, parties: readonly ConflictParty[]): boolean {
  const refs = [edge.subject, edge.object, ...parties.map(p => p.ref)]
  return refs.some(r => r.kind === 'phenomenon' || r.kind === 'guHazard')
}

export function bindComplication(
  edge: RelationshipEdge,
  parties: readonly ConflictParty[],
  graph: SystemRelationshipGraph,
  settlements: readonly Settlement[],
  rng: SeededRng,
): ConflictComplication | undefined {
  if (rng.chance(0.25)) return undefined

  const settlementsById = new Map(settlements.map(s => [s.id, s]))
  for (const party of parties) {
    if (party.ref.kind !== 'settlement') continue
    const settlement = settlementsById.get(party.ref.id)
    const secret = settlement?.hiddenTruth.value
    if (secret && secret.length > 0) {
      return { kind: 'secret', text: lowerFirst(secret), sourceRef: party.ref }
    }
  }

  const historical = graph.edges.find(e =>
    e.era === 'historical' && e.consequenceEdgeIds?.includes(edge.id),
  )
  if (historical) {
    return { kind: 'third-party', text: historical.summary ?? 'an old betrayal neither side names' }
  }

  if (isGuAnchored(edge, parties)) {
    return { kind: 'gu-anomaly', text: GU_ANOMALY_POOL[rng.int(0, GU_ANOMALY_POOL.length - 1)] }
  }
  return { kind: 'deadline', text: DEADLINE_POOL[rng.int(0, DEADLINE_POOL.length - 1)] }
}
