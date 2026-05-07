import { describe, expect, it } from 'vitest'
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
  bodySites,
  allBodySites,
} from '../lib/generator/data/mechanics'
import {
  ageStates,
  architectures,
  frontierStarTypes,
  metallicities,
  reachabilityClasses,
  realisticStarTypes,
} from '../lib/generator/data/stellar'

function expectTableCoverage(table: Array<{ min: number; max: number }>, min: number, max: number): void {
  const covered = new Set<number>()
  for (const entry of table) {
    for (let roll = entry.min; roll <= entry.max; roll++) {
      expect(covered.has(roll), `duplicate roll ${roll}`).toBe(false)
      covered.add(roll)
    }
  }

  for (let roll = min; roll <= max; roll++) {
    expect(covered.has(roll), `missing roll ${roll}`).toBe(true)
  }
}

describe('star system mechanical data', () => {
  it('has complete stellar and architecture roll tables', () => {
    expectTableCoverage(realisticStarTypes, 1, 100)
    expectTableCoverage(frontierStarTypes, 1, 100)
    expectTableCoverage(ageStates, 2, 12)
    expectTableCoverage(metallicities, 2, 12)
    expectTableCoverage(reachabilityClasses, 1, 12)
    expectTableCoverage(architectures, 2, 13)
  })

  it('has complete environment, moon, and ring roll tables', () => {
    expect(activityLabels.at(-1)?.max).toBe(Number.POSITIVE_INFINITY)
    expectTableCoverage(atmosphereTable, 1, 12)
    expectTableCoverage(hydrosphereTable, 1, 12)
    expectTableCoverage(geologyTable, 1, 12)
    expectTableCoverage(climateSourceTable, 1, 20)
    expectTableCoverage(radiationTable, 1, 8)
    expectTableCoverage(ringTypeTable, 1, 12)
    expect(biospheres.length).toBeGreaterThan(0)
    expect(moonTypes.length).toBeGreaterThan(0)
    expect(moonScales.length).toBeGreaterThan(0)
    expect(allBodySites.length).toBeGreaterThanOrEqual(80)
    expect(new Set(allBodySites).size).toBe(allBodySites.length)
    expect(bodySites.any.length).toBeGreaterThanOrEqual(15)
    expect(bodySites.terrestrial.length).toBeGreaterThanOrEqual(12)
    expect(bodySites.envelope.length).toBeGreaterThanOrEqual(8)
    expect(bodySites.minor.length).toBeGreaterThanOrEqual(10)
    expect(bodySites.anomaly.length).toBeGreaterThanOrEqual(6)
    expect(bodySites.rogueCaptured.length).toBeGreaterThanOrEqual(6)
  })
})
