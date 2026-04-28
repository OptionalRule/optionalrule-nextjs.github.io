import { describe, expect, it } from 'vitest'
import type { GeneratedSystem, GenerationOptions, PartialKnownSystem } from '../types'
import { generateSystem } from '../lib/generator'

const options: GenerationOptions = {
  seed: 'orbit-refinement',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

const corpus = Array.from({ length: 900 }, (_, index) =>
  generateSystem({ ...options, seed: `orbit-refinement-${index.toString(16).padStart(4, '0')}` })
)

function systemsFor(architectureName: string): GeneratedSystem[] {
  return corpus.filter((system) => system.architecture.name.value === architectureName)
}

function outermost(system: GeneratedSystem): number {
  return Math.max(...system.bodies.map((body) => body.orbitAu.value))
}

function outerSnowRatio(system: GeneratedSystem): number {
  return outermost(system) / system.zones.snowLineAu.value
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

function mutualHillSpacingRatio(system: GeneratedSystem, leftIndex: number): number | null {
  const left = system.bodies[leftIndex]
  const right = system.bodies[leftIndex + 1]
  if (!left || !right) return null
  const leftMass = left.physical.massEarth.value
  const rightMass = right.physical.massEarth.value
  if (typeof leftMass !== 'number' || typeof rightMass !== 'number') return null

  const stellarMassEarth = system.primary.massSolar.value * 332946
  const averageOrbit = (left.orbitAu.value + right.orbitAu.value) / 2
  const mutualHillRadius = averageOrbit * ((leftMass + rightMass) / (3 * stellarMassEarth)) ** (1 / 3)
  return (right.orbitAu.value - left.orbitAu.value) / mutualHillRadius
}

describe('orbit refinement', () => {
  it('keeps generated orbit lists sorted and separated', () => {
    for (const system of corpus.slice(0, 160)) {
      const orbits = system.bodies.map((body) => body.orbitAu.value)
      expect(orbits).toEqual([...orbits].sort((left, right) => left - right))

      for (let index = 1; index < orbits.length; index += 1) {
        expect(orbits[index] - orbits[index - 1]).toBeGreaterThanOrEqual(Math.max(0.01, orbits[index - 1] * 0.02))
      }
    }
  })

  it('places solar-ish belts and giants around or beyond the snow line', () => {
    const systems = systemsFor('Solar-ish mixed')
    expect(systems.length).toBeGreaterThan(20)

    const anchorBodies = systems.flatMap((system) =>
      system.bodies
        .filter((body) => body.category.value === 'belt' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant')
        .map((body) => body.orbitAu.value / system.zones.snowLineAu.value)
    )

    expect(anchorBodies.length).toBeGreaterThan(20)
    expect(median(anchorBodies)).toBeGreaterThanOrEqual(1)
    expect(systems.filter((system) => outerSnowRatio(system) >= 1.8).length / systems.length).toBeGreaterThan(0.9)
  })

  it('does not let minor-body belts shove solar-ish giants into implausibly late outer slots', () => {
    const system = generateSystem({ ...options, seed: 'eafcd0e96a4d804f' })
    const snowLine = system.zones.snowLineAu.value
    const giants = system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant')

    expect(system.architecture.name.value).toBe('Solar-ish mixed')
    expect(giants.length).toBeGreaterThan(0)
    expect(Math.min(...giants.map((body) => body.orbitAu.value / snowLine))).toBeLessThanOrEqual(2)
  })

  it('extends giant-rich systems beyond the snow line', () => {
    const systems = systemsFor('Giant-rich or chaotic')
    expect(systems.length).toBeGreaterThan(10)

    expect(median(systems.map(outerSnowRatio))).toBeGreaterThan(3)
    expect(systems.filter((system) => outerSnowRatio(system) >= 1.8).length / systems.length).toBeGreaterThan(0.9)
  })

  it('preserves compact and peas-in-a-pod systems as close-in architectures', () => {
    const compactSystems = [...systemsFor('Compact inner system'), ...systemsFor('Peas-in-a-pod chain')]
    expect(compactSystems.length).toBeGreaterThan(80)

    expect(median(compactSystems.map(outerSnowRatio))).toBeLessThan(2)
  })

  it('keeps compact-chain sub-Neptunes modest and adjacent full planets well spaced by mutual Hill radius', () => {
    const compactSystems = [...systemsFor('Compact inner system'), ...systemsFor('Peas-in-a-pod chain')]
    const compactSubNeptunes = compactSystems.flatMap((system) =>
      system.bodies.filter((body) => body.category.value === 'sub-neptune')
    )

    expect(compactSubNeptunes.length).toBeGreaterThan(0)
    expect(compactSubNeptunes.every((body) => typeof body.physical.massEarth.value === 'number' && body.physical.massEarth.value <= 9)).toBe(true)

    const exemplar = generateSystem({ ...options, seed: 'ce3684a2efa38103' })
    expect(exemplar.architecture.name.value).toBe('Compact inner system')
    expect(exemplar.bodies.at(-1)?.physical.massEarth.value).toBeLessThan(9)

    for (let index = 0; index < exemplar.bodies.length - 1; index += 1) {
      const ratio = mutualHillSpacingRatio(exemplar, index)
      if (ratio !== null) expect(ratio).toBeGreaterThan(14)
    }
  })

  it('allows sparse, debris-dominated, and failed systems to produce outer remnants', () => {
    for (const architecture of ['Sparse rocky', 'Debris-dominated', 'Failed system']) {
      const systems = systemsFor(architecture)
      expect(systems.length).toBeGreaterThan(0)
      expect(systems.some((system) => outerSnowRatio(system) >= 6)).toBe(true)
    }
  })

  it('does not round positive brown dwarf luminosity down to zero', () => {
    const brownDwarfSystems = corpus.filter((system) => system.primary.spectralType.value === 'Brown dwarf/substellar primary')

    expect(brownDwarfSystems.length).toBeGreaterThan(0)
    expect(brownDwarfSystems.every((system) => system.primary.luminositySolar.value > 0)).toBe(true)
  })

  it('preserves locked imported orbits even when they sit outside the generated band', () => {
    const knownSystem: PartialKnownSystem = {
      primary: {
        spectralType: { value: 'G2V', confidence: 'confirmed', source: 'Test catalog', locked: true },
        massSolar: { value: 1, confidence: 'confirmed', source: 'Test catalog', locked: true },
        luminositySolar: { value: 1, confidence: 'confirmed', source: 'Test catalog', locked: true },
      },
      bodies: [
        {
          id: 'known-distant-body',
          orbitAu: { value: 80, confidence: 'confirmed', source: 'Test catalog', locked: true },
          name: { value: 'Known Distant Body', confidence: 'confirmed', source: 'Test catalog', locked: true },
          category: { value: 'dwarf-body', confidence: 'confirmed', source: 'Test catalog', locked: true },
          bodyClass: { value: 'Dwarf planet', confidence: 'confirmed', source: 'Test catalog', locked: true },
          massClass: { value: 'Dwarf body', confidence: 'confirmed', source: 'Test catalog', locked: true },
        },
      ],
    }

    const system = generateSystem({ ...options, seed: 'locked-distant-orbit' }, knownSystem)
    const known = system.bodies.find((body) => body.id === 'known-distant-body')

    expect(known?.orbitAu).toEqual(knownSystem.bodies?.[0].orbitAu)
    expect(known?.filterNotes.some((note) => note.value.includes('locked catalog orbit preserved'))).toBe(true)
  })
})
