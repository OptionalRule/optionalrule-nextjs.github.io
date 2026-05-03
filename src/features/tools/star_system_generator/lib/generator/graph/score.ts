import type { EntityRef, RelationshipEdge } from './types'
import { stableHashString } from './rules/ruleTypes'

export interface ScoreBonuses {
  novelty: number
  crossLayer: number
  namedEntity: number
}

export interface ScoredCandidate {
  edge: RelationshipEdge
  score: number
  bonuses: ScoreBonuses
}

const NOVELTY_BONUS = 0.1
const CROSS_LAYER_BONUS = 0.15
const NAMED_ENTITY_BONUS = 0.1

const NAMED_KINDS = new Set<EntityRef['kind']>([
  'settlement', 'namedFaction', 'body', 'ruin', 'system',
])

export function isNamedEntity(ref: EntityRef): boolean {
  if (!NAMED_KINDS.has(ref.kind)) return false
  return /[A-Z][a-z]+/.test(ref.displayName)
}

export function scoreCandidates(candidates: ReadonlyArray<RelationshipEdge>): ScoredCandidate[] {
  const collapsed = collapseDuplicates(candidates)
  const sortedForNovelty = [...collapsed].sort((a, b) => {
    return stableHashString(a.id) - stableHashString(b.id)
  })

  const seenTypes = new Set<RelationshipEdge['type']>()
  const scored: ScoredCandidate[] = sortedForNovelty.map(edge => {
    const novelty = seenTypes.has(edge.type) ? 0 : NOVELTY_BONUS
    seenTypes.add(edge.type)
    const crossLayer = edge.subject.layer !== edge.object.layer ? CROSS_LAYER_BONUS : 0
    const namedEntity = isNamedEntity(edge.subject) && isNamedEntity(edge.object)
      ? NAMED_ENTITY_BONUS
      : 0
    const bonuses: ScoreBonuses = { novelty, crossLayer, namedEntity }
    const score = edge.weight + novelty + crossLayer + namedEntity
    return { edge, score, bonuses }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return stableHashString(a.edge.id) - stableHashString(b.edge.id)
  })
  return scored
}

function collapseDuplicates(candidates: ReadonlyArray<RelationshipEdge>): RelationshipEdge[] {
  const groups = new Map<string, RelationshipEdge[]>()
  for (const edge of candidates) {
    const key = `${edge.subject.id}|${edge.object.id}|${edge.type}`
    const arr = groups.get(key) ?? []
    arr.push(edge)
    groups.set(key, arr)
  }
  const out: RelationshipEdge[] = []
  for (const arr of groups.values()) {
    if (arr.length === 1) {
      out.push(arr[0])
    } else {
      arr.sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight
        return stableHashString(a.id) - stableHashString(b.id)
      })
      out.push(arr[0])
    }
  }
  return out
}
