import { describe, expect, it } from 'vitest'
import type { GenerationOptions } from '../types'
import { applyNoAlienTextGuard, architectureBodyPlanRules, generateSystem } from '../lib/generator'
import { architectures, frontierStarTypes, realisticStarTypes } from '../lib/generator/tables'

const options: GenerationOptions = {
  seed: '7f3a9c2e41b8d09a',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('generateSystem', () => {
  it('matches the source stellar generation tables', () => {
    const summarize = (table: typeof realisticStarTypes) =>
      table.map((entry) => [entry.min, entry.max, entry.value.type])

    expect(summarize(realisticStarTypes)).toEqual([
      [1, 1, 'O/B/A bright star'],
      [2, 4, 'F star'],
      [5, 11, 'G star'],
      [12, 24, 'K star'],
      [25, 94, 'M dwarf'],
      [95, 98, 'White dwarf/remnant'],
      [99, 100, 'Brown dwarf/substellar primary'],
    ])
    expect(summarize(frontierStarTypes)).toEqual([
      [1, 48, 'M dwarf'],
      [49, 68, 'K star'],
      [69, 80, 'G star'],
      [81, 87, 'F star'],
      [88, 91, 'O/B/A bright star'],
      [92, 95, 'White dwarf/remnant'],
      [96, 98, 'Brown dwarf/substellar primary'],
      [99, 100, 'Gate-selected anomaly'],
    ])
  })

  it('matches the modified 2d6 architecture table', () => {
    const summarize = architectures.map((entry) => [entry.min, entry.max, entry.value.name])

    expect(summarize).toEqual([
      [2, 2, 'Failed system'],
      [3, 3, 'Debris-dominated'],
      [4, 5, 'Sparse rocky'],
      [6, 8, 'Compact inner system'],
      [9, 9, 'Peas-in-a-pod chain'],
      [10, 10, 'Solar-ish mixed'],
      [11, 11, 'Migrated giant'],
      [12, 13, 'Giant-rich or chaotic'],
    ])
    for (const entry of architectures) {
      expect(entry.value).not.toHaveProperty('bodyCount')
      expect(architectureBodyPlanRules[entry.value.name as keyof typeof architectureBodyPlanRules]).toBeTruthy()
    }
  })


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
    expect(system.primary.activityRoll.value).toBeGreaterThan(0)
    expect(Array.isArray(system.primary.activityModifiers)).toBe(true)
    expect(Array.isArray(system.companions)).toBe(true)
    expect(system.reachability.className.confidence).toBe('gu-layer')
    expect(system.reachability.roll.value).toBeGreaterThanOrEqual(1)
    expect(system.reachability.roll.value).toBeLessThanOrEqual(12)
    expect(Array.isArray(system.reachability.modifiers)).toBe(true)
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
    expect(system.guOverlay.bleedBehavior.value).toBeTruthy()
    expect(system.guOverlay.intensityRoll.value).toBeGreaterThan(0)
    expect(Array.isArray(system.guOverlay.intensityModifiers)).toBe(true)
    for (const companion of system.companions) {
      expect(companion.companionType.source).toContain('MASS-GU companion threshold')
      expect(companion.separation.source).toContain('MASS-GU binary separation roll')
      expect(companion.planetaryConsequence.value).toBeTruthy()
      expect(companion.guConsequence.confidence).toBe('gu-layer')
      expect(companion.rollMargin.value).toBeGreaterThanOrEqual(0)
    }
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
          if (body.category.value !== 'gas-giant' && body.category.value !== 'ice-giant' && body.category.value !== 'sub-neptune') {
            expect(forbiddenExtremeHotVolatiles.has(body.detail.hydrosphere.value)).toBe(false)
            expect(forbiddenExtremeHotAtmospheres.has(body.detail.atmosphere.value)).toBe(false)
          }
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

  it('uses source rolled detail tables for ordinary planets', () => {
    const systems = Array.from({ length: 120 }, (_, index) =>
      generateSystem({ ...options, seed: `e43f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const ordinaryBodies = systems.flatMap((system) =>
      system.bodies.filter((body) =>
        body.category.value !== 'anomaly' &&
        body.category.value !== 'belt' &&
        body.category.value !== 'gas-giant' &&
        body.category.value !== 'ice-giant' &&
        body.category.value !== 'sub-neptune'
      )
    )

    expect(ordinaryBodies.length).toBeGreaterThan(0)
    expect(ordinaryBodies.every((body) => body.detail.atmosphere.source?.includes('MASS-GU 14 atmosphere d12'))).toBe(true)
    expect(ordinaryBodies.every((body) => body.detail.hydrosphere.source?.includes('MASS-GU 14 hydrosphere d12'))).toBe(true)
    expect(ordinaryBodies.every((body) => body.detail.geology.source?.includes('MASS-GU 14 geology'))).toBe(true)
    expect(ordinaryBodies.every((body) => body.detail.radiation.source?.includes('MASS-GU 14 radiation d8'))).toBe(true)
    expect(ordinaryBodies.some((body) => body.detail.atmosphere.value === 'Thin but usable with pressure gear' || body.detail.hydrosphere.value === 'Global ocean' || body.detail.geology.value === 'Global resurfacing')).toBe(true)
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
    expect(classes.has('Carbon-rich furnace world') || classes.has('Hycean-like candidate') || classes.has('Super-Jovian')).toBe(true)
    expect(classes.has('Metal-rich asteroid belt') || classes.has('Ice-rich belt') || classes.has('Chiral ore belt') || classes.has('Programmable-matter microcluster belt')).toBe(true)
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

  it('makes giant-rich and migrated architectures actually include giants with moons', () => {
    const giantBearingSystems = Array.from({ length: 100 }, (_, index) =>
      generateSystem({ ...options, seed: `c13f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    ).filter((system) => system.architecture.name.value === 'Giant-rich or chaotic' || system.architecture.name.value === 'Migrated giant')

    expect(giantBearingSystems.length).toBeGreaterThan(0)
    for (const system of giantBearingSystems) {
      const giants = system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant')
      expect(giants.length).toBeGreaterThanOrEqual(1)
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
    ).filter((system) => system.architecture.name.value === 'Compact inner system' || system.architecture.name.value === 'Peas-in-a-pod chain')

    expect(compactSystems.length).toBeGreaterThan(0)
    expect(compactSystems.some((system) => system.bodies.some((body) => body.filterNotes.some((note) => note.value.includes('Peas-in-a-pod'))))).toBe(true)
  })

  it('revalidates copied chain classes against the receiving thermal zone', () => {
    const impossibleHotLabels = [
      'Dwarf planet',
      'Outer ice belt',
      'Rogue captured planet',
      'Frozen super-Earth',
      'Cold gas giant',
      'Neptune-like ice giant',
      'Ringed giant with moons',
      'Ice-rich asteroid belt',
    ]

    for (let index = 0; index < 160; index++) {
      const system = generateSystem({ ...options, seed: `ab3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      for (const body of system.bodies) {
        if (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno' || body.thermalZone.value === 'Hot') {
          expect(impossibleHotLabels).not.toContain(body.bodyClass.value)
        }
      }
    }
  })

  it('keeps anomalies from using ordinary planet detail systems', () => {
    const systems = Array.from({ length: 120 }, (_, index) =>
      generateSystem({ ...options, seed: `bb3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const anomalies = systems.flatMap((system) => system.bodies.filter((body) => body.category.value === 'anomaly'))

    expect(anomalies.length).toBeGreaterThan(0)
    for (const anomaly of anomalies) {
      expect(anomaly.moons).toHaveLength(0)
      expect(anomaly.rings).toBeUndefined()
      expect(anomaly.detail.biosphere.value).toBe('Sterile')
      expect(['Artificial platform or engineered substrate', 'Metric shear geometry']).toContain(anomaly.detail.geology.value)
      expect(anomaly.physical.massEarth.value).toBeNull()
      expect(anomaly.physical.surfaceGravityG.value).toBeNull()
    }
  })

  it('uses observiverse terminology consistently in generated output', () => {
    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, gu: 'fracture', seed: `cb3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      expect(JSON.stringify(system).toLowerCase()).not.toContain('observerse')
    }
  })

  it('keeps fracture functions compatible with settlement site category', () => {
    const allowedFunctionsByCategory = new Map([
      ['Surface settlement', new Set(['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station'])],
      ['Orbital station', new Set(['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station', 'Pinchdrive tuning station'])],
      ['Asteroid or belt base', new Set(['Chiral harvesting site', 'Dark-sector ore extraction', 'Programmable-matter containment site', 'Quarantine station'])],
      ['Moon base', new Set(['Chiral harvesting site', 'Dark-sector ore extraction', 'Narrow-AI observiverse facility', 'Quarantine station'])],
      ['Deep-space platform', new Set(['Moving bleed-node tracking platform', 'Pinchdrive tuning station', 'Narrow-AI observiverse facility', 'Quarantine station'])],
      ['Gate or route node', new Set(['Iggygate control station', 'Pinchdrive tuning station', 'Quarantine station', 'Narrow-AI observiverse facility'])],
      ['Mobile site', new Set(['Moving bleed-node harvest fleet', 'Freeport', 'Smuggler port', 'Refugee settlement', 'Naval logistics depot'])],
      ['Derelict or restricted site', new Set(['Programmable-matter containment site', 'Intelligence black site', 'Quarantine station', 'Weapons test range'])],
    ])

    for (let index = 0; index < 120; index++) {
      const system = generateSystem({ ...options, gu: 'fracture', seed: `db3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      if (!system.guOverlay.intensity.value.includes('fracture') && !system.guOverlay.intensity.value.includes('shear')) continue
      for (const settlement of system.settlements) {
        expect(allowedFunctionsByCategory.get(settlement.siteCategory.value)?.has(settlement.function.value)).toBe(true)
      }
    }
  })

  it('uses varied architecture body plans instead of fixed belt and giant slots', () => {
    const systems = Array.from({ length: 300 }, (_, index) =>
      generateSystem({ ...options, seed: `501a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const solarishSystems = systems.filter((system) => system.architecture.name.value === 'Solar-ish mixed')
    const sparseSystems = systems.filter((system) => system.architecture.name.value === 'Sparse rocky')

    expect(solarishSystems.length).toBeGreaterThan(0)
    expect(new Set(solarishSystems.map((system) => system.bodies.filter((body) => body.category.value === 'belt').length)).size).toBeGreaterThan(1)
    expect(new Set(solarishSystems.map((system) => system.bodies.filter((body) => body.category.value === 'rocky-planet' || body.category.value === 'super-earth' || body.category.value === 'sub-neptune').length)).size).toBeGreaterThan(1)
    expect(solarishSystems.some((system) => system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant').length >= 3)).toBe(true)

    expect(sparseSystems.length).toBeGreaterThan(0)
    expect(sparseSystems.some((system) => system.bodies.some((body) => body.category.value === 'rocky-planet'))).toBe(true)
    expect(sparseSystems.some((system) => system.bodies.some((body) => body.category.value === 'belt' || body.category.value === 'dwarf-body'))).toBe(true)
  })

  it('generates source-table stellar companions across sampled systems', () => {
    const systems = Array.from({ length: 240 }, (_, index) =>
      generateSystem({ ...options, seed: `711a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const companions = systems.flatMap((system) => system.companions)

    expect(companions.length).toBeGreaterThan(0)
    expect(new Set(companions.map((companion) => companion.separation.value)).size).toBeGreaterThan(2)
    expect(companions.some((companion) => companion.companionType.value === 'Triple or higher-order system')).toBe(true)
    expect(companions.every((companion) => companion.planetaryConsequence.value.length > 10)).toBe(true)
    expect(companions.every((companion) => companion.guConsequence.value.length > 10)).toBe(true)
  })

  it('applies source reachability and activity modifiers', () => {
    const systems = Array.from({ length: 240 }, (_, index) =>
      generateSystem({ ...options, gu: index % 2 === 0 ? 'fracture' : 'normal', seed: `811a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )

    const activityModifiers = systems.flatMap((system) => system.primary.activityModifiers.map((modifier) => modifier.value))
    const reachabilityModifiers = systems.flatMap((system) => system.reachability.modifiers.map((modifier) => modifier.value))

    expect(activityModifiers).toContain('+2 M dwarf')
    expect(activityModifiers).toContain('+1 strong GU bleed preference')
    expect(activityModifiers).toContain('+1 close binary')
    expect(reachabilityModifiers).toContain('+1 multi-star resonance geometry')
    expect(reachabilityModifiers).toContain('+1 chiral or high-bleed resource bias')
    expect(reachabilityModifiers).toContain('+1 flare-driven M-dwarf bleed behavior')
  })

  it('uses expanded source GU overlay rolls', () => {
    const systems = Array.from({ length: 240 }, (_, index) =>
      generateSystem({ ...options, gu: index % 3 === 0 ? 'fracture' : index % 3 === 1 ? 'high' : 'normal', seed: `911a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const locations = new Set(systems.map((system) => system.guOverlay.bleedLocation.value))
    const behaviors = new Set(systems.map((system) => system.guOverlay.bleedBehavior.value))
    const resources = new Set(systems.map((system) => system.guOverlay.resource.value))
    const hazards = new Set(systems.map((system) => system.guOverlay.hazard.value))
    const modifiers = systems.flatMap((system) => system.guOverlay.intensityModifiers.map((modifier) => modifier.value))

    expect(locations.size).toBeGreaterThan(10)
    expect(behaviors.size).toBeGreaterThan(6)
    expect(resources.size).toBeGreaterThan(10)
    expect(hazards.size).toBeGreaterThan(10)
    expect(modifiers).toContain('+2 multi-star')
    expect(modifiers).toContain('+1 close-in resonant planetary chain')
    expect(modifiers).toContain('+1 strong giant magnetosphere')
    expect(modifiers).toContain('+4 fracture GU preference')
  })

  it('keeps architecture body plans aligned with source intent', () => {
    const fullPlanetCategories = new Set(['rocky-planet', 'super-earth', 'sub-neptune', 'gas-giant', 'ice-giant'])
    const minorCategories = new Set(['belt', 'dwarf-body', 'rogue-captured'])
    const rockyChainCategories = new Set(['rocky-planet', 'super-earth', 'sub-neptune'])
    const giantCategories = new Set(['gas-giant', 'ice-giant'])

    const count = (system: ReturnType<typeof generateSystem>, categories: Set<string>) =>
      system.bodies.filter((body) => categories.has(body.category.value)).length

    const systems = Array.from({ length: 500 }, (_, index) =>
      generateSystem({ ...options, seed: `611a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )

    expect(new Set(systems.map((system) => system.architecture.name.value)).size).toBeGreaterThan(5)

    for (const system of systems) {
      const architecture = system.architecture.name.value
      const fullPlanets = count(system, fullPlanetCategories)
      const minorBodies = count(system, minorCategories)
      const rockyChainBodies = count(system, rockyChainCategories)
      const giants = count(system, giantCategories)

      if (architecture === 'Failed system') {
        expect(fullPlanets).toBeLessThanOrEqual(3)
        expect(minorBodies).toBeGreaterThanOrEqual(2)
      }

      if (architecture === 'Debris-dominated') {
        expect(minorBodies).toBeGreaterThanOrEqual(2)
        expect(minorBodies + 1).toBeGreaterThanOrEqual(fullPlanets)
      }

      if (architecture === 'Sparse rocky') {
        expect(rockyChainBodies).toBeGreaterThanOrEqual(1)
        expect(giants).toBeLessThanOrEqual(1)
      }

      if (architecture === 'Compact inner system') {
        expect(rockyChainBodies).toBeGreaterThanOrEqual(3)
      }

      if (architecture === 'Peas-in-a-pod chain') {
        expect(rockyChainBodies).toBeGreaterThanOrEqual(4)
      }

      if (architecture === 'Solar-ish mixed' || architecture === 'Migrated giant') {
        expect(giants).toBeGreaterThanOrEqual(1)
      }

      if (architecture === 'Giant-rich or chaotic') {
        expect(giants).toBeGreaterThanOrEqual(2)
      }
    }
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
      expect(settlement.presence.roll.value).toBeGreaterThanOrEqual(2)
      expect(settlement.presence.roll.value).toBeLessThanOrEqual(12)
      expect(settlement.presence.tier.value).toBeTruthy()
      expect(settlement.function.value).toBeTruthy()
      expect(settlement.scale.source).toContain('MASS-GU 18.2')
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

  it('uses rolled settlement presence and source settlement scales', () => {
    const systems = Array.from({ length: 160 }, (_, index) =>
      generateSystem({
        ...options,
        settlements: 'crowded',
        seed: `c93f9c2e41b8${index.toString(16).padStart(4, '0')}`,
      })
    )
    const settlements = systems.flatMap((system) => system.settlements)

    expect(settlements.length).toBeGreaterThan(0)
    expect(new Set(settlements.map((settlement) => settlement.presence.roll.value)).size).toBeGreaterThan(4)
    expect(new Set(settlements.map((settlement) => settlement.presence.tier.value)).size).toBeGreaterThan(3)
    expect(new Set(settlements.map((settlement) => settlement.scale.value)).size).toBeGreaterThan(5)
    expect(settlements.some((settlement) => settlement.scale.value.includes('people') || settlement.scale.value === 'Automated only')).toBe(true)
    expect(settlements.every((settlement) => settlement.presence.roll.source?.includes('MASS-GU 18.1'))).toBe(true)
    expect(settlements.every((settlement) => settlement.scale.source?.includes('MASS-GU 18.2'))).toBe(true)
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

      expect(Math.min(...counts)).toBeGreaterThanOrEqual(density === 'sparse' ? min : 1)
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

  it('uses source moon count and ring tables across sampled systems', () => {
    const systems = Array.from({ length: 180 }, (_, index) =>
      generateSystem({ ...options, seed: `d43f9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const giants = systems.flatMap((system) => system.bodies.filter((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant'))
    const rings = giants.flatMap((body) => body.rings ? [body.rings] : [])
    const moons = systems.flatMap((system) => system.bodies.flatMap((body) => body.moons))

    expect(giants.length).toBeGreaterThan(0)
    expect(giants.some((body) => body.moons.length > 6)).toBe(true)
    expect(rings.length).toBeGreaterThan(0)
    expect(new Set(rings.map((ring) => ring.type.value)).size).toBeGreaterThan(3)
    expect(rings.every((ring) => ring.type.source?.includes('MASS-GU 17 ring type d12'))).toBe(true)
    expect(moons.every((moon) => moon.scale.source?.includes('MASS-GU 17 moon scale'))).toBe(true)
  })
})
