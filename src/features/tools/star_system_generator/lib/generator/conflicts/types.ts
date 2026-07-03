import type { EdgeType, EntityRef } from '../graph/types'

export type ConflictTemperature = 'simmering' | 'open' | 'aftermath' | 'frozen'
export type ConflictRole = 'aggressor' | 'defender' | 'bystander'

export interface ConflictParty {
  ref: EntityRef
  role: ConflictRole
  stake: string
}

export type ComplicationKind = 'secret' | 'deadline' | 'third-party' | 'gu-anomaly'

export interface ConflictComplication {
  kind: ComplicationKind
  text: string
  sourceRef?: EntityRef
}

export interface Conflict {
  id: string
  edgeId: string
  edgeType: EdgeType
  pressure: string
  parties: ConflictParty[]
  stakeRef: EntityRef | null
  temperature: ConflictTemperature
  frozenReason?: string
  complication?: ConflictComplication
  visibleSign: string
}
