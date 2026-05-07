import { describe, expect, it } from 'vitest'
import {
  builtForms,
  encounterSites,
  encounterSitesByFunctionKeyword,
  encounterSitesByHabitationPattern,
  encounterSitesByPopulationBand,
  guFractureFunctionsBySiteCategory,
  habitationPatternDefaults,
  hiddenTruthByHabitationPattern,
  settlementAuthorityByHabitationPattern,
  settlementConditionByHabitationPattern,
  settlementCrisisByHabitationPattern,
  settlementCrisisByPopulationBand,
  settlementLocations,
  settlementPopulationTable,
  settlementSiteCategories,
  settlementTagOptions,
  settlementTagPairHooks,
  settlementTagPressures,
  settlementTags,
} from '../lib/generator/data/settlements'

describe('star system settlement data', () => {
  it('has location, GU function, and built-form pools for every site category', () => {
    const locationsByCategory = new Map(settlementSiteCategories.map((category) => [category, 0]))

    Object.values(settlementLocations).flat().forEach((location) => {
      locationsByCategory.set(location.category, (locationsByCategory.get(location.category) ?? 0) + 1)
    })

    for (const category of settlementSiteCategories) {
      expect(locationsByCategory.get(category), `${category} locations`).toBeGreaterThan(0)
      expect(guFractureFunctionsBySiteCategory[category]?.length, `${category} GU functions`).toBeGreaterThan(0)
      expect(builtForms.bySiteCategory[category]?.length, `${category} built forms`).toBeGreaterThan(0)
    }
  })

  it('has complete settlement tag metadata', () => {
    expect(settlementTagOptions.length).toBeGreaterThan(0)
    expect(new Set(settlementTagOptions.map((tag) => tag.id)).size).toBe(settlementTagOptions.length)
    expect(new Set(settlementTags).size).toBe(settlementTags.length)

    for (const tag of settlementTagOptions) {
      expect(tag.label).toBeTruthy()
      expect(tag.pressure).toBeTruthy()
      expect(settlementTagPressures[tag.label]).toBe(tag.pressure)
    }

    for (const pair of Object.keys(settlementTagPairHooks)) {
      const [obviousTag, deeperTag] = pair.split(' + ')
      expect(settlementTags).toContain(obviousTag)
      expect(settlementTags).toContain(deeperTag)
    }

    expect(Object.keys(settlementTagPairHooks).length).toBeGreaterThanOrEqual(55)

    const civicScales = ['civic', 'remote', 'neutral'] as const
    for (const tag of settlementTagOptions) {
      if (tag.civicScale !== undefined) {
        expect(civicScales).toContain(tag.civicScale)
      }
    }
    const civicCount = settlementTagOptions.filter((tag) => tag.civicScale === 'civic').length
    const remoteCount = settlementTagOptions.filter((tag) => tag.civicScale === 'remote').length
    expect(civicCount).toBeGreaterThan(0)
    expect(remoteCount).toBeGreaterThan(0)
    expect(civicCount).toBeLessThan(settlementTagOptions.length / 2)
    expect(remoteCount).toBeLessThan(settlementTagOptions.length / 2)
  })

  it('keeps population, habitation pattern, and contextual override pools usable', () => {
    expect(settlementPopulationTable).toHaveLength(10)

    for (const category of settlementSiteCategories) {
      expect(habitationPatternDefaults[category], `${category} default`).toBeTruthy()
    }

    for (const pattern of ['Automated', 'Abandoned'] as const) {
      expect(settlementAuthorityByHabitationPattern[pattern]?.length, `${pattern} authority`).toBeGreaterThan(0)
      expect(settlementConditionByHabitationPattern[pattern]?.length, `${pattern} condition`).toBeGreaterThan(0)
      expect(settlementCrisisByHabitationPattern[pattern]?.length, `${pattern} crisis`).toBeGreaterThan(0)
      expect(hiddenTruthByHabitationPattern[pattern]?.length, `${pattern} hidden truth`).toBeGreaterThan(0)
      expect(encounterSitesByHabitationPattern[pattern]?.length, `${pattern} encounter sites`).toBeGreaterThan(0)
    }

    expect(encounterSites.length).toBeGreaterThan(0)
    for (const pool of encounterSitesByFunctionKeyword) {
      expect(pool.keywords.length).toBeGreaterThan(0)
      expect(pool.sites.length).toBeGreaterThan(0)
    }

    expect(encounterSitesByPopulationBand.urban?.length).toBeGreaterThan(0)
    expect(encounterSitesByPopulationBand.town?.length).toBeGreaterThan(0)
    expect(encounterSitesByPopulationBand.outpost?.length).toBeGreaterThan(0)
    expect(settlementCrisisByPopulationBand.urban?.length).toBeGreaterThan(0)
    expect(settlementCrisisByPopulationBand.outpost?.length).toBeGreaterThan(0)

    for (const sites of Object.values(encounterSitesByPopulationBand)) {
      for (const site of sites) {
        expect(encounterSites).toContain(site)
      }
    }

    for (const pool of encounterSitesByFunctionKeyword) {
      for (const site of pool.sites) {
        expect(encounterSites, `keyword pool ${pool.keywords.join('|')}`).toContain(site)
      }
    }

    for (const sites of Object.values(encounterSitesByHabitationPattern)) {
      for (const site of sites) {
        expect(encounterSites).toContain(site)
      }
    }
  })
})
