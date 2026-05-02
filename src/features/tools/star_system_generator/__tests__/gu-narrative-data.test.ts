import { describe, expect, it } from 'vitest'
import {
  bleedBehaviorTable,
  bleedLocationTable,
  guHazardTable,
  guIntensityTable,
  guResourceTable,
} from '../lib/generator/data/gu'
import { humanRemnants, phenomena, remnantHooks } from '../lib/generator/data/narrative'
import { narrativeStructures, narrativeVariablePools } from '../lib/generator/data/narrative'

describe('star system GU and narrative data', () => {
  it('has complete GU roll tables', () => {
    expect(guIntensityTable.length).toBeGreaterThan(0)
    expect(guIntensityTable.at(-1)?.max).toBe(Number.POSITIVE_INFINITY)
    expect(bleedLocationTable).toHaveLength(20)
    expect(bleedBehaviorTable).toHaveLength(12)
    expect(guResourceTable).toHaveLength(20)
    expect(guHazardTable).toHaveLength(20)
    expect(guHazardTable.at(-1)).toBe('Systemic cascade')
  })

  it('has playable remnant and phenomenon pools', () => {
    expect(humanRemnants.length).toBeGreaterThan(0)
    expect(remnantHooks.length).toBeGreaterThan(0)
    expect(phenomena.length).toBeGreaterThan(0)

    for (const phenomenon of phenomena) {
      expect(phenomenon.label).toBeTruthy()
      expect(['gu-layer', 'human-layer', 'inferred']).toContain(phenomenon.confidence)
      expect(phenomenon.travelEffect).toBeTruthy()
      expect(phenomenon.surveyQuestion).toBeTruthy()
      expect(phenomenon.conflictHook).toBeTruthy()
      expect(phenomenon.sceneAnchor).toBeTruthy()
      expect([
        phenomenon.label,
        phenomenon.travelEffect,
        phenomenon.surveyQuestion,
        phenomenon.conflictHook,
        phenomenon.sceneAnchor,
      ].join(' ').toLowerCase()).not.toMatch(/\b(?:alien|native civilization|ancient cities|artifact|relic|megastructure)\b/)
    }
  })

  it('has complete narrative structures and variable pools', () => {
    expect(narrativeStructures.length).toBeGreaterThan(0)

    for (const structure of narrativeStructures) {
      expect(structure.id).toBeTruthy()
      expect(structure.label).toBeTruthy()
      expect(structure.template).toContain('{')

      const templateSlots = [...structure.template.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1])
      expect(templateSlots.length).toBeGreaterThan(0)
      expect(Object.keys(structure.slots).sort()).toEqual([...templateSlots].sort())

      for (const poolName of Object.values(structure.slots)) {
        expect(narrativeVariablePools[poolName]?.length, poolName).toBeGreaterThan(0)
      }
    }
  })
})
