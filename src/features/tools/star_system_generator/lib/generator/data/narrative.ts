import narrativeData from '../../../data/narrative.json'

export interface NarrativeStructure {
  id: string
  label: string
  domains?: readonly string[]
  motif?: string
  requiredLayers?: readonly string[]
  baseWeight?: number
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

export interface PhenomenonEntry {
  label: string
  confidence: 'gu-layer' | 'human-layer' | 'inferred'
  travelEffect: string
  surveyQuestion: string
  conflictHook: string
  sceneAnchor: string
}

interface NarrativeData {
  humanRemnants: readonly string[]
  remnantHooks: readonly string[]
  phenomena: readonly PhenomenonEntry[]
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
/**
 * @deprecated Phase B replaced runtime use of this list with per-tone
 * generateFactions() in lib/generator/factions/. The 10 entries below
 * have been migrated verbatim to balancedBank.ts:seedFactions and are
 * still produced (in deterministic per-system subsets) for tone='balanced'
 * systems. This export is retained only for legacy graph-rule tests and
 * the audit-star-system-data.ts data-shape validator. Do not introduce
 * new runtime consumers.
 */
export const namedFactions = typedNarrativeData.namedFactions ?? []
export const narrativeDomains = typedNarrativeData.narrativeDomains ?? {}
export const narrativeVariablePools = typedNarrativeData.narrativeVariablePools
export const narrativeStructures = typedNarrativeData.narrativeStructures
