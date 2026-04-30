import { describe, expect, it } from 'vitest'
import type { BodyCategory } from '../types'
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
} from '../lib/generator/data/names'

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

describe('star system name data', () => {
  it('exposes complete non-empty name pools', () => {
    expect(systemNameCores.length).toBeGreaterThan(0)
    expect(systemNameCores.every((name) => !/\s/.test(name))).toBe(true)
    expect(systemNameCores.every((name) => /^[\x20-\x7E]+$/.test(name))).toBe(true)
    expect(systemNameForms.length).toBeGreaterThan(0)
    expect(systemNamePatterns).toEqual(['possessive', 'compound', 'numeric', 'catalog', 'route'])
    expect(systemCatalogLabels.length).toBeGreaterThan(0)
    expect(bodyNameCores.length).toBeGreaterThan(0)
    expect(moonNameCores.length).toBeGreaterThan(0)
    expect(moonNameForms.length).toBeGreaterThan(0)
  })

  it('has body name forms for every body category', () => {
    for (const category of bodyCategories) {
      expect(bodyNameFormsByCategory[category]?.length, category).toBeGreaterThan(0)
    }
  })

  it('has settlement name descriptor fallbacks', () => {
    expect(settlementNameDescriptors.function.rules.length).toBeGreaterThan(0)
    expect(settlementNameDescriptors.function.default).toBeTruthy()
    expect(settlementNameDescriptors.category.default).toBeTruthy()
    expect(settlementNameDescriptors.authority.rules.length).toBeGreaterThan(0)
    expect(settlementNameDescriptors.authority.default).toBeTruthy()
    expect(settlementNameDescriptors.scale.rules.length).toBeGreaterThan(0)
    expect(settlementNameDescriptors.scale.default).toBeTruthy()
    expect(settlementNameDescriptors.scale.exact['Automated only']).toBeTruthy()
    expect(settlementNameDescriptors.scale.exact.Abandoned).toBeTruthy()
  })
})
