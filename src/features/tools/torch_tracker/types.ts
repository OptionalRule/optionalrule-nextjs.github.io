// Core types for the Shadowdark Torch Tracker feature

export type TorchSourceType = 'torch' | 'lantern' | 'spell' | 'fire' | 'custom'
export type TorchCatalogCategory = 'mundane' | 'magical' | 'environmental' | 'custom'

export interface LightRadius {
  bright: number
  dim: number
}

export interface TorchCatalogEntry {
  id: string
  name: string
  sourceType: TorchSourceType
  category: TorchCatalogCategory
  baseDurationMinutes: number
  turnLengthMinutes: number
  radius: LightRadius
  icon: string
  color: string
  description: string
  brightness?: number
  mishapNote?: string
  tags?: string[]
  isCustomArchetype?: boolean
}

export type LightInstanceStatus = 'active' | 'paused' | 'expired'

export interface ActiveLightSource {
  instanceId: string
  catalogId: string
  label: string
  baseDurationMinutes: number
  turnLengthMinutes: number
  totalSeconds: number
  remainingSeconds: number
  totalRounds: number
  remainingRounds: number
  radius: LightRadius
  icon: string
  color: string
  description: string
  sourceType: TorchSourceType
  category: TorchCatalogCategory
  brightness?: number
  mishapNote?: string
  notes?: string
  createdAt: number
  updatedAt: number
  lastTickTimestamp: number | null
  isPaused: boolean
  isAffectingVisibility: boolean
  status: LightInstanceStatus
}

export interface TorchTrackerSettings {
  autoAdvance: boolean
  isClockRunning: boolean
  lastTickTimestamp: number | null
}

export interface TorchTrackerState {
  catalog: TorchCatalogEntry[]
  active: ActiveLightSource[]
  expired: ActiveLightSource[]
  settings: TorchTrackerSettings
}

export type TorchTrackerActionType =
  | 'catalog/register'
  | 'catalog/refresh'
  | 'active/add'
  | 'active/update'
  | 'active/remove'
  | 'active/expire'
  | 'active/reset'
  | 'active/pause'
  | 'active/resume'
  | 'active/tick'
  | 'settings/toggleAutoAdvance'
  | 'settings/setClockRunning'
  | 'settings/syncTimestamp'

export interface TorchTrackerBaseAction<TType extends TorchTrackerActionType, TPayload> {
  type: TType
  payload: TPayload
}

export type TorchTrackerReducerAction =
  | TorchTrackerBaseAction<'catalog/register', TorchCatalogEntry[]>
  | TorchTrackerBaseAction<'catalog/refresh', TorchCatalogEntry[]>
  | TorchTrackerBaseAction<'active/add', ActiveLightSource>
  | TorchTrackerBaseAction<'active/update', Partial<ActiveLightSource> & { instanceId: string }>
  | TorchTrackerBaseAction<'active/remove', { instanceId: string }>
  | TorchTrackerBaseAction<'active/expire', { instanceId: string; expiredAt: number }>
  | TorchTrackerBaseAction<'active/reset', { instanceId: string } | { scope: 'all' }>
  | TorchTrackerBaseAction<'active/pause', { instanceId: string; pausedAt: number }>
  | TorchTrackerBaseAction<'active/resume', { instanceId: string; resumedAt: number }>
  | TorchTrackerBaseAction<'active/tick', { deltaSeconds: number; now: number }>
  | TorchTrackerBaseAction<'settings/toggleAutoAdvance', { value?: boolean }>
  | TorchTrackerBaseAction<'settings/setClockRunning', { isRunning: boolean; now: number | null }>
  | TorchTrackerBaseAction<'settings/syncTimestamp', { now: number | null }>

export type TorchTrackerSelector<TResult> = (state: TorchTrackerState) => TResult

export interface TorchTrackerSelectors {
  selectCatalog: TorchTrackerSelector<TorchCatalogEntry[]>
  selectActive: TorchTrackerSelector<ActiveLightSource[]>
  selectExpired: TorchTrackerSelector<ActiveLightSource[]>
  selectSettings: TorchTrackerSelector<TorchTrackerSettings>
  selectIsClockRunning: TorchTrackerSelector<boolean>
  selectAutoAdvance: TorchTrackerSelector<boolean>
  selectNextExpiration: TorchTrackerSelector<ActiveLightSource | null>
  selectBrightestRadius: TorchTrackerSelector<LightRadius | null>
}
