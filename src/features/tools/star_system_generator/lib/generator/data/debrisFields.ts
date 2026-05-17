import debrisFieldsRaw from '../../../data/debrisFields.json'
import type { DebrisFieldShape } from '../../../types'

export interface DebrisArchetypeData {
  label: string
  whyHerePool: string[]
  prizePool: string[]
  guCharacterPool: string[]
  phenomenon: {
    labelPool: string[]
    notePool: string[]
    travelEffectPool: string[]
    surveyQuestionPool: string[]
    conflictHookPool: string[]
    sceneAnchorPool: string[]
  }
}

const archetypes = debrisFieldsRaw.archetypes as Record<DebrisFieldShape, DebrisArchetypeData>

export function debrisArchetypeData(shape: DebrisFieldShape): DebrisArchetypeData {
  const data = archetypes[shape]
  if (!data) throw new Error(`Unknown debris archetype: ${shape}`)
  return data
}

export function allDebrisArchetypes(): Array<[DebrisFieldShape, DebrisArchetypeData]> {
  return Object.entries(archetypes) as Array<[DebrisFieldShape, DebrisArchetypeData]>
}
