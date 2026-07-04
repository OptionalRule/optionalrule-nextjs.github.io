import type { GeneratorTone, GuPreference, GeneratorDistribution } from '../../../types'
import type { SeededRng } from '../rng'
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
  // DEPENDS_ON runs settlement -> guResource by construction, and its template
  // family renders the object as a bare nounPhrase; requiring a named object
  // would leave the type permanently spine-ineligible.
  if (edge.type === 'DEPENDS_ON' && edge.object.kind === 'guResource') {
    return isNamedEntity(edge.subject)
  }
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
const SEED_FACTION_SPINE_CAP = 1
const SPINE_TYPE_FLOOR = 0.35
const SPINE_WITHIN_TYPE_FLOOR = 0.6
const REPEAT_TYPE_DAMPENER = 0.4

function hasSeedFactionEndpoint(edge: RelationshipEdge, seedFactionNames: ReadonlySet<string>): boolean {
  return (edge.subject.kind === 'namedFaction' && seedFactionNames.has(edge.subject.displayName))
    || (edge.object.kind === 'namedFaction' && seedFactionNames.has(edge.object.displayName))
}

export function selectEdges(
  scored: ReadonlyArray<ScoredCandidate>,
  options: SelectionOptions,
  gu: GuPreference = 'normal',
  seedFactionNames?: ReadonlySet<string>,
  rng?: SeededRng,
): SelectionResult {
  const totalCap = Math.min(
    TOTAL_HARD_CEILING,
    6 + Math.min(6, options.numSettlements + options.numPhenomena),
  )

  const spineCandidates = scored.filter(c => isSpineEligibleForGu(c.edge, gu))

  const spine: RelationshipEdge[] = rng !== undefined
    ? sampleSpine(spineCandidates, seedFactionNames, rng)
    : selectSpineGreedy(spineCandidates, seedFactionNames)

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

function selectSpineGreedy(
  spineCandidates: ReadonlyArray<ScoredCandidate>,
  seedFactionNames?: ReadonlySet<string>,
): RelationshipEdge[] {
  const spine: RelationshipEdge[] = []
  let seedFactionSpineCount = 0
  for (const cand of spineCandidates) {
    if (spine.length >= SPINE_MAX) break
    const seedTouched = seedFactionNames !== undefined && hasSeedFactionEndpoint(cand.edge, seedFactionNames)
    if (seedTouched && seedFactionSpineCount >= SEED_FACTION_SPINE_CAP) continue
    spine.push(cand.edge)
    if (seedTouched) seedFactionSpineCount += 1
  }
  return spine
}

// Weighted sampling instead of argmax: for a fixed tone/distribution the
// multiplicative score adjustments always rank the same edge type first, so a
// greedy pick collapses every seed onto one story shape. Types whose best
// candidate clears a floor relative to the global top are sampled with
// sqrt-flattened weights (the raw multipliers would still hand ~90% of seeds
// to the favored type), then a candidate is sampled within the type.
function sampleSpine(
  spineCandidates: ReadonlyArray<ScoredCandidate>,
  seedFactionNames: ReadonlySet<string> | undefined,
  rng: SeededRng,
): RelationshipEdge[] {
  if (spineCandidates.length === 0) return []
  const topScore = spineCandidates[0].score

  const remaining: ScoredCandidate[] = []
  const bestByType = new Map<EdgeType, number>()
  for (const cand of spineCandidates) {
    const best = bestByType.get(cand.edge.type)
    if (best === undefined || cand.score > best) bestByType.set(cand.edge.type, cand.score)
  }
  for (const cand of spineCandidates) {
    const typeBest = bestByType.get(cand.edge.type) ?? 0
    if (typeBest < topScore * SPINE_TYPE_FLOOR) continue
    if (cand.score < typeBest * SPINE_WITHIN_TYPE_FLOOR) continue
    remaining.push(cand)
  }

  const spine: RelationshipEdge[] = []
  const pickedTypes = new Set<EdgeType>()
  let seedFactionSpineCount = 0

  while (spine.length < SPINE_MAX && remaining.length > 0) {
    const byType = new Map<EdgeType, ScoredCandidate[]>()
    for (const cand of remaining) {
      const group = byType.get(cand.edge.type) ?? []
      group.push(cand)
      byType.set(cand.edge.type, group)
    }
    const typeEntries = [...byType.entries()].map(([type, group]) => {
      const best = Math.max(...group.map(c => c.score))
      const dampener = pickedTypes.has(type) ? REPEAT_TYPE_DAMPENER : 1
      return { type, group, weight: Math.sqrt(best) * dampener }
    })
    const chosenType = weightedPick(typeEntries, e => e.weight, rng)
    const chosen = weightedPick(chosenType.group, c => c.score, rng)

    const index = remaining.indexOf(chosen)
    remaining.splice(index, 1)

    const seedTouched = seedFactionNames !== undefined && hasSeedFactionEndpoint(chosen.edge, seedFactionNames)
    if (seedTouched && seedFactionSpineCount >= SEED_FACTION_SPINE_CAP) continue
    spine.push(chosen.edge)
    pickedTypes.add(chosen.edge.type)
    if (seedTouched) seedFactionSpineCount += 1
  }
  return spine
}

function weightedPick<T>(items: ReadonlyArray<T>, weightOf: (item: T) => number, rng: SeededRng): T {
  if (items.length === 1) return items[0]
  const total = items.reduce((sum, item) => sum + weightOf(item), 0)
  if (total <= 0) return items[0]
  let roll = rng.next() * total
  for (const item of items) {
    roll -= weightOf(item)
    if (roll <= 0) return item
  }
  return items[items.length - 1]
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
