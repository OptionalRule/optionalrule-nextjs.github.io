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
  hotEnvelopeClimateTags: readonly string[]
  temperateEnvelopeClimateTags: readonly string[]
  coldEnvelopeClimateTags: readonly string[]
  envelopeClimateTags: readonly string[]
  biospheres: readonly string[]
  mineralCompositionTable: Array<TableEntry<string>>
  magneticFieldTable: Array<TableEntry<string>>
  atmosphericTracesTable: Array<TableEntry<string>>
  hydrologyTable: Array<TableEntry<string>>
  topographyTable: Array<TableEntry<string>>
  rotationProfileTable: Array<TableEntry<string>>
  moonTypes: readonly string[]
  moonScales: readonly string[]
  bodySites: BodySitePools
}

export interface BodySitePools {
  any: readonly string[]
  terrestrial: readonly string[]
  envelope: readonly string[]
  minor: readonly string[]
  anomaly: readonly string[]
  rogueCaptured: readonly string[]
}

export type BodySiteGroup = keyof BodySitePools

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
export const hotEnvelopeClimateTags = typedMechanicsData.hotEnvelopeClimateTags
export const temperateEnvelopeClimateTags = typedMechanicsData.temperateEnvelopeClimateTags
export const coldEnvelopeClimateTags = typedMechanicsData.coldEnvelopeClimateTags
export const envelopeClimateTags = typedMechanicsData.envelopeClimateTags
export const biospheres = typedMechanicsData.biospheres
export const mineralCompositionTable = typedMechanicsData.mineralCompositionTable
export const magneticFieldTable = typedMechanicsData.magneticFieldTable
export const atmosphericTracesTable = typedMechanicsData.atmosphericTracesTable
export const hydrologyTable = typedMechanicsData.hydrologyTable
export const topographyTable = typedMechanicsData.topographyTable
export const rotationProfileTable = typedMechanicsData.rotationProfileTable
export const moonTypes = typedMechanicsData.moonTypes
export const moonScales = typedMechanicsData.moonScales
export const bodySites = typedMechanicsData.bodySites
export const allBodySites: readonly string[] = Object.values(bodySites).flatMap((entries) => entries)
