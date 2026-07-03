import type { SeededRng } from '../rng'
import type { EntityKind, EntityRef, RelationshipEdge, SystemRelationshipGraph } from '../graph/types'
import type { ConflictParty } from './types'

const AGGRESSOR_STAKES: readonly string[] = [
  'the right to set tariffs no one else can audit',
  'first claim on the next harvest window',
  'a monopoly that dies the moment anyone measures it',
  'control of the schedule everyone else plans around',
  'the authority to declare what counts as contaminated',
  'standing to rewrite the charter in their own hand',
  'the final say over who docks and who drifts',
]

const DEFENDER_STAKES: readonly string[] = [
  'the margin that keeps the lights on',
  'a route concession three generations deep',
  'the only leverage they have left to trade',
  'their standing as the ones who kept everyone alive',
  'the records that prove they were here first',
  'a workforce that will scatter the day the contract breaks',
  'the last berth they can still afford to hold',
]

const BYSTANDER_STAKES: readonly string[] = [
  'rationed air while the principals negotiate',
  'wages frozen until someone blinks',
  'a supply run that arrives only when the lanes are calm',
  'family on both sides of the picket line',
  'a clinic that treats casualties from either camp and bills neither',
  'the freight surcharge that lands on them no matter who wins',
]

const EXCLUDED_BYSTANDER_KINDS: ReadonlySet<EntityKind> = new Set(['star', 'system'])

const BYSTANDER_PREFERENCE: readonly EntityKind[] = ['settlement', 'namedFaction']

function pickStake(pool: readonly string[], rng: SeededRng): string {
  return pool[rng.int(0, pool.length - 1)]
}

function principalRoles(edge: RelationshipEdge): [ConflictParty['role'], ConflictParty['role']] {
  if (edge.type === 'DEPENDS_ON') return ['defender', 'aggressor']
  return ['aggressor', 'defender']
}

function collectBystanderCandidates(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
): EntityRef[] {
  const principalIds = new Set([edge.subject.id, edge.object.id])
  const seen = new Set<string>()
  const candidates: EntityRef[] = []
  for (const principalId of [edge.subject.id, edge.object.id]) {
    for (const edgeId of graph.edgesByEntity[principalId] ?? []) {
      if (edgeId === edge.id) continue
      const adjacent = graph.edges.find(e => e.id === edgeId)
      if (!adjacent) continue
      for (const ref of [adjacent.subject, adjacent.object]) {
        if (principalIds.has(ref.id) || seen.has(ref.id)) continue
        if (EXCLUDED_BYSTANDER_KINDS.has(ref.kind)) continue
        seen.add(ref.id)
        candidates.push(ref)
      }
    }
  }
  return candidates
}

function pickBystander(candidates: EntityRef[], rng: SeededRng): EntityRef | null {
  if (candidates.length === 0) return null
  for (const preferred of BYSTANDER_PREFERENCE) {
    const tier = candidates.filter(c => c.kind === preferred)
    if (tier.length > 0) return tier[rng.int(0, tier.length - 1)]
  }
  return candidates[rng.int(0, candidates.length - 1)]
}

export function buildParties(
  edge: RelationshipEdge,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
): ConflictParty[] {
  const [subjectRole, objectRole] = principalRoles(edge)
  const aggressorFirst = subjectRole === 'aggressor'
  const parties: ConflictParty[] = [
    {
      ref: edge.subject,
      role: subjectRole,
      stake: pickStake(aggressorFirst ? AGGRESSOR_STAKES : DEFENDER_STAKES, rng),
    },
    {
      ref: edge.object,
      role: objectRole,
      stake: pickStake(aggressorFirst ? DEFENDER_STAKES : AGGRESSOR_STAKES, rng),
    },
  ]

  const bystander = pickBystander(collectBystanderCandidates(edge, graph), rng)
  if (bystander) {
    parties.push({ ref: bystander, role: 'bystander', stake: pickStake(BYSTANDER_STAKES, rng) })
  }
  return parties
}
