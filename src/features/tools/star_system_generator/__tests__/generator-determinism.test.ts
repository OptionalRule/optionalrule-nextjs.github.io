import { describe, expect, it } from 'vitest'
import type { GenerationOptions } from '../types'
import { applyNoAlienTextGuard, generateSystem } from '../lib/generator'

const options: GenerationOptions = {
  seed: '7f3a9c2e41b8d09a',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('generateSystem', () => {
  it('returns identical systems for the same seed and options', () => {
    expect(generateSystem(options)).toEqual(generateSystem(options))
  })

  it('changes output for a different seed', () => {
    const first = generateSystem(options)
    const second = generateSystem({ ...options, seed: '1111111111111111' })

    expect(second).not.toEqual(first)
  })

  it('includes required MVP layers and passes the no-alien check', () => {
    const system = generateSystem(options)

    expect(system.name.value).toBeTruthy()
    expect(system.primary.spectralType.value).toBeTruthy()
    expect(system.reachability.className.confidence).toBe('gu-layer')
    expect(system.bodies.length).toBeGreaterThanOrEqual(2)
    expect(system.bodies[0].category.value).toBeTruthy()
    expect(system.bodies[0].massClass.value).toBeTruthy()
    expect(system.bodies[0].whyInteresting.value).toBeTruthy()
    expect(system.bodies[0].whyInteresting.source).toContain('body interest')
    expect(system.bodies[0].detail.atmosphere.value).toBeTruthy()
    expect(system.bodies[0].detail.hydrosphere.value).toBeTruthy()
    expect(system.bodies[0].physical.radiusEarth.value).toBeGreaterThan(0)
    expect(system.bodies[0].physical.gravityLabel.value).toBeTruthy()
    expect(system.bodies[0].physical.periodDays.value).toBeGreaterThan(0)
    expect(Array.isArray(system.bodies[0].filterNotes)).toBe(true)
    expect(Array.isArray(system.bodies[0].moons)).toBe(true)
    for (const moon of system.bodies.flatMap((body) => body.moons)) {
      expect(moon.scale.value).toBeTruthy()
      expect(moon.resource.value).toBeTruthy()
      expect(moon.hazard.value).toBeTruthy()
      expect(moon.use.value).toBeTruthy()
    }
    expect(system.guOverlay.hazard.confidence).toBe('gu-layer')
    expect(system.noAlienCheck.passed).toBe(true)
    expect(system.bodies.map((body) => body.bodyClass.value.toLowerCase())).not.toContain('alien artifact')
  })

  it('converts old alien-style mystery labels into MASS-GU sources', () => {
    const guarded = applyNoAlienTextGuard('Alien ruin, alien artifact, alien signal, alien megastructure, and forbidden archaeology.')

    expect(guarded.value).toBe('first-wave human ruins, natural GU formations, encrypted human beacons, failed Iggygate collars, and deleted expedition archive.')
    expect(guarded.conversions).toEqual([
      'alien ruin -> first-wave human ruin',
      'alien artifact -> natural GU formation',
      'alien signal -> encrypted human beacon',
      'alien megastructure -> failed Iggygate collar',
      'forbidden archaeology -> deleted expedition archive',
    ])
  })

  it('does not leave forbidden alien mystery phrases in generated playable layers', () => {
    const forbiddenPhrases = [
      'alien civilization',
      'alien ruin',
      'alien artifact',
      'alien signal',
      'alien megastructure',
      'forbidden archaeology',
      'native civilization',
      'ancient cities',
      'alien machine',
      'nonhuman signal',
    ]

    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, seed: `aa3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      const playableOutput = JSON.stringify({
        bodies: system.bodies,
        settlements: system.settlements,
        ruins: system.ruins,
        phenomena: system.phenomena,
        majorHazards: system.majorHazards,
      }).toLowerCase()

      for (const phrase of forbiddenPhrases) {
        expect(playableOutput).not.toContain(phrase)
      }
    }
  })

  it('constrains furnace and inferno world environments', () => {
    const forbiddenExtremeHotVolatiles = new Set([
      'Local seas',
      'Ocean-continent balance',
      'Ice-shell subsurface ocean',
      'Hydrocarbon lakes/seas',
      'Subsurface ice',
      'Polar caps / buried glaciers',
      'Briny aquifers',
    ])
    const forbiddenExtremeHotAtmospheres = new Set([
      'Thin CO2/N2',
      'Moderate inert atmosphere',
      'Moderate toxic atmosphere',
      'Dense greenhouse',
      'Steam atmosphere',
    ])

    for (let index = 0; index < 20; index++) {
      const system = generateSystem({ ...options, seed: `7f3a9c2e41b8d0${index.toString(16).padStart(2, '0')}` })
      for (const body of system.bodies) {
        if (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno') {
          expect(forbiddenExtremeHotVolatiles.has(body.detail.hydrosphere.value)).toBe(false)
          expect(forbiddenExtremeHotAtmospheres.has(body.detail.atmosphere.value)).toBe(false)
        }
      }
    }
  })

  it('keeps body details consistent with broad category and thermal zone', () => {
    const impossibleExtremeHotClimates = new Set([
      'Cold desert',
      'Snowball',
      'Methane cycle',
      'CO2 glacier cycle',
      'Twilight ocean',
    ])
    const impossibleColdClimates = new Set([
      'Runaway greenhouse',
      'Moist greenhouse edge',
      'Hot desert',
      'Hypercanes',
    ])

    for (let index = 0; index < 40; index++) {
      const system = generateSystem({ ...options, seed: `a13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const body of system.bodies) {
        if (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno') {
          expect(body.moons).toHaveLength(0)
          expect(body.detail.climate.some((tag) => impossibleExtremeHotClimates.has(tag.value))).toBe(false)
          expect(body.detail.biosphere.value).toBe('Sterile')
        }

        if (
          (body.thermalZone.value === 'Cold' || body.thermalZone.value === 'Cryogenic' || body.thermalZone.value === 'Dark') &&
          body.category.value !== 'gas-giant' &&
          body.category.value !== 'ice-giant' &&
          body.category.value !== 'sub-neptune'
        ) {
          expect(body.detail.climate.some((tag) => impossibleColdClimates.has(tag.value))).toBe(false)
        }

        if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') {
          expect(body.detail.biosphere.value).toBe('Sterile')
          expect(body.detail.geology.value).not.toBe('Plate tectonic analogue')
        }

        if (body.category.value === 'belt') {
          expect(body.detail.geology.value).toBe('Minor-body rubble and collision families')
          expect(body.detail.atmosphere.value).toBe('None / dispersed volatiles')
          expect(body.physical.massEarth.value).toBeNull()
          expect(body.physical.surfaceGravityG.value).toBeNull()
          expect(body.physical.gravityLabel.value).toContain('Not applicable')
        }
      }
    }
  })

  it('estimates surface gravity where gravity is meaningful', () => {
    for (let index = 0; index < 50; index++) {
      const system = generateSystem({ ...options, seed: `e93f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const body of system.bodies) {
        if (body.category.value === 'belt' || body.category.value === 'anomaly') continue

        expect(body.physical.massEarth.value).toBeGreaterThan(0)
        expect(body.physical.surfaceGravityG.value).toBeGreaterThan(0)
        expect(body.physical.gravityLabel.value).toContain('g')

        if (body.category.value === 'rocky-planet' || body.category.value === 'super-earth') {
          expect(body.physical.gravityLabel.value).toContain('Estimated surface gravity')
        }

        if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') {
          expect(body.physical.gravityLabel.value).toContain('Cloud-top/envelope estimate')
        }
      }
    }
  })

  it('adds richer body profiles for belts, minor bodies, and anomalies', () => {
    const systems = Array.from({ length: 80 }, (_, index) =>
      generateSystem({ ...options, seed: `c93f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const profiledBodies = systems.flatMap((system) =>
      system.bodies.filter((body) =>
        body.category.value === 'belt' ||
        body.category.value === 'dwarf-body' ||
        body.category.value === 'rogue-captured' ||
        body.category.value === 'anomaly'
      )
    )

    expect(profiledBodies.length).toBeGreaterThan(0)
    for (const body of profiledBodies) {
      expect(body.bodyProfile?.value).toBeTruthy()
      expect(body.whyInteresting.value.length).toBeGreaterThan(20)
    }
  })

  it('includes expanded source-derived world classes across sampled seeds', () => {
    const classes = new Set(
      Array.from({ length: 120 }, (_, index) =>
        generateSystem({ ...options, seed: `d93f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      ).flatMap((system) => system.bodies.map((body) => body.bodyClass.value))
    )

    expect(classes.has('Failed terraforming site') || classes.has('Trojan settlement zone') || classes.has('GU-active habitable-zone anomaly')).toBe(true)
    expect(classes.has('Cometary swarm') || classes.has('Ancient impact family') || classes.has('Dark refueling body')).toBe(true)
  })

  it('generates a fuller orbital profile across frontier seeds', () => {
    const systems = Array.from({ length: 30 }, (_, index) =>
      generateSystem({ ...options, seed: `b13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const averageBodies = systems.reduce((sum, system) => sum + system.bodies.length, 0) / systems.length
    const systemsWithMoons = systems.filter((system) => system.bodies.some((body) => body.moons.length > 0)).length

    expect(averageBodies).toBeGreaterThanOrEqual(6)
    expect(systemsWithMoons).toBeGreaterThanOrEqual(10)
  })

  it('makes giant-bearing architectures actually include outer giants with moons', () => {
    const giantBearingSystems = Array.from({ length: 100 }, (_, index) =>
      generateSystem({ ...options, seed: `c13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    ).filter((system) => system.architecture.name.value === 'Giant-bearing system')

    expect(giantBearingSystems.length).toBeGreaterThan(0)
    for (const system of giantBearingSystems) {
      const giants = system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant')
      expect(giants.length).toBeGreaterThanOrEqual(1)
      expect(giants.some((body) => body.moons.length >= 2)).toBe(true)
      expect(giants.every((body) => body.giantEconomy?.value)).toBe(true)
    }
  })

  it('does not leave close-in Neptune-like worlds casual or unexplained', () => {
    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, seed: `d13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const body of system.bodies) {
        const isCloseInNeptuneLike =
          body.physical.closeIn.value &&
          ['Furnace', 'Inferno', 'Hot'].includes(body.thermalZone.value) &&
          (body.category.value === 'sub-neptune' || body.category.value === 'ice-giant')

        if (isCloseInNeptuneLike) {
          expect(body.filterNotes.some((note) => note.value.includes('Hot Neptune desert'))).toBe(true)
        }
      }
    }
  })

  it('adds M-dwarf habitability notes for temperate solid worlds', () => {
    const matchingBodies = Array.from({ length: 120 }, (_, index) =>
      generateSystem({ ...options, seed: `e13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    ).flatMap((system) =>
      system.primary.spectralType.value === 'M dwarf'
        ? system.bodies.filter((body) =>
            body.thermalZone.value === 'Temperate band' &&
            (body.category.value === 'rocky-planet' || body.category.value === 'super-earth')
          )
        : []
    )

    expect(matchingBodies.length).toBeGreaterThan(0)
    for (const body of matchingBodies) {
      expect(body.filterNotes.some((note) => note.value.includes('M-dwarf habitability'))).toBe(true)
      expect(body.filterNotes.some((note) => note.value.includes('M-dwarf atmosphere survival'))).toBe(true)
    }
  })

  it('marks compact chains with peas-in-a-pod notes', () => {
    const compactSystems = Array.from({ length: 100 }, (_, index) =>
      generateSystem({ ...options, seed: `f13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    ).filter((system) => system.architecture.name.value.includes('Compact'))

    expect(compactSystems.length).toBeGreaterThan(0)
    expect(compactSystems.some((system) => system.bodies.some((body) => body.filterNotes.some((note) => note.value.includes('Peas-in-a-pod'))))).toBe(true)
  })

  it('generates scored settlements, remnants, and phenomena for play', () => {
    const system = generateSystem(options)

    expect(system.settlements.length).toBeGreaterThan(0)
    for (const settlement of system.settlements) {
      expect(settlement.bodyId).toBeTruthy()
      expect(settlement.anchorKind.value).toBeTruthy()
      expect(settlement.anchorName.value).toBeTruthy()
      expect(settlement.anchorDetail.value).toBeTruthy()
      expect(settlement.whyHere.value).toContain(settlement.anchorName.value)
      expect(settlement.whyHere.source).toContain('MASS-GU 18.1')
      expect(settlement.siteCategory.value).toBeTruthy()
      expect(settlement.presence.score.value).toBeGreaterThan(0)
      expect(settlement.function.value).toBeTruthy()
      expect(settlement.builtForm.value).toBeTruthy()
      expect(settlement.aiSituation.value).toBeTruthy()
      expect(settlement.condition.value).toBeTruthy()
      expect(settlement.tags).toHaveLength(2)
      expect(settlement.tags[0].value).not.toBe(settlement.tags[1].value)
      expect(settlement.tagHook.value).toContain(settlement.tags[0].value)
      expect(settlement.tagHook.source).toContain('MASS-GU 18.9')
      expect(settlement.methodNotes.some((note) => note.value.includes('MASS-GU section 18'))).toBe(true)
      expect(settlement.hiddenTruth.value.toLowerCase()).not.toContain('alien')
      expect(settlement.encounterSites).toHaveLength(2)
    }

    expect(system.ruins.length).toBeGreaterThan(0)
    expect(system.phenomena.length).toBeGreaterThan(0)
    expect(JSON.stringify(system.ruins).toLowerCase()).not.toContain('alien')
  })

  it('varies settlement count by density and system context', () => {
    const densityBounds = {
      sparse: [0, 2],
      normal: [1, 4],
      crowded: [3, 6],
      hub: [4, 8],
    } as const
    const averages = new Map<string, number>()

    for (const [density, [min, max]] of Object.entries(densityBounds)) {
      const counts = Array.from({ length: 100 }, (_, index) =>
        generateSystem({
          ...options,
          settlements: density as GenerationOptions['settlements'],
          seed: `5e771e5${index.toString(16).padStart(8, '0')}`,
        }).settlements.length
      )

      expect(Math.min(...counts)).toBeGreaterThanOrEqual(min)
      expect(Math.max(...counts)).toBeLessThanOrEqual(max)
      expect(new Set(counts).size).toBeGreaterThan(1)
      averages.set(density, counts.reduce((sum, count) => sum + count, 0) / counts.length)
    }

    expect(averages.get('sparse')!).toBeLessThan(averages.get('normal')!)
    expect(averages.get('normal')!).toBeLessThan(averages.get('crowded')!)
    expect(averages.get('crowded')!).toBeLessThan(averages.get('hub')!)
  })

  it('does not generate duplicate settlement tag pairs', () => {
    for (let index = 0; index < 120; index++) {
      const system = generateSystem({ ...options, seed: `f93f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const settlement of system.settlements) {
        expect(settlement.tags[0].value).not.toBe(settlement.tags[1].value)
      }
    }
  })

  it('uses expanded section 18 settlement table sources', () => {
    const system = generateSystem(options)

    for (const settlement of system.settlements) {
      expect(settlement.authority.source).toContain('MASS-GU 18.5')
      expect(settlement.crisis.source).toContain('MASS-GU 18.10')
      expect(settlement.hiddenTruth.source).toContain('MASS-GU 18.11')
      expect(settlement.encounterSites.every((site) => site.source?.includes('MASS-GU 18.12'))).toBe(true)
    }
  })

  it('keeps settlement built forms compatible with location and function', () => {
    const allowedFormsByCategory = new Map([
      ['Surface settlement', new Set(['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster', 'Rail-linked terminator city', 'Aerostat city', 'Submarine habitat', 'Borehole habitat', 'Shielded military bunker', 'Corporate luxury enclave', 'First-wave retrofitted ruin'])],
      ['Moon base', new Set(['Buried pressure cans', 'Ice-shielded tunnels', 'Dome cluster', 'Borehole habitat', 'Shielded military bunker', 'First-wave retrofitted ruin'])],
      ['Asteroid or belt base', new Set(['Asteroid hollow', 'Buried pressure cans', 'Ice-shielded tunnels', 'Modular orbital lattice', 'Shielded military bunker', 'First-wave retrofitted ruin'])],
      ['Orbital station', new Set(['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster'])],
      ['Deep-space platform', new Set(['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster'])],
      ['Gate or route node', new Set(['Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Shielded military bunker', 'Partly self-growing programmable structure'])],
      ['Mobile site', new Set(['Inflatable modules', 'Crawling mobile base', 'Modular orbital lattice', 'Rotating cylinder', 'Shielded military bunker'])],
      ['Derelict or restricted site', new Set(['Asteroid hollow', 'Shielded military bunker', 'First-wave retrofitted ruin', 'Partly self-growing programmable structure'])],
    ])

    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, seed: `913f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const settlement of system.settlements) {
        expect(allowedFormsByCategory.get(settlement.siteCategory.value)?.has(settlement.builtForm.value)).toBe(true)
        expect(settlement.location.source).toContain('MASS-GU 18.3')
        expect(settlement.builtForm.source).toContain('MASS-GU built form table')
      }
    }
  })

  it('attaches moon bases to generated moons and explains site anchors', () => {
    for (let index = 0; index < 100; index++) {
      const system = generateSystem({ ...options, seed: `a93f9c2e41b8${index.toString(16).padStart(4, '0')}` })

      for (const settlement of system.settlements) {
        const body = system.bodies.find((candidate) => candidate.id === settlement.bodyId)
        expect(body).toBeTruthy()

        if (settlement.siteCategory.value === 'Moon base') {
          expect(settlement.moonId).toBeTruthy()
          expect(body?.moons.some((moon) => moon.id === settlement.moonId)).toBe(true)
          expect(settlement.anchorKind.value).toBe('major moon')
          expect(settlement.anchorName.value).toContain('moon of')
        }

        if (settlement.siteCategory.value === 'Surface settlement') {
          expect(settlement.anchorKind.value).toBe('body surface')
          expect(settlement.anchorName.value).toBe(body?.name.value)
        }

        expect(settlement.anchorDetail.value.length).toBeGreaterThan(20)
        expect(settlement.whyHere.value.length).toBeGreaterThan(20)
      }
    }
  })

  it('adds playable moon details and giant economy notes', () => {
    const systems = Array.from({ length: 80 }, (_, index) =>
      generateSystem({ ...options, seed: `b93f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const moons = systems.flatMap((system) => system.bodies.flatMap((body) => body.moons))
    const giants = systems.flatMap((system) => system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant'))

    expect(moons.length).toBeGreaterThan(0)
    for (const moon of moons) {
      expect(moon.moonType.source).toContain('MASS-GU 17')
      expect(moon.scale.source).toContain('moon scale')
      expect(moon.resource.source).toContain('moon resource')
      expect(moon.hazard.source).toContain('moon hazard')
      expect(moon.use.source).toContain('moon playable-use')
    }

    expect(giants.length).toBeGreaterThan(0)
    expect(giants.every((body) => body.giantEconomy?.value.includes('traffic'))).toBe(true)
  })
})
