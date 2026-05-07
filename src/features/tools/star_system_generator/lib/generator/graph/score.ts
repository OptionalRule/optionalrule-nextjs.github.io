import type { GeneratorTone, GuPreference, GeneratorDistribution } from '../../../types'
import type { EdgeType, EdgeVisibility, EntityRef, RelationshipEdge } from './types'
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

type ToneWeights = Partial<Record<EdgeType, number>>

const TONE_WEIGHTS: Record<GeneratorTone, ToneWeights> = {
  balanced: {},
  astronomy: {
    DESTABILIZES: 1.5,
    HIDES_FROM: 1.3,
    HOSTS: 1.2,
    WITNESSES: 1.2,
    CONTESTS: 0.7,
    CONTRADICTS: 0.7,
  },
  cinematic: {
    CONTESTS: 1.5,
    CONTRADICTS: 1.4,
    BETRAYED: 1.3,
    DESTABILIZES: 0.8,
    HIDES_FROM: 0.9,
  },
}

function toneMultiplier(edgeType: EdgeType, tone: GeneratorTone): number {
  return TONE_WEIGHTS[tone][edgeType] ?? 1.0
}

const LOW_GU_DAMPENERS: Partial<Record<EdgeType, number>> = {
  DESTABILIZES: 0.7,
  HIDES_FROM: 0.7,
}
const HIGH_GU_HAZARD_BONUS = 0.2

function guScoreAdjustment(edge: RelationshipEdge, gu: GuPreference): number {
  if (gu === 'low') {
    return LOW_GU_DAMPENERS[edge.type] ?? 1.0
  }
  if (gu === 'high') {
    const hazardAnchored = edge.subject.kind === 'guHazard' || edge.object.kind === 'guHazard'
    if (edge.type === 'DESTABILIZES' && hazardAnchored) {
      return 1.0 + HIGH_GU_HAZARD_BONUS
    }
  }
  return 1.0
}

const DISTRIBUTION_VISIBILITY_WEIGHTS: Record<GeneratorDistribution, Record<EdgeVisibility, number>> = {
  realistic: {
    public: 1.2,
    contested: 0.8,
    hidden: 1.0,
  },
  frontier: {
    public: 0.8,
    contested: 1.3,
    hidden: 1.0,
  },
}

function distributionMultiplier(visibility: EdgeVisibility, distribution: GeneratorDistribution): number {
  return DISTRIBUTION_VISIBILITY_WEIGHTS[distribution][visibility]
}

const NAMED_KINDS = new Set<EntityRef['kind']>([
  'settlement', 'namedFaction', 'body', 'ruin', 'system',
  'phenomenon', 'guHazard',
])

export function isNamedEntity(ref: EntityRef): boolean {
  if (!NAMED_KINDS.has(ref.kind)) return false
  return /[A-Z][a-z]+/.test(ref.displayName)
}

export function scoreCandidates(
  candidates: ReadonlyArray<RelationshipEdge>,
  tone: GeneratorTone = 'balanced',
  gu: GuPreference = 'normal',
  distribution: GeneratorDistribution = 'realistic',
  seedSalt: string = '',
): ScoredCandidate[] {
  const collapsed = collapseDuplicates(candidates)
  const sortedForNovelty = [...collapsed].sort((a, b) => {
    return stableHashString(seedSalt + a.id) - stableHashString(seedSalt + b.id)
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
    const baseScore = edge.weight + novelty + crossLayer + namedEntity
    const score = baseScore
      * toneMultiplier(edge.type, tone)
      * guScoreAdjustment(edge, gu)
      * distributionMultiplier(edge.visibility, distribution)
    return { edge, score, bonuses }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return stableHashString(seedSalt + a.edge.id) - stableHashString(seedSalt + b.edge.id)
  })
  return scored
}

export interface SelectionOptions {
  numSettlements: number
  numPhenomena: number
}

export interface SelectionResult {
  spine: RelationshipEdge[]
  peripheral: RelationshipEdge[]
  spineIds: string[]
}

const SPINE_ELIGIBLE_TYPES: ReadonlySet<EdgeType> = new Set<EdgeType>([
  'CONTESTS', 'DESTABILIZES', 'DEPENDS_ON', 'CONTROLS',
])

export function isSpineEligibleForGu(
  edge: RelationshipEdge,
  gu: GuPreference,
): boolean {
  if (!SPINE_ELIGIBLE_TYPES.has(edge.type)) return false
  const baselineEligible = isNamedEntity(edge.subject) && isNamedEntity(edge.object)
  if (gu === 'fracture') {
    const phenomenonAnchored =
      (edge.subject.kind === 'phenomenon' && (edge.object.kind === 'phenomenon' || edge.object.kind === 'guHazard'))
      || (edge.object.kind === 'phenomenon' && (edge.subject.kind === 'phenomenon' || edge.subject.kind === 'guHazard'))
    return baselineEligible || phenomenonAnchored
  }
  return baselineEligible
}

const SPINE_MAX = 3
const PERIPHERAL_PER_TYPE_CAP = 2
const TOTAL_HARD_CEILING = 12

export function selectEdges(
  scored: ReadonlyArray<ScoredCandidate>,
  options: SelectionOptions,
  gu: GuPreference = 'normal',
): SelectionResult {
  const totalCap = Math.min(
    TOTAL_HARD_CEILING,
    6 + Math.min(6, options.numSettlements + options.numPhenomena),
  )

  const spineCandidates = scored.filter(c => isSpineEligibleForGu(c.edge, gu))

  const spine: RelationshipEdge[] = []
  for (const cand of spineCandidates) {
    if (spine.length >= SPINE_MAX) break
    spine.push(cand.edge)
  }

  const usedIds = new Set(spine.map(e => e.id))

  const peripheral: RelationshipEdge[] = []
  const perTypeCount: Partial<Record<EdgeType, number>> = {}
  const remainingBudget = totalCap - spine.length
  for (const cand of scored) {
    if (peripheral.length >= remainingBudget) break
    if (usedIds.has(cand.edge.id)) continue
    const type = cand.edge.type
    const currentCount = perTypeCount[type] ?? 0
    if (currentCount >= PERIPHERAL_PER_TYPE_CAP) continue
    peripheral.push(cand.edge)
    perTypeCount[type] = currentCount + 1
    usedIds.add(cand.edge.id)
  }

  return { spine, peripheral, spineIds: spine.map(e => e.id) }
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
