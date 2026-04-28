export type ValidationSeverity = 'error' | 'warning' | 'info'

export type ValidationSource = 'generated-error' | 'locked-conflict' | 'repair-applied' | 'audit' | 'test'

export type ValidationTargetKind =
  | 'system'
  | 'body'
  | 'moon'
  | 'settlement'
  | 'architecture'
  | 'locked-fact'

export const validationSources = {
  generatedError: 'generated-error',
  lockedConflict: 'locked-conflict',
  repairApplied: 'repair-applied',
  audit: 'audit',
  test: 'test',
} as const satisfies Record<string, ValidationSource>

export const validationCodes = {
  environmentAirlessAtmosphere: 'ENV_AIRLESS_ATMOSPHERE',
  environmentAirlessHydrosphere: 'ENV_AIRLESS_HYDROSPHERE',
  environmentDesertHydrosphere: 'ENV_DESERT_HYDROSPHERE',
  architectureMinimumUnsatisfied: 'ARCH_MINIMUM_UNSATISFIED',
  settlementDuplicateName: 'SETTLEMENT_DUPLICATE_NAME',
  lockedFactConflict: 'LOCKED_FACT_CONFLICT',
  repairApplied: 'REPAIR_APPLIED',
} as const

export type ValidationCode = typeof validationCodes[keyof typeof validationCodes] | (string & {})

export interface ValidationFinding {
  severity: ValidationSeverity
  code: ValidationCode
  path: string
  message: string
  targetId?: string
  targetKind?: ValidationTargetKind
  source?: ValidationSource
  observed?: unknown
  expected?: unknown
  rawValue?: unknown
  finalValue?: unknown
  policyCode?: string
  locked?: boolean
  gmImplication?: string
}
