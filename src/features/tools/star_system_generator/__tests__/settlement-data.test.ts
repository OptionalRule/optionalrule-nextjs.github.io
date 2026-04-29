import { describe, expect, it } from 'vitest'
import {
  builtForms,
  encounterSites,
  encounterSitesByFunctionKeyword,
  encounterSitesByScale,
  guFractureFunctionsBySiteCategory,
  hiddenTruthByScale,
  settlementAuthorityByScale,
  settlementConditionByScale,
  settlementCrisisByScale,
  settlementLocations,
  settlementScaleTable,
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
  })

  it('keeps scale and contextual override pools usable', () => {
    expect(settlementScaleTable).toHaveLength(12)

    for (const scale of ['Automated only', 'Abandoned']) {
      expect(settlementAuthorityByScale[scale]?.length, `${scale} authority`).toBeGreaterThan(0)
      expect(settlementConditionByScale[scale]?.length, `${scale} condition`).toBeGreaterThan(0)
      expect(settlementCrisisByScale[scale]?.length, `${scale} crisis`).toBeGreaterThan(0)
      expect(hiddenTruthByScale[scale]?.length, `${scale} hidden truth`).toBeGreaterThan(0)
      expect(encounterSitesByScale[scale]?.length, `${scale} encounter sites`).toBeGreaterThan(0)
    }

    expect(encounterSites.length).toBeGreaterThan(0)
    for (const pool of encounterSitesByFunctionKeyword) {
      expect(pool.keywords.length).toBeGreaterThan(0)
      expect(pool.sites.length).toBeGreaterThan(0)
    }
  })
})
