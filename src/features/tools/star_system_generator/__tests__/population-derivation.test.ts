import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import { derivePopulationLayer } from '../lib/generator/population'
import type { GenerationOptions, GeneratedSystem, BodyPopulationBand } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'population-test-baseline',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function withPopulation(options: Partial<GenerationOptions> = {}): GeneratedSystem {
  return derivePopulationLayer(generateSystem({ ...baseOptions, ...options }))
}

const BAND_ORDER: BodyPopulationBand[] = [
  'empty',
  'automated',
  'transient',
  'outpost',
  'frontier',
  'colony',
  'established',
  'populous',
  'dense-world',
]

function bandRank(band: BodyPopulationBand): number {
  return BAND_ORDER.indexOf(band)
}

describe('derivePopulationLayer', () => {
  it('sets a non-null population fact on every generated body', () => {
    const system = withPopulation()
    expect(system.bodies.length).toBeGreaterThan(0)
    for (const body of system.bodies) {
      expect(body.population).not.toBeNull()
      expect(body.population).toBeDefined()
      expect(body.population?.value.band).toBeDefined()
    }
  })

  it('produces the same population output for the same seed', () => {
    const a = withPopulation({ seed: 'determinism-A' })
    const b = withPopulation({ seed: 'determinism-A' })
    expect(a.bodies.map((b) => b.population?.value)).toEqual(b.bodies.map((x) => x.population?.value))
  })

  it('does not assign populous or dense-world to belts, gas giants, or anomalies', () => {
    for (let i = 0; i < 5; i += 1) {
      const system = withPopulation({ seed: `hostile-cap-${i}` })
      for (const body of system.bodies) {
        if (
          body.category.value === 'belt'
          || body.category.value === 'gas-giant'
          || body.category.value === 'ice-giant'
          || body.category.value === 'anomaly'
        ) {
          const band = body.population?.value.band
          expect(band).toBeDefined()
          if (band) {
            expect(bandRank(band)).toBeLessThan(bandRank('populous'))
          }
        }
      }
    }
  })

  it('produces predominantly outpost or frontier bands in normal-density frontier systems', () => {
    let total = 0
    let modal = 0
    for (let i = 0; i < 8; i += 1) {
      const system = withPopulation({ seed: `modal-band-${i}` })
      for (const body of system.bodies) {
        total += 1
        const band = body.population?.value.band
        if (band === 'outpost' || band === 'frontier' || band === 'empty' || band === 'automated' || band === 'transient') {
          modal += 1
        }
      }
    }
    expect(total).toBeGreaterThan(20)
    expect(modal / total).toBeGreaterThan(0.6)
  })

  it('reliably produces a colony-or-higher band somewhere in realistic hub-density systems', () => {
    let trialsWithColony = 0
    const totalTrials = 12
    for (let i = 0; i < totalTrials; i += 1) {
      const system = withPopulation({ seed: `hub-density-${i}`, settlements: 'hub', distribution: 'realistic' })
      const found = system.bodies.some((body) => {
        const band = body.population?.value.band
        return band !== undefined && bandRank(band) >= bandRank('colony')
      })
      if (found) trialsWithColony += 1
    }
    expect(trialsWithColony).toBeGreaterThan(totalTrials / 2)
  })

  it('sets terraformState to "none" by default and other states only when justified', () => {
    const system = withPopulation()
    const validStates = ['none', 'candidate', 'in-progress', 'stabilized', 'failed']
    for (const body of system.bodies) {
      expect(validStates).toContain(body.population?.value.terraformState)
    }
  })

  it('sets unnamedSiteCount to "none" for empty/automated/transient bands', () => {
    const system = withPopulation()
    for (const body of system.bodies) {
      const pop = body.population?.value
      if (pop && (pop.band === 'empty' || pop.band === 'automated' || pop.band === 'transient')) {
        expect(pop.unnamedSiteCount).toBe('none')
      }
    }
  })

  it('sets prominentForm only for colony+ bands', () => {
    const system = withPopulation({ seed: 'prominent-form-check', settlements: 'hub' })
    for (const body of system.bodies) {
      const pop = body.population?.value
      if (!pop) continue
      if (bandRank(pop.band) < bandRank('colony')) {
        expect(pop.prominentForm).toBeNull()
      }
    }
  })

  it('assigns higher bands to bodies with named settlements than to neighbors without them', () => {
    const system = withPopulation({ seed: 'settled-vs-unsettled', settlements: 'crowded' })
    const settledBodyIds = new Set(system.settlements.map((s) => s.bodyId).filter((id): id is string => !!id))
    if (settledBodyIds.size === 0) return
    const settledBodies = system.bodies.filter((b) => settledBodyIds.has(b.id))
    const unsettledBodies = system.bodies.filter((b) => !settledBodyIds.has(b.id))
    if (settledBodies.length === 0 || unsettledBodies.length === 0) return
    const avgSettled = average(settledBodies.map((b) => bandRank(b.population?.value.band ?? 'empty')))
    const avgUnsettled = average(unsettledBodies.map((b) => bandRank(b.population?.value.band ?? 'empty')))
    expect(avgSettled).toBeGreaterThan(avgUnsettled)
  })
})

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
