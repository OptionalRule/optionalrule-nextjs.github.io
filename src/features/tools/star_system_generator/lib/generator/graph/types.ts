import type { Confidence, GeneratorTone, GuPreference } from '../../../types'

export interface BuildGraphOptions {
  tone: GeneratorTone
  gu: GuPreference
}

export type EntityKind =
  | 'system' | 'star' | 'body' | 'settlement' | 'guResource' | 'guHazard'
  | 'phenomenon' | 'ruin' | 'namedFaction' | 'localInstitution' | 'route' | 'gate'

export type EntityLayer = 'physical' | 'gu' | 'human'

export interface EntityRef {
  kind: EntityKind
  id: string
  displayName: string
  layer: EntityLayer
}

export type EdgeType =
  | 'HOSTS' | 'CONTROLS' | 'DEPENDS_ON'
  | 'CONTESTS' | 'DESTABILIZES' | 'SUPPRESSES'
  | 'CONTRADICTS' | 'WITNESSES' | 'HIDES_FROM'
  | 'FOUNDED_BY' | 'BETRAYED' | 'DISPLACED'

export const EDGE_TYPES = [
  'HOSTS', 'CONTROLS', 'DEPENDS_ON',
  'CONTESTS', 'DESTABILIZES', 'SUPPRESSES',
  'CONTRADICTS', 'WITNESSES', 'HIDES_FROM',
  'FOUNDED_BY', 'BETRAYED', 'DISPLACED',
] as const satisfies readonly EdgeType[]

export type EdgeEra = 'present' | 'historical'

export type EdgeVisibility = 'public' | 'contested' | 'hidden'

export interface RelationshipEdge {
  id: string
  type: EdgeType
  subject: EntityRef
  object: EntityRef
  qualifier?: string
  visibility: EdgeVisibility
  confidence: Confidence
  groundingFactIds: string[]
  era: EdgeEra
  weight: number

  // Historical-only fields, populated iff era === 'historical'.
  approxEra?: string
  summary?: string
  consequenceEdgeIds?: string[]
}

export interface SystemRelationshipGraph {
  entities: EntityRef[]
  edges: RelationshipEdge[]
  edgesByEntity: Record<string, string[]>
  edgesByType: Record<EdgeType, string[]>
  spineEdgeIds: string[]
  // Settlement-incident eligible spine edges (CONTESTS / DEPENDS_ON / SUPPRESSES with
  // the settlement as at least one endpoint), capped 1 per settlement, populated
  // independently of the named-on-named main spineEdgeIds. Only contains edge ids
  // that survive selection and are present in `edges`. Consumers:
  // graphAwareSettlementHook (settlementHookSynthesis prose).
  settlementSpineEdgeIds: string[]
  historicalEdgeIds: string[]
}

export interface SystemStoryOutput {
  spineSummary: string
  body: string[]
  hooks: string[]
}
