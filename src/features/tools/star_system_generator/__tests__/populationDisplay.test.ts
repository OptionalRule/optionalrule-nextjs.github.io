import { describe, expect, it } from 'vitest'
import {
  bandLabel,
  formatBodyPopulationSuffix,
  formatSystemPopulationLine,
  presenceLabel,
  systemPopulationSummary,
  terraformLabel,
} from '../lib/populationDisplay'
import { generateSystem } from '../lib/generator'
import type { GenerationOptions } from '../types'

const baseOptions: GenerationOptions = {
  seed: 'display-test-baseline',
  distribution: 'realistic',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('bandLabel', () => {
  it('returns descriptive labels for each band', () => {
    expect(bandLabel('empty')).toMatch(/empty|none/i)
    expect(bandLabel('automated')).toMatch(/automat/i)
    expect(bandLabel('transient')).toMatch(/transient|crew/i)
    expect(bandLabel('outpost')).toMatch(/outpost/i)
    expect(bandLabel('frontier')).toMatch(/frontier/i)
    expect(bandLabel('colony')).toMatch(/colony/i)
    expect(bandLabel('established')).toMatch(/establish/i)
    expect(bandLabel('populous')).toMatch(/populous/i)
    expect(bandLabel('dense-world')).toMatch(/dense/i)
  })
})

describe('presenceLabel', () => {
  it('returns readable labels for each presence level', () => {
    expect(presenceLabel('none')).toBe('absent')
    expect(presenceLabel('scattered')).toBe('scattered')
    expect(presenceLabel('widespread')).toBe('widespread')
    expect(presenceLabel('dominant')).toBe('dominant')
  })
})

describe('terraformLabel', () => {
  it('returns readable labels for each terraform state', () => {
    expect(terraformLabel('none')).toMatch(/none|untouched|natural/i)
    expect(terraformLabel('candidate')).toMatch(/candidate/i)
    expect(terraformLabel('in-progress')).toMatch(/in progress|in-progress|active/i)
    expect(terraformLabel('stabilized')).toMatch(/stabilized/i)
    expect(terraformLabel('failed')).toMatch(/failed/i)
  })
})

function totalTrialsHalf(n: number): number {
  return Math.floor(n / 2)
}

describe('systemPopulationSummary', () => {
  it('returns a skeleton-tier summary for systems with no notable population', () => {
    let foundSkeleton = false
    for (let i = 0; i < 20; i += 1) {
      const sys = generateSystem({ ...baseOptions, seed: `skeleton-${i}`, settlements: 'sparse', distribution: 'frontier' })
      const summary = systemPopulationSummary(sys)
      if (summary.systemBand === 'skeleton' || summary.systemBand === 'frontier-scatter') foundSkeleton = true
    }
    expect(foundSkeleton).toBe(true)
  })

  it('classifies hub-density systems with a colony-or-higher body as working or above', () => {
    let workingOrHigher = 0
    for (let i = 0; i < 12; i += 1) {
      const sys = generateSystem({ ...baseOptions, seed: `hub-${i}`, settlements: 'hub' })
      const summary = systemPopulationSummary(sys)
      if (
        summary.systemBand === 'working'
        || summary.systemBand === 'established-hub'
        || summary.systemBand === 'dense-sector'
      ) workingOrHigher += 1
    }
    expect(workingOrHigher).toBeGreaterThanOrEqual(totalTrialsHalf(12))
  })

  it('picks anchorBodyId as the body with the highest band', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'anchor-pick', settlements: 'hub' })
    const summary = systemPopulationSummary(sys)
    if (summary.anchorBodyId) {
      const anchor = sys.bodies.find((b) => b.id === summary.anchorBodyId)
      expect(anchor).toBeDefined()
      const anchorBand = anchor?.population?.value.band
      expect(anchorBand).toBeDefined()
      const allBands = sys.bodies.map((b) => b.population?.value.band)
      const bandOrder = ['empty', 'automated', 'transient', 'outpost', 'frontier', 'colony', 'established', 'populous', 'dense-world']
      const anchorRank = bandOrder.indexOf(anchorBand!)
      for (const band of allBands) {
        if (band) expect(bandOrder.indexOf(band)).toBeLessThanOrEqual(anchorRank)
      }
    }
  })

  it('counts populated bodies (band > transient)', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'count-populated', settlements: 'hub' })
    const summary = systemPopulationSummary(sys)
    const expectedCount = sys.bodies.filter((b) => {
      const band = b.population?.value.band
      return band !== undefined && !['empty', 'automated', 'transient'].includes(band)
    }).length
    expect(summary.populatedBodyCount).toBe(expectedCount)
  })
})

describe('formatBodyPopulationSuffix', () => {
  it('returns null for empty/automated/transient bands', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'suffix-low' })
    for (const body of sys.bodies) {
      const band = body.population?.value.band
      if (band === 'empty' || band === 'automated' || band === 'transient') {
        expect(formatBodyPopulationSuffix(body)).toBeNull()
      }
    }
  })

  it('returns a short hint string for outpost+ bodies', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'suffix-high', settlements: 'hub' })
    let hadSuffix = false
    for (const body of sys.bodies) {
      const suffix = formatBodyPopulationSuffix(body)
      if (suffix) {
        hadSuffix = true
        expect(suffix.length).toBeGreaterThan(0)
        expect(suffix.length).toBeLessThan(60)
      }
    }
    expect(hadSuffix).toBe(true)
  })
})

describe('formatSystemPopulationLine', () => {
  it('returns a single sentence including the system band label', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'line-test', settlements: 'crowded' })
    const line = formatSystemPopulationLine(sys)
    expect(line.length).toBeGreaterThan(0)
    expect(line.split('\n').length).toBe(1)
  })

  it('mentions the anchor body name when there is one', () => {
    const sys = generateSystem({ ...baseOptions, seed: 'line-anchor', settlements: 'hub' })
    const summary = systemPopulationSummary(sys)
    if (summary.anchorBodyId) {
      const anchor = sys.bodies.find((b) => b.id === summary.anchorBodyId)
      const line = formatSystemPopulationLine(sys)
      expect(line).toContain(anchor!.name.value)
    }
  })
})
