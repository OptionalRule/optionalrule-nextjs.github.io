import narrativeData from '../../../data/narrative.json'

export interface NarrativeStructure {
  id: string
  label: string
  domains?: readonly string[]
  motif?: string
  requiredLayers?: readonly string[]
  template: string
  slots: Record<string, string>
  distinctSlots?: readonly (readonly [string, string])[]
}

export interface NamedFaction {
  id: string
  name: string
  kind: string
  domains: readonly string[]
  publicFace: string
}

interface NarrativeData {
  humanRemnants: readonly string[]
  remnantHooks: readonly string[]
  phenomena: readonly string[]
  namedFactions?: readonly NamedFaction[]
  narrativeDomains?: Record<string, {
    label: string
    actors?: readonly string[]
    stakes?: readonly string[]
    pressures?: readonly string[]
    secrets?: readonly string[]
    sceneAnchors?: readonly string[]
  }>
  narrativeVariablePools: Record<string, readonly string[]>
  narrativeStructures: readonly NarrativeStructure[]
}

const typedNarrativeData = narrativeData as unknown as NarrativeData

export const humanRemnants = typedNarrativeData.humanRemnants
export const remnantHooks = typedNarrativeData.remnantHooks
export const phenomena = typedNarrativeData.phenomena
export const namedFactions = typedNarrativeData.namedFactions ?? []
export const narrativeDomains = typedNarrativeData.narrativeDomains ?? {}
export const narrativeVariablePools = typedNarrativeData.narrativeVariablePools
export const narrativeStructures = typedNarrativeData.narrativeStructures
