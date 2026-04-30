import narrativeData from '../../../data/narrative.json'

export interface NarrativeStructure {
  id: string
  label: string
  template: string
  slots: Record<string, string>
  distinctSlots?: readonly (readonly [string, string])[]
}

interface NarrativeData {
  humanRemnants: readonly string[]
  remnantHooks: readonly string[]
  phenomena: readonly string[]
  narrativeVariablePools: Record<string, readonly string[]>
  narrativeStructures: readonly NarrativeStructure[]
}

const typedNarrativeData = narrativeData as unknown as NarrativeData

export const humanRemnants = typedNarrativeData.humanRemnants
export const remnantHooks = typedNarrativeData.remnantHooks
export const phenomena = typedNarrativeData.phenomena
export const narrativeVariablePools = typedNarrativeData.narrativeVariablePools
export const narrativeStructures = typedNarrativeData.narrativeStructures
