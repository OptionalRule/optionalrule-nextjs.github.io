import type {
  ActiveLightSource,
  CentralTimerSnapshot,
  TorchTrackerHydrationSnapshot,
  TorchTrackerSettings,
  TorchTrackerState,
  TorchCatalogCategory,
  TorchSourceType,
} from '../types'

const STORAGE_VERSION = 1
const STORAGE_KEY = 'optionalrule.torch-tracker/state'

const VALID_SOURCE_TYPES: TorchSourceType[] = ['torch', 'lantern', 'spell', 'fire']
const VALID_CATEGORIES: TorchCatalogCategory[] = ['mundane', 'magical', 'environmental']

interface PersistedEnvelope {
  version: number
  savedAt: number
  state: unknown
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const sanitizeCentralTimer = (value: unknown): CentralTimerSnapshot | null => {
  if (!isPlainObject(value)) return null

  const totalSecondsRaw = value.totalSeconds
  if (!isFiniteNumber(totalSecondsRaw) || totalSecondsRaw <= 0) {
    return null
  }
  const totalSeconds = Math.round(Math.max(0, totalSecondsRaw))
  const remainingSecondsRaw = isFiniteNumber(value.remainingSeconds) ? value.remainingSeconds : totalSeconds
  const remainingSeconds = clamp(Math.round(Math.max(0, remainingSecondsRaw)), 0, totalSeconds)
  const elapsedSeconds = totalSeconds - remainingSeconds

  return {
    isInitialized: true,
    totalSeconds,
    remainingSeconds,
    elapsedSeconds,
  }
}

const sanitizeSettings = (value: unknown): TorchTrackerSettings => {
  if (!isPlainObject(value)) {
    return {
      isClockRunning: false,
      lastTickTimestamp: null,
    }
  }

  const isClockRunning = isBoolean(value.isClockRunning) ? value.isClockRunning : false
  const lastTickTimestamp = isFiniteNumber(value.lastTickTimestamp) ? value.lastTickTimestamp : null

  return {
    isClockRunning,
    lastTickTimestamp,
  }
}

const sanitizeActiveSource = (value: unknown): ActiveLightSource | null => {
  if (!isPlainObject(value)) return null

  const instanceId = isString(value.instanceId) ? value.instanceId : null
  const catalogId = isString(value.catalogId) ? value.catalogId : null
  const label = isString(value.label) ? value.label : null
  const baseDurationMinutes = isFiniteNumber(value.baseDurationMinutes) ? value.baseDurationMinutes : null
  const turnLengthMinutes = isFiniteNumber(value.turnLengthMinutes) ? value.turnLengthMinutes : null
  const totalSeconds = isFiniteNumber(value.totalSeconds) ? Math.max(0, value.totalSeconds) : null
  const remainingSecondsRaw = isFiniteNumber(value.remainingSeconds) ? Math.max(0, value.remainingSeconds) : null
  const brightRadius = isFiniteNumber(value.brightRadius) ? Math.max(0, value.brightRadius) : null
  const icon = isString(value.icon) ? value.icon : null
  const color = isString(value.color) ? value.color : null
  const description = isString(value.description) ? value.description : ''
  const sourceType = isString(value.sourceType) ? value.sourceType : null
  const category = isString(value.category) ? value.category : null

  if (
    !instanceId ||
    !catalogId ||
    !label ||
    baseDurationMinutes === null ||
    turnLengthMinutes === null ||
    totalSeconds === null ||
    remainingSecondsRaw === null ||
    brightRadius === null ||
    !icon ||
    !color ||
    !sourceType ||
    !category
  ) {
    return null
  }

  if (!VALID_SOURCE_TYPES.includes(sourceType as TorchSourceType)) {
    return null
  }
  if (!VALID_CATEGORIES.includes(category as TorchCatalogCategory)) {
    return null
  }

  const remainingSeconds = clamp(Math.round(remainingSecondsRaw), 0, Math.round(totalSeconds))
  const elapsedSeconds = Math.max(0, Math.round(totalSeconds) - remainingSeconds)
  const createdAt = isFiniteNumber(value.createdAt) ? value.createdAt : Date.now()
  const updatedAt = isFiniteNumber(value.updatedAt) ? value.updatedAt : createdAt
  const lastTickTimestamp = isFiniteNumber(value.lastTickTimestamp) ? value.lastTickTimestamp : null
  const brightness = isFiniteNumber(value.brightness) ? value.brightness : undefined
  const mishapNote = isString(value.mishapNote) ? value.mishapNote : undefined
  const notes = isString(value.notes) ? value.notes : undefined
  const isPausedRaw = isBoolean(value.isPaused) ? value.isPaused : value.status === 'paused'
  const status = value.status === 'paused' || isPausedRaw ? 'paused' : 'active'
  const isAffectingVisibility = isBoolean(value.isAffectingVisibility)
    ? value.isAffectingVisibility
    : true

  return {
    instanceId,
    catalogId,
    label,
    baseDurationMinutes,
    turnLengthMinutes,
    totalSeconds: Math.round(Math.max(0, totalSeconds)),
    remainingSeconds,
    elapsedSeconds,
    brightRadius,
    icon,
    color,
    description,
    sourceType: sourceType as TorchSourceType,
    category: category as TorchCatalogCategory,
    brightness,
    mishapNote,
    notes,
    createdAt,
    updatedAt,
    lastTickTimestamp,
    isPaused: status === 'paused',
    isAffectingVisibility,
    status,
  }
}

const sanitizeHydrationSnapshot = (value: unknown): TorchTrackerHydrationSnapshot | null => {
  if (!isPlainObject(value)) return null

  const activeRaw = value.active
  const settingsRaw = value.settings
  const centralTimerRaw = value.centralTimer

  if (!Array.isArray(activeRaw)) return null

  const active: ActiveLightSource[] = []
  for (const entry of activeRaw) {
    const sanitized = sanitizeActiveSource(entry)
    if (sanitized) {
      active.push(sanitized)
    }
  }

  const settings = sanitizeSettings(settingsRaw)
  const centralTimer = sanitizeCentralTimer(centralTimerRaw)

  return {
    active,
    settings,
    centralTimer: centralTimer ?? {
      isInitialized: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      elapsedSeconds: 0,
    },
  }
}

export const loadTorchTrackerState = (storage: Storage): TorchTrackerHydrationSnapshot | null => {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: PersistedEnvelope = JSON.parse(raw)
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      storage.removeItem(STORAGE_KEY)
      return null
    }
    const snapshot = sanitizeHydrationSnapshot(parsed.state)
    if (!snapshot) {
      storage.removeItem(STORAGE_KEY)
      return null
    }
    return snapshot
  } catch (error) {
    console.warn('TorchTracker: Failed to load persisted state', error)
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // noop
    }
    return null
  }
}

export const persistTorchTrackerState = (storage: Storage, state: TorchTrackerState) => {
  try {
    const payload: PersistedEnvelope = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      state: {
        active: state.active.map((entry) => ({ ...entry })),
        settings: { ...state.settings },
        centralTimer: { ...state.centralTimer },
      },
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('TorchTracker: Failed to persist state', error)
  }
}

export const clearTorchTrackerState = (storage: Storage) => {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('TorchTracker: Failed to clear persisted state', error)
  }
}

export const getTorchTrackerStorageKey = () => STORAGE_KEY

