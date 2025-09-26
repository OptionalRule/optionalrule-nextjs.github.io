// Core types for the Shadowdark Torch Tracker feature

export type TorchSourceType = 'torch' | 'lantern' | 'spell' | 'fire'
export type TorchCatalogCategory = 'mundane' | 'magical' | 'environmental'

export interface TorchCatalogEntry {
  id: string
  name: string
  sourceType: TorchSourceType
  category: TorchCatalogCategory
  baseDurationMinutes: number
  turnLengthMinutes: number
  brightRadius: number
  icon: string
  color: string
  description: string
  brightness?: number
  mishapNote?: string
  tags?: string[]
}

export type LightInstanceStatus = 'active' | 'paused'

export interface ActiveLightSource {
  instanceId: string
  catalogId: string
  label: string
  baseDurationMinutes: number
  turnLengthMinutes: number
  totalSeconds: number
  remainingSeconds: number
  /** Total elapsed burn time in seconds; derived from totalSeconds - remainingSeconds */
  elapsedSeconds: number
  brightRadius: number
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
  settings: TorchTrackerSettings
  centralTimer: CentralTimerSnapshot
}

export interface CentralTimerSnapshot {
  isInitialized: boolean
  totalSeconds: number
  remainingSeconds: number
  elapsedSeconds: number
}

export type TorchTrackerActionType =
  | 'catalog/register'
  | 'catalog/refresh'
  | 'active/add'
  | 'active/update'
  | 'active/remove'
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
  selectSettings: TorchTrackerSelector<TorchTrackerSettings>
  selectIsClockRunning: TorchTrackerSelector<boolean>
  selectAutoAdvance: TorchTrackerSelector<boolean>
  selectCentralTimer: TorchTrackerSelector<CentralTimerSnapshot>
}
