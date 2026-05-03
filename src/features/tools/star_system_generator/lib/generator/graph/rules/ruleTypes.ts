import type { Confidence, NarrativeFact } from '../../../../types'
import type { SeededRng } from '../../rng'
import type { EntityInventoryInput } from '../entities'
import type { EdgeType, EdgeVisibility, EntityRef, RelationshipEdge } from '../types'

export interface BuildCtx {
  facts: NarrativeFact[]
  entities: EntityRef[]
  input: EntityInventoryInput
  rng: SeededRng
  factsBySubjectId: Map<string, NarrativeFact[]>
  factsByKind: Map<string, NarrativeFact[]>
  entitiesById: Map<string, EntityRef>
}

export interface RuleMatch {
  subject: EntityRef
  object: EntityRef
  qualifier?: string
  visibility?: EdgeVisibility
  confidence?: Confidence
  weight?: number
  groundingFactIds: string[]
}

export interface EdgeRule {
  id: string
  edgeType: EdgeType
  baseWeight: number
  defaultVisibility: EdgeVisibility
  match: (ctx: BuildCtx) => RuleMatch[]
  build: (match: RuleMatch, rule: EdgeRule, ctx: BuildCtx) => RelationshipEdge | null
}

export const CONFIDENCE_RANK: ReadonlyArray<Confidence> = [
  'confirmed', 'derived', 'human-layer', 'gu-layer', 'inferred',
] as const

export function leastConfident(facts: ReadonlyArray<NarrativeFact>): Confidence {
  if (facts.length === 0) return 'inferred'
  let worst = facts[0].value.confidence
  for (let i = 1; i < facts.length; i++) {
    const c = facts[i].value.confidence
    if (CONFIDENCE_RANK.indexOf(c) > CONFIDENCE_RANK.indexOf(worst)) {
      worst = c
    }
  }
  return worst
}

export function stableHashString(value: string): number {
  let h = 1779033703 ^ value.length
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

export function mintEdgeId(
  ruleId: string,
  subjectId: string,
  objectId: string,
  qualifier?: string,
): string {
  const base = `${ruleId}--${subjectId}--${objectId}`
  if (qualifier === undefined || qualifier === '') return base
  return `${base}--${stableHashString(qualifier).toString(36)}`
}

export function buildFactIndexes(facts: NarrativeFact[]): {
  factsBySubjectId: Map<string, NarrativeFact[]>
  factsByKind: Map<string, NarrativeFact[]>
} {
  const factsBySubjectId = new Map<string, NarrativeFact[]>()
  const factsByKind = new Map<string, NarrativeFact[]>()
  for (const fact of facts) {
    if (fact.subjectId !== undefined) {
      const arr = factsBySubjectId.get(fact.subjectId) ?? []
      arr.push(fact)
      factsBySubjectId.set(fact.subjectId, arr)
    }
    const kindArr = factsByKind.get(fact.kind) ?? []
    kindArr.push(fact)
    factsByKind.set(fact.kind, kindArr)
  }
  return { factsBySubjectId, factsByKind }
}
