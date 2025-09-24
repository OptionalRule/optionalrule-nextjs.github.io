import { ActiveLightSource, LightInstanceStatus, LightRadius, TorchCatalogEntry } from '../types'
import { DEFAULT_TURN_MINUTES } from '../data/lightSources'

export interface CatalogValidationIssue {
  type: 'error' | 'warning'
  entryId: string
  field: string
  message: string
}

export interface CatalogValidationReport {
  errors: CatalogValidationIssue[]
  warnings: CatalogValidationIssue[]
}

const DEFAULT_LIGHT_RADIUS: LightRadius = { bright: 20, dim: 40 }

const ensureRadius = (radius?: LightRadius): LightRadius => {
  const brightValue = radius?.bright
  const bright = Number.isFinite(brightValue)
    ? Math.max(0, Number(brightValue))
    : DEFAULT_LIGHT_RADIUS.bright
  const dimValue = radius?.dim
  const dimRaw = Number.isFinite(dimValue)
    ? Math.max(0, Number(dimValue))
    : DEFAULT_LIGHT_RADIUS.dim
  const dim = Math.max(bright, dimRaw)
  return { bright, dim }
}

export const ensureCatalogEntryDefaults = (entry: TorchCatalogEntry): TorchCatalogEntry => {
  const normalizedRadius = ensureRadius(entry.radius)
  const baseDuration = entry.baseDurationMinutes > 0 ? entry.baseDurationMinutes : DEFAULT_TURN_MINUTES
  const turnLength = entry.turnLengthMinutes > 0 ? entry.turnLengthMinutes : DEFAULT_TURN_MINUTES

  return {
    ...entry,
    baseDurationMinutes: baseDuration,
    turnLengthMinutes: turnLength,
    radius: normalizedRadius,
    description: entry.description?.trim() ?? '',
    tags: entry.tags ? [...entry.tags] : undefined,
  }
}

export const cloneCatalogEntry = (entry: TorchCatalogEntry): TorchCatalogEntry => {
  const normalized = ensureCatalogEntryDefaults(entry)
  return {
    ...normalized,
    radius: { ...normalized.radius },
    tags: normalized.tags ? [...normalized.tags] : undefined,
  }
}

export const createCatalogIndex = (entries: TorchCatalogEntry[]) => {
  const index = new Map<string, TorchCatalogEntry>()
  for (const entry of entries) {
    const clone = cloneCatalogEntry(entry)
    index.set(clone.id, clone)
  }
  return index
}

export const findCatalogEntry = (
  catalog: TorchCatalogEntry[] | Map<string, TorchCatalogEntry>,
  id: string,
): TorchCatalogEntry | undefined => {
  if (catalog instanceof Map) {
    return catalog.get(id)
  }
  return catalog.find((entry) => entry.id === id)
}

const roundsFromMinutes = (durationMinutes: number, turnLengthMinutes: number) => {
  if (turnLengthMinutes <= 0) return 0
  return Math.max(0, Math.ceil(durationMinutes / turnLengthMinutes))
}

const secondsFromMinutes = (minutes: number) => Math.max(0, Math.round(minutes * 60))

export interface CreateActiveSourceOptions {
  instanceId?: string
  label?: string
  remainingSeconds?: number
  notes?: string
  createdAt?: number
  isAffectingVisibility?: boolean
  isPaused?: boolean
  status?: LightInstanceStatus
}

export const createActiveSourceFromCatalog = (
  entry: TorchCatalogEntry,
  options: CreateActiveSourceOptions = {},
): ActiveLightSource => {
  const normalized = cloneCatalogEntry(entry)
  const createdAt = options.createdAt ?? Date.now()
  const baseSeconds = secondsFromMinutes(normalized.baseDurationMinutes)
  const turnSeconds = secondsFromMinutes(normalized.turnLengthMinutes)
  const totalRounds = roundsFromMinutes(normalized.baseDurationMinutes, normalized.turnLengthMinutes)

  const remainingSeconds = Math.max(
    0,
    Math.min(baseSeconds, options.remainingSeconds ?? baseSeconds),
  )
  const remainingRounds = turnSeconds > 0 ? Math.max(0, Math.ceil(remainingSeconds / turnSeconds)) : 0
  const status: LightInstanceStatus = options.status
    ?? (remainingSeconds <= 0 ? 'expired' : options.isPaused ? 'paused' : 'active')
  const isPaused = options.isPaused ?? status === 'paused'

  return {
    instanceId: options.instanceId ?? `${normalized.id}-${createdAt}`,
    catalogId: normalized.id,
    label: options.label ?? normalized.name,
    baseDurationMinutes: normalized.baseDurationMinutes,
    turnLengthMinutes: normalized.turnLengthMinutes,
    totalSeconds: baseSeconds,
    remainingSeconds,
    totalRounds,
    remainingRounds,
    radius: { ...normalized.radius },
    icon: normalized.icon,
    color: normalized.color,
    description: normalized.description,
    sourceType: normalized.sourceType,
    category: normalized.category,
    brightness: normalized.brightness,
    mishapNote: normalized.mishapNote,
    notes: options.notes,
    createdAt,
    updatedAt: createdAt,
    lastTickTimestamp: null,
    isPaused,
    isAffectingVisibility: options.isAffectingVisibility ?? true,
    status,
  }
}

export const validateCatalogEntry = (entry: TorchCatalogEntry): CatalogValidationReport => {
  const errors: CatalogValidationIssue[] = []
  const warnings: CatalogValidationIssue[] = []
  const pushIssue = (type: 'error' | 'warning', field: string, message: string) => {
    const issue: CatalogValidationIssue = {
      type,
      entryId: entry.id,
      field,
      message,
    }
    if (type === 'error') errors.push(issue)
    else warnings.push(issue)
  }

  if (!entry.id.trim()) {
    pushIssue('error', 'id', 'Catalog entry id cannot be empty.')
  }
  if (!entry.name.trim()) {
    pushIssue('error', 'name', 'Catalog entry name cannot be empty.')
  }
  if (entry.baseDurationMinutes <= 0) {
    pushIssue('error', 'baseDurationMinutes', 'Base duration must be greater than zero minutes.')
  }
  if (entry.turnLengthMinutes <= 0) {
    pushIssue('error', 'turnLengthMinutes', 'Turn length must be a positive number of minutes.')
  }
  const radius = ensureRadius(entry.radius)
  if (radius.dim < radius.bright) {
    pushIssue('error', 'radius', 'Dim radius must be greater than or equal to bright radius.')
  }
  if (!entry.icon.trim()) {
    pushIssue('warning', 'icon', 'Icon is empty; consider providing an emoji or asset path.')
  }
  if (!entry.color.trim()) {
    pushIssue('warning', 'color', 'Color missing; default theme colors will be used.')
  }

  return { errors, warnings }
}

export const validateCatalog = (entries: TorchCatalogEntry[]): CatalogValidationReport => {
  const aggregate: CatalogValidationReport = { errors: [], warnings: [] }
  const seenIds = new Set<string>()

  for (const entry of entries) {
    if (seenIds.has(entry.id)) {
      aggregate.errors.push({
        type: 'error',
        entryId: entry.id,
        field: 'id',
        message: `Duplicate catalog id detected: ${entry.id}`,
      })
      continue
    }
    seenIds.add(entry.id)

    const report = validateCatalogEntry(entry)
    aggregate.errors.push(...report.errors)
    aggregate.warnings.push(...report.warnings)
  }

  return aggregate
}
