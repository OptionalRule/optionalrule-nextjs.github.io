import narrativeData from '../../../data/narrative.json'

interface NarrativeData {
  humanRemnants: readonly string[]
  remnantHooks: readonly string[]
  phenomena: readonly string[]
}

const typedNarrativeData = narrativeData as NarrativeData

export const humanRemnants = typedNarrativeData.humanRemnants
export const remnantHooks = typedNarrativeData.remnantHooks
export const phenomena = typedNarrativeData.phenomena
