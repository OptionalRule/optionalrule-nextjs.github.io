import type { ScoredCandidate } from './score'
import type { EdgeType } from './types'

const SETTLEMENT_SPINE_TYPES: ReadonlySet<EdgeType> = new Set<EdgeType>([
  'CONTESTS', 'DEPENDS_ON', 'SUPPRESSES',
])

const SETTLEMENT_SPINE_PER_SETTLEMENT_CAP = 1

export function selectSettlementSpineEdgeIds(
  scored: ReadonlyArray<ScoredCandidate>,
  settlementIds: ReadonlySet<string>,
): string[] {
  const eligible = scored.filter(c =>
    SETTLEMENT_SPINE_TYPES.has(c.edge.type)
    && (settlementIds.has(c.edge.subject.id) || settlementIds.has(c.edge.object.id)),
  )
  const counts = new Map<string, number>()
  const out: string[] = []
  for (const cand of eligible) {
    const settlementId = settlementIds.has(cand.edge.subject.id)
      ? cand.edge.subject.id
      : cand.edge.object.id
    const used = counts.get(settlementId) ?? 0
    if (used >= SETTLEMENT_SPINE_PER_SETTLEMENT_CAP) continue
    out.push(cand.edge.id)
    counts.set(settlementId, used + 1)
  }
  return out
}
