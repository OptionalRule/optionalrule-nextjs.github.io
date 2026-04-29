import type { BodyCategory } from '../src/features/tools/star_system_generator/types'
import {
  bodyNameCores,
  bodyNameFormsByCategory,
  moonNameCores,
  moonNameForms,
  settlementNameDescriptors,
  systemCatalogLabels,
  systemNameCores,
  systemNameForms,
  systemNamePatterns,
} from '../src/features/tools/star_system_generator/lib/generator/data/names'
import {
  activityLabels,
  atmosphereTable,
  biospheres,
  climateSourceTable,
  geologyTable,
  hydrosphereTable,
  moonScales,
  moonTypes,
  radiationTable,
  ringTypeTable,
  siteOptions,
} from '../src/features/tools/star_system_generator/lib/generator/data/mechanics'
import {
  ageStates,
  architectures,
  frontierStarTypes,
  metallicities,
  reachabilityClasses,
  realisticStarTypes,
} from '../src/features/tools/star_system_generator/lib/generator/data/stellar'
import {
  bleedBehaviorTable,
  bleedLocationTable,
  guHazardTable,
  guIntensityTable,
  guResourceTable,
} from '../src/features/tools/star_system_generator/lib/generator/data/gu'
import {
  humanRemnants,
  phenomena,
  remnantHooks,
} from '../src/features/tools/star_system_generator/lib/generator/data/narrative'
import {
  aiSituations,
  asteroidBaseFunctions,
  biosphereFunctions,
  builtForms,
  civilFunctions,
  deepSpaceFunctions,
  encounterSites,
  encounterSitesByFunctionKeyword,
  encounterSitesByScale,
  extractionFunctions,
  giantOrbitalFunctions,
  guFractureFunctionsBySiteCategory,
  hiddenTruthByScale,
  hiddenTruths,
  mobileFunctions,
  moonBaseFunctions,
  orbitalFunctions,
  restrictedFunctions,
  routeFunctions,
  securityFunctions,
  settlementAuthorities,
  settlementAuthorityByScale,
  settlementConditionByScale,
  settlementConditions,
  settlementCrisisByScale,
  settlementCrises,
  settlementLocations,
  settlementScaleTable,
  settlementSiteCategories,
  settlementTagOptions,
  settlementTagPairHooks,
  settlementTags,
  surveyFunctions,
  surfaceIceFunctions,
  type SettlementLocationOption,
  type SettlementSiteCategory,
} from '../src/features/tools/star_system_generator/lib/generator/data/settlements'

interface Finding {
  path: string
  message: string
}

const bodyCategories: BodyCategory[] = [
  'rocky-planet',
  'super-earth',
  'sub-neptune',
  'gas-giant',
  'ice-giant',
  'belt',
  'dwarf-body',
  'rogue-captured',
  'anomaly',
]

const errors: Finding[] = []
const warnings: Finding[] = []

function addError(path: string, message: string): void {
  errors.push({ path, message })
}

function addWarning(path: string, message: string): void {
  warnings.push({ path, message })
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  })
  return [...duplicates]
}

function assertNonEmpty(path: string, values: readonly unknown[] | undefined): void {
  if (!values || values.length === 0) addError(path, 'Required array is empty or missing.')
}

function assertNoDuplicates(path: string, values: readonly string[]): void {
  const duplicates = duplicateValues(values)
  if (duplicates.length > 0) addError(path, `Duplicate values: ${duplicates.join(', ')}`)
}

function validateTableCoverage(path: string, table: Array<{ min: number; max: number }>, min: number, max: number): void {
  const covered = new Set<number>()
  table.forEach((entry, entryIndex) => {
    if (entry.min > entry.max) addError(`${path}.${entryIndex}`, `Range min ${entry.min} exceeds max ${entry.max}.`)
    for (let roll = entry.min; roll <= entry.max; roll++) {
      if (covered.has(roll)) addError(`${path}.${entryIndex}`, `Roll ${roll} is covered more than once.`)
      covered.add(roll)
    }
  })

  for (let roll = min; roll <= max; roll++) {
    if (!covered.has(roll)) addError(path, `Roll ${roll} is not covered.`)
  }
}

function warnIfThin(path: string, count: number, threshold: number): void {
  if (count < threshold) addWarning(path, `${count} entries; target at least ${threshold}.`)
}

function formatFinding(finding: Finding): string {
  return `  - ${finding.path}: ${finding.message}`
}

function printSection(title: string, rows: Array<[string, number | string]>): void {
  console.log(`${title}:`)
  rows.forEach(([label, value]) => console.log(`  ${label}: ${value}`))
  console.log('')
}

function allLocations(): SettlementLocationOption[] {
  return Object.values(settlementLocations).flat()
}

function locationCountsByCategory(): Record<SettlementSiteCategory, number> {
  const counts = Object.fromEntries(settlementSiteCategories.map((category) => [category, 0])) as Record<SettlementSiteCategory, number>
  allLocations().forEach((location) => {
    counts[location.category] = (counts[location.category] ?? 0) + 1
  })
  return counts
}

function validateNames(): void {
  assertNonEmpty('names.systemNameCores', systemNameCores)
  assertNonEmpty('names.systemNameForms', systemNameForms)
  assertNonEmpty('names.systemNamePatterns', systemNamePatterns)
  assertNonEmpty('names.systemCatalogLabels', systemCatalogLabels)
  assertNonEmpty('names.bodyNameCores', bodyNameCores)
  assertNonEmpty('names.moonNameCores', moonNameCores)
  assertNonEmpty('names.moonNameForms', moonNameForms)

  assertNoDuplicates('names.systemNameCores', systemNameCores)
  assertNoDuplicates('names.systemNameForms', systemNameForms)
  assertNoDuplicates('names.bodyNameCores', bodyNameCores)
  assertNoDuplicates('names.moonNameCores', moonNameCores)

  bodyCategories.forEach((category) => {
    assertNonEmpty(`names.bodyNameFormsByCategory.${category}`, bodyNameFormsByCategory[category])
  })

  if (!settlementNameDescriptors.function.default) addError('names.settlementNameDescriptors.function.default', 'Missing function descriptor fallback.')
  if (!settlementNameDescriptors.category.default) addError('names.settlementNameDescriptors.category.default', 'Missing category descriptor fallback.')
  if (!settlementNameDescriptors.authority.default) addError('names.settlementNameDescriptors.authority.default', 'Missing authority descriptor fallback.')
  if (!settlementNameDescriptors.scale.default) addError('names.settlementNameDescriptors.scale.default', 'Missing scale descriptor fallback.')
  if (!settlementNameDescriptors.scale.exact['Automated only']) addError('names.settlementNameDescriptors.scale.exact.Automated only', 'Missing automated-only scale descriptor.')
  if (!settlementNameDescriptors.scale.exact.Abandoned) addError('names.settlementNameDescriptors.scale.exact.Abandoned', 'Missing abandoned scale descriptor.')

  warnIfThin('names.systemNameCores', systemNameCores.length, 40)
  warnIfThin('names.bodyNameCores', bodyNameCores.length, 50)
  warnIfThin('names.moonNameCores', moonNameCores.length, 40)
}

function validateSettlements(): void {
  assertNonEmpty('settlements.siteCategories', settlementSiteCategories)
  assertNoDuplicates('settlements.siteCategories', settlementSiteCategories)

  const knownCategories = new Set<SettlementSiteCategory>(settlementSiteCategories)
  const locationCounts = locationCountsByCategory()

  allLocations().forEach((location) => {
    if (!knownCategories.has(location.category)) {
      addError('settlements.locations', `Unknown site category "${location.category}" for "${location.label}".`)
    }
  })

  settlementSiteCategories.forEach((category) => {
    assertNonEmpty(`settlements.locations.${category}`, Array.from({ length: locationCounts[category] }))
    assertNonEmpty(`settlements.guFractureFunctionsBySiteCategory.${category}`, guFractureFunctionsBySiteCategory[category])
    assertNonEmpty(`settlements.builtForms.bySiteCategory.${category}`, builtForms.bySiteCategory[category])
    warnIfThin(`settlements.locations.${category}`, locationCounts[category], 4)
    warnIfThin(`settlements.builtForms.bySiteCategory.${category}`, builtForms.bySiteCategory[category]?.length ?? 0, 5)
  })

  const functionPools: Array<[string, readonly string[]]> = [
    ['survey', surveyFunctions],
    ['extraction', extractionFunctions],
    ['orbital', orbitalFunctions],
    ['route', routeFunctions],
    ['security', securityFunctions],
    ['civil', civilFunctions],
    ['biosphere', biosphereFunctions],
    ['surfaceIce', surfaceIceFunctions],
    ['giantOrbital', giantOrbitalFunctions],
    ['asteroidBase', asteroidBaseFunctions],
    ['moonBase', moonBaseFunctions],
    ['deepSpace', deepSpaceFunctions],
    ['mobile', mobileFunctions],
    ['restricted', restrictedFunctions],
  ]

  functionPools.forEach(([name, values]) => {
    assertNonEmpty(`settlements.functionPools.${name}`, values)
  })

  assertNonEmpty('settlements.authorities', settlementAuthorities)
  assertNonEmpty('settlements.aiSituations', aiSituations)
  assertNonEmpty('settlements.conditions', settlementConditions)
  assertNonEmpty('settlements.crises', settlementCrises)
  assertNonEmpty('settlements.hiddenTruths', hiddenTruths)
  assertNonEmpty('settlements.encounterSites', encounterSites)
  assertNonEmpty('settlements.scaleTable', settlementScaleTable)

  if (settlementScaleTable.length !== 12) addError('settlements.scaleTable', `Expected 12 entries; got ${settlementScaleTable.length}.`)

  warnIfThin('settlements.tags', settlementTagOptions.length, 50)
  warnIfThin('settlements.crises', settlementCrises.length, 50)
  warnIfThin('settlements.hiddenTruths', hiddenTruths.length, 50)
  warnIfThin('settlements.encounterSites', encounterSites.length, 30)

  assertNoDuplicates('settlements.tags.id', settlementTagOptions.map((tag) => tag.id))
  assertNoDuplicates('settlements.tags.label', settlementTagOptions.map((tag) => tag.label))

  settlementTagOptions.forEach((tag) => {
    if (!tag.id.trim()) addError('settlements.tags', `Tag "${tag.label}" has no id.`)
    if (!tag.label.trim()) addError('settlements.tags', `Tag "${tag.id}" has no label.`)
    if (!tag.pressure.trim()) addError('settlements.tags', `Tag "${tag.label}" has no pressure text.`)
  })

  Object.keys(settlementTagPairHooks).forEach((pair) => {
    const [obviousTag, deeperTag] = pair.split(' + ')
    if (!settlementTags.includes(obviousTag)) addError('settlements.tagPairHooks', `Unknown obvious tag "${obviousTag}" in pair "${pair}".`)
    if (!settlementTags.includes(deeperTag)) addError('settlements.tagPairHooks', `Unknown deeper tag "${deeperTag}" in pair "${pair}".`)
  })

  ;['Automated only', 'Abandoned'].forEach((scale) => {
    assertNonEmpty(`settlements.authorityByScale.${scale}`, settlementAuthorityByScale[scale])
    assertNonEmpty(`settlements.conditionByScale.${scale}`, settlementConditionByScale[scale])
    assertNonEmpty(`settlements.crisisByScale.${scale}`, settlementCrisisByScale[scale])
    assertNonEmpty(`settlements.hiddenTruthByScale.${scale}`, hiddenTruthByScale[scale])
    assertNonEmpty(`settlements.encounterSitesByScale.${scale}`, encounterSitesByScale[scale])
  })

  encounterSitesByFunctionKeyword.forEach((pool, index) => {
    assertNonEmpty(`settlements.encounterSitesByFunctionKeyword.${index}.keywords`, pool.keywords)
    assertNonEmpty(`settlements.encounterSitesByFunctionKeyword.${index}.sites`, pool.sites)
  })
}

function validateGuAndNarrative(): void {
  assertNonEmpty('gu.intensityTable', guIntensityTable)
  assertNonEmpty('gu.bleedLocations', bleedLocationTable)
  assertNonEmpty('gu.bleedBehaviors', bleedBehaviorTable)
  assertNonEmpty('gu.resources', guResourceTable)
  assertNonEmpty('gu.hazards', guHazardTable)
  assertNonEmpty('narrative.humanRemnants', humanRemnants)
  assertNonEmpty('narrative.remnantHooks', remnantHooks)
  assertNonEmpty('narrative.phenomena', phenomena)

  if (guIntensityTable.at(-1)?.max !== Number.POSITIVE_INFINITY) {
    addError('gu.intensityTable', 'Final intensity entry must be open-ended.')
  }
  if (bleedLocationTable.length !== 20) addError('gu.bleedLocations', `Expected d20 table with 20 entries; got ${bleedLocationTable.length}.`)
  if (bleedBehaviorTable.length !== 12) addError('gu.bleedBehaviors', `Expected d12 table with 12 entries; got ${bleedBehaviorTable.length}.`)
  if (guResourceTable.length !== 20) addError('gu.resources', `Expected d20 table with 20 entries; got ${guResourceTable.length}.`)
  if (guHazardTable.length !== 20) addError('gu.hazards', `Expected d20 table with 20 entries; got ${guHazardTable.length}.`)

  assertNoDuplicates('gu.bleedLocations', bleedLocationTable)
  assertNoDuplicates('gu.bleedBehaviors', bleedBehaviorTable)
  assertNoDuplicates('gu.resources', guResourceTable)
  assertNoDuplicates('gu.hazards', guHazardTable)
  assertNoDuplicates('narrative.humanRemnants', humanRemnants)
  assertNoDuplicates('narrative.remnantHooks', remnantHooks)
  assertNoDuplicates('narrative.phenomena', phenomena)

  warnIfThin('narrative.remnantHooks', remnantHooks.length, 20)
  warnIfThin('narrative.humanRemnants', humanRemnants.length, 20)
  warnIfThin('narrative.phenomena', phenomena.length, 30)
}

function validateMechanicalTables(): void {
  assertNonEmpty('stellar.realisticStarTypes', realisticStarTypes)
  assertNonEmpty('stellar.frontierStarTypes', frontierStarTypes)
  assertNonEmpty('stellar.ageStates', ageStates)
  assertNonEmpty('stellar.metallicities', metallicities)
  assertNonEmpty('stellar.reachabilityClasses', reachabilityClasses)
  assertNonEmpty('stellar.architectures', architectures)
  assertNonEmpty('mechanics.activityLabels', activityLabels)
  assertNonEmpty('mechanics.atmosphereTable', atmosphereTable)
  assertNonEmpty('mechanics.hydrosphereTable', hydrosphereTable)
  assertNonEmpty('mechanics.geologyTable', geologyTable)
  assertNonEmpty('mechanics.climateSourceTable', climateSourceTable)
  assertNonEmpty('mechanics.radiationTable', radiationTable)
  assertNonEmpty('mechanics.ringTypeTable', ringTypeTable)
  assertNonEmpty('mechanics.biospheres', biospheres)
  assertNonEmpty('mechanics.moonTypes', moonTypes)
  assertNonEmpty('mechanics.moonScales', moonScales)
  assertNonEmpty('mechanics.siteOptions', siteOptions)

  validateTableCoverage('stellar.realisticStarTypes', realisticStarTypes, 1, 100)
  validateTableCoverage('stellar.frontierStarTypes', frontierStarTypes, 1, 100)
  validateTableCoverage('stellar.ageStates', ageStates, 2, 12)
  validateTableCoverage('stellar.metallicities', metallicities, 2, 12)
  validateTableCoverage('stellar.reachabilityClasses', reachabilityClasses, 1, 12)
  validateTableCoverage('stellar.architectures', architectures, 2, 13)
  validateTableCoverage('mechanics.atmosphereTable', atmosphereTable, 1, 12)
  validateTableCoverage('mechanics.hydrosphereTable', hydrosphereTable, 1, 12)
  validateTableCoverage('mechanics.geologyTable', geologyTable, 1, 12)
  validateTableCoverage('mechanics.climateSourceTable', climateSourceTable, 1, 20)
  validateTableCoverage('mechanics.radiationTable', radiationTable, 1, 8)
  validateTableCoverage('mechanics.ringTypeTable', ringTypeTable, 1, 12)

  if (activityLabels.at(-1)?.max !== Number.POSITIVE_INFINITY) {
    addError('mechanics.activityLabels', 'Final activity label must be open-ended.')
  }

  assertNoDuplicates('mechanics.biospheres', biospheres)
  assertNoDuplicates('mechanics.moonTypes', moonTypes)
  assertNoDuplicates('mechanics.moonScales', moonScales)
  assertNoDuplicates('mechanics.siteOptions', siteOptions)
}

function printReport(): void {
  const locationCounts = locationCountsByCategory()

  console.log('Star System Generator Data Audit')
  console.log('')

  printSection('Names', [
    ['systemNameCores', systemNameCores.length],
    ['systemNameForms', systemNameForms.length],
    ['systemNamePatterns', systemNamePatterns.length],
    ['systemCatalogLabels', systemCatalogLabels.length],
    ['bodyNameCores', bodyNameCores.length],
    ['moonNameCores', moonNameCores.length],
    ['moonNameForms', moonNameForms.length],
  ])

  printSection('Body Name Forms', bodyCategories.map((category) => [category, bodyNameFormsByCategory[category]?.length ?? 0]))

  printSection('Settlement Pools', [
    ['siteCategories', settlementSiteCategories.length],
    ['authorities', settlementAuthorities.length],
    ['aiSituations', aiSituations.length],
    ['conditions', settlementConditions.length],
    ['tags', settlementTagOptions.length],
    ['tags with pressure text', `${settlementTagOptions.filter((tag) => tag.pressure.trim()).length}/${settlementTagOptions.length}`],
    ['tagPairHooks', Object.keys(settlementTagPairHooks).length],
    ['crises', settlementCrises.length],
    ['hiddenTruths', hiddenTruths.length],
    ['encounterSites', encounterSites.length],
    ['scaleTable', settlementScaleTable.length],
  ])

  printSection('Settlement Locations By Category', settlementSiteCategories.map((category) => [category, locationCounts[category]]))

  printSection('Built Forms By Category', settlementSiteCategories.map((category) => [category, builtForms.bySiteCategory[category]?.length ?? 0]))

  printSection('Function Pools', [
    ['survey', surveyFunctions.length],
    ['extraction', extractionFunctions.length],
    ['orbital', orbitalFunctions.length],
    ['route', routeFunctions.length],
    ['security', securityFunctions.length],
    ['civil', civilFunctions.length],
    ['biosphere', biosphereFunctions.length],
    ['surfaceIce', surfaceIceFunctions.length],
    ['giantOrbital', giantOrbitalFunctions.length],
    ['asteroidBase', asteroidBaseFunctions.length],
    ['moonBase', moonBaseFunctions.length],
    ['deepSpace', deepSpaceFunctions.length],
    ['mobile', mobileFunctions.length],
    ['restricted', restrictedFunctions.length],
  ])

  printSection('GU Pools', [
    ['intensityTable', guIntensityTable.length],
    ['bleedLocations', bleedLocationTable.length],
    ['bleedBehaviors', bleedBehaviorTable.length],
    ['resources', guResourceTable.length],
    ['hazards', guHazardTable.length],
  ])

  printSection('Play-Layer Narrative Pools', [
    ['humanRemnants', humanRemnants.length],
    ['remnantHooks', remnantHooks.length],
    ['phenomena', phenomena.length],
  ])

  printSection('Stellar And Route Tables', [
    ['realisticStarTypes', realisticStarTypes.length],
    ['frontierStarTypes', frontierStarTypes.length],
    ['ageStates', ageStates.length],
    ['metallicities', metallicities.length],
    ['reachabilityClasses', reachabilityClasses.length],
    ['architectures', architectures.length],
  ])

  printSection('Mechanical Tables', [
    ['activityLabels', activityLabels.length],
    ['atmosphereTable', atmosphereTable.length],
    ['hydrosphereTable', hydrosphereTable.length],
    ['geologyTable', geologyTable.length],
    ['climateSourceTable', climateSourceTable.length],
    ['radiationTable', radiationTable.length],
    ['ringTypeTable', ringTypeTable.length],
    ['biospheres', biospheres.length],
    ['moonTypes', moonTypes.length],
    ['moonScales', moonScales.length],
    ['siteOptions', siteOptions.length],
  ])

  console.log(`Structural errors: ${errors.length}`)
  if (errors.length > 0) errors.forEach((error) => console.log(formatFinding(error)))
  console.log('')

  console.log(`Thin pool warnings: ${warnings.length}`)
  if (warnings.length > 0) warnings.forEach((warning) => console.log(formatFinding(warning)))
}

validateNames()
validateSettlements()
validateGuAndNarrative()
validateMechanicalTables()
printReport()

if (errors.length > 0) {
  process.exitCode = 1
}
