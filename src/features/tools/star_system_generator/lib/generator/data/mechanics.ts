import type { TableEntry } from '../dice'
import mechanicsData from '../../../data/mechanics.json'

export interface MaxLabelEntry {
  max: number
  value: string
}

interface JsonMaxLabelEntry {
  max: number | null
  value: string
}

interface MechanicsData {
  activityLabels: readonly JsonMaxLabelEntry[]
  atmosphereTable: Array<TableEntry<string>>
  hydrosphereTable: Array<TableEntry<string>>
  geologyTable: Array<TableEntry<string>>
  climateSourceTable: Array<TableEntry<string>>
  radiationTable: Array<TableEntry<string>>
  ringTypeTable: Array<TableEntry<string>>
  extremeHotAtmospheres: readonly string[]
  extremeHotVolatiles: readonly string[]
  envelopeGeologies: readonly string[]
  extremeHotClimateTags: readonly string[]
  hotClimateTags: readonly string[]
  temperateClimateTags: readonly string[]
  coldClimateTags: readonly string[]
  extremeHotEnvelopeClimateTags: readonly string[]
  envelopeClimateTags: readonly string[]
  biospheres: readonly string[]
  moonTypes: readonly string[]
  moonScales: readonly string[]
  siteOptions: readonly string[]
}

const typedMechanicsData = mechanicsData as unknown as MechanicsData

export const activityLabels: readonly MaxLabelEntry[] = typedMechanicsData.activityLabels.map((entry) => ({
  max: entry.max ?? Number.POSITIVE_INFINITY,
  value: entry.value,
}))
export const atmosphereTable = typedMechanicsData.atmosphereTable
export const hydrosphereTable = typedMechanicsData.hydrosphereTable
export const geologyTable = typedMechanicsData.geologyTable
export const climateSourceTable = typedMechanicsData.climateSourceTable
export const radiationTable = typedMechanicsData.radiationTable
export const ringTypeTable = typedMechanicsData.ringTypeTable
export const extremeHotAtmospheres = typedMechanicsData.extremeHotAtmospheres
export const extremeHotVolatiles = typedMechanicsData.extremeHotVolatiles
export const envelopeGeologies = typedMechanicsData.envelopeGeologies
export const extremeHotClimateTags = typedMechanicsData.extremeHotClimateTags
export const hotClimateTags = typedMechanicsData.hotClimateTags
export const temperateClimateTags = typedMechanicsData.temperateClimateTags
export const coldClimateTags = typedMechanicsData.coldClimateTags
export const extremeHotEnvelopeClimateTags = typedMechanicsData.extremeHotEnvelopeClimateTags
export const envelopeClimateTags = typedMechanicsData.envelopeClimateTags
export const biospheres = typedMechanicsData.biospheres
export const moonTypes = typedMechanicsData.moonTypes
export const moonScales = typedMechanicsData.moonScales
export const siteOptions = typedMechanicsData.siteOptions
