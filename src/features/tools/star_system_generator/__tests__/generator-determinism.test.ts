import { describe, expect, it } from 'vitest'
import type { GenerationOptions, PartialKnownSystem } from '../types'
import { applyNoAlienTextGuard, architectureBodyPlanRules, generateSystem } from '../lib/generator'
import { bodyDesignation, moonDesignation } from '../lib/generator/designations'
import {
  builtForms,
  GENERATION_SHIP_POPULATION_BAND,
  guFractureFunctionsBySiteCategory,
  HABITATION_POPULATION_FLOORS,
  POPULATION_BAND_INDEX,
  settlementConditionByHabitationPattern,
  settlementCrisisByHabitationPattern,
  settlementLocations,
  settlementTagOptions,
} from '../lib/generator/data/settlements'
import { architectures, frontierStarTypes, realisticStarTypes } from '../lib/generator/tables'
import { validateSystem } from '../lib/generator/validation'

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

  it('preserves locked known star facts while filling generated layers', () => {
    const knownSystem: PartialKnownSystem = {
      id: 'known-sol-analog',
      name: { value: 'Known Lantern', confidence: 'confirmed', source: 'Test catalog', locked: true },
      dataBasis: { value: 'Partial known-system fixture', confidence: 'confirmed', source: 'Test catalog', locked: true },
      primary: {
        name: { value: 'Known Lantern A', confidence: 'confirmed', source: 'Test catalog', locked: true },
        spectralType: { value: 'G2V', confidence: 'confirmed', source: 'Test catalog', locked: true },
        massSolar: { value: 1.03, confidence: 'confirmed', source: 'Test catalog', locked: true },
        luminositySolar: { value: 1.12, confidence: 'confirmed', source: 'Test catalog', locked: true },
      },
    }

    const system = generateSystem({ ...options, seed: 'known-star-lock-test' }, knownSystem)

    expect(system.id).toBe('known-sol-analog')
    expect(system.name).toEqual(knownSystem.name)
    expect(system.dataBasis).toEqual(knownSystem.dataBasis)
    expect(system.primary.name).toEqual(knownSystem.primary?.name)
    expect(system.primary.spectralType).toEqual(knownSystem.primary?.spectralType)
    expect(system.primary.massSolar).toEqual(knownSystem.primary?.massSolar)
    expect(system.primary.luminositySolar).toEqual(knownSystem.primary?.luminositySolar)
    expect(system.zones.habitableCenterAu.value).toBeCloseTo(Math.sqrt(1.12), 3)
    expect(system.bodies.length).toBeGreaterThan(0)
    expect(generateSystem({ ...options, seed: 'known-star-lock-test' }, knownSystem)).toEqual(system)
  })

  it('reserves orbital slots for locked known bodies and fills the rest', () => {
    const knownSystem: PartialKnownSystem = {
      name: { value: 'Known Body Test', confidence: 'confirmed', source: 'Test catalog', locked: true },
      primary: {
        spectralType: { value: 'K star', confidence: 'confirmed', source: 'Test catalog', locked: true },
        massSolar: { value: 0.78, confidence: 'confirmed', source: 'Test catalog', locked: true },
        luminositySolar: { value: 0.41, confidence: 'confirmed', source: 'Test catalog', locked: true },
      },
      bodies: [
        {
          id: 'known-b',
          orbitAu: { value: 0.72, confidence: 'confirmed', source: 'Test catalog', locked: true },
          name: { value: 'Known Body b', confidence: 'confirmed', source: 'Test catalog', locked: true },
          category: { value: 'rocky-planet', confidence: 'confirmed', source: 'Test catalog', locked: true },
          bodyClass: { value: 'Earth-sized terrestrial', confidence: 'confirmed', source: 'Test catalog', locked: true },
          massClass: { value: 'Terrestrial', confidence: 'confirmed', source: 'Test catalog', locked: true },
          physical: {
            radiusEarth: { value: 1.08, confidence: 'confirmed', source: 'Test catalog', locked: true },
            massEarth: { value: 1.23, confidence: 'confirmed', source: 'Test catalog', locked: true },
          },
          detail: {
            atmosphere: { value: 'Thin but usable with pressure gear', confidence: 'confirmed', source: 'Test catalog', locked: true },
          },
        },
      ],
    }

    const system = generateSystem({ ...options, seed: 'known-body-lock-test' }, knownSystem)
    const knownBody = system.bodies.find((body) => body.id === 'known-b')

    expect(knownBody).toBeTruthy()
    expect(knownBody?.orbitAu).toEqual(knownSystem.bodies?.[0].orbitAu)
    expect(knownBody?.name).toEqual(knownSystem.bodies?.[0].name)
    expect(knownBody?.category).toEqual(knownSystem.bodies?.[0].category)
    expect(knownBody?.bodyClass).toEqual(knownSystem.bodies?.[0].bodyClass)
    expect(knownBody?.massClass).toEqual(knownSystem.bodies?.[0].massClass)
    expect(knownBody?.physical.radiusEarth).toEqual(knownSystem.bodies?.[0].physical?.radiusEarth)
    expect(knownBody?.physical.massEarth).toEqual(knownSystem.bodies?.[0].physical?.massEarth)
    expect(knownBody?.detail.atmosphere).toEqual(knownSystem.bodies?.[0].detail?.atmosphere)
    expect(system.bodies.length).toBeGreaterThan(1)
  })

  it('assigns designations to imported bodies without locked names', () => {
    const knownSystem: PartialKnownSystem = {
      name: { value: 'Known Designation Test', confidence: 'confirmed', source: 'Test catalog', locked: true },
      primary: {
        spectralType: { value: 'K star', confidence: 'confirmed', source: 'Test catalog', locked: true },
        massSolar: { value: 0.8, confidence: 'confirmed', source: 'Test catalog', locked: true },
        luminositySolar: { value: 0.42, confidence: 'confirmed', source: 'Test catalog', locked: true },
      },
      bodies: [
        {
          id: 'known-unnamed',
          orbitAu: { value: 0.76, confidence: 'confirmed', source: 'Test catalog', locked: true },
          category: { value: 'rocky-planet', confidence: 'confirmed', source: 'Test catalog', locked: true },
          bodyClass: { value: 'Earth-sized terrestrial', confidence: 'confirmed', source: 'Test catalog', locked: true },
          massClass: { value: 'Terrestrial', confidence: 'confirmed', source: 'Test catalog', locked: true },
        },
      ],
    }

    const system = generateSystem({ ...options, seed: 'known-body-designation-test' }, knownSystem)
    const bodyIndex = system.bodies.findIndex((body) => body.id === 'known-unnamed')
    const knownBody = system.bodies[bodyIndex]

    expect(bodyIndex).toBeGreaterThanOrEqual(0)
    expect(knownBody.name.value).toBe(bodyDesignation(system.name.value, bodyIndex, knownBody.category.value))
    expect(knownBody.name.locked).toBeUndefined()
  })

  it('preserves incompatible locked body details and reports them as conflicts', () => {
    const knownSystem: PartialKnownSystem = {
      name: { value: 'Locked Conflict Test', confidence: 'confirmed', source: 'Test catalog', locked: true },
      primary: {
        spectralType: { value: 'K star', confidence: 'confirmed', source: 'Test catalog', locked: true },
        massSolar: { value: 0.78, confidence: 'confirmed', source: 'Test catalog', locked: true },
        luminositySolar: { value: 0.41, confidence: 'confirmed', source: 'Test catalog', locked: true },
      },
      bodies: [
        {
          id: 'known-airless-conflict',
          orbitAu: { value: 0.72, confidence: 'confirmed', source: 'Test catalog', locked: true },
          name: { value: 'Known Contradiction b', confidence: 'confirmed', source: 'Test catalog', locked: true },
          category: { value: 'rocky-planet', confidence: 'confirmed', source: 'Test catalog', locked: true },
          bodyClass: { value: 'Airless rock in nominal HZ', confidence: 'confirmed', source: 'Test catalog', locked: true },
          massClass: { value: 'Terrestrial', confidence: 'confirmed', source: 'Test catalog', locked: true },
          detail: {
            atmosphere: { value: 'Moderate inert atmosphere', confidence: 'confirmed', source: 'Test catalog', locked: true },
            hydrosphere: { value: 'Global ocean', confidence: 'confirmed', source: 'Test catalog', locked: true },
          },
        },
      ],
    }

    const system = generateSystem({ ...options, seed: 'known-locked-conflict-test' }, knownSystem)
    const knownBody = system.bodies.find((body) => body.id === 'known-airless-conflict')

    expect(knownBody?.detail.atmosphere).toEqual(knownSystem.bodies?.[0].detail?.atmosphere)
    expect(knownBody?.detail.hydrosphere).toEqual(knownSystem.bodies?.[0].detail?.hydrosphere)

    const lockedConflicts = validateSystem(system).filter((finding) => finding.source === 'locked-conflict')
    expect(lockedConflicts).toHaveLength(2)
    expect(lockedConflicts.map((finding) => finding.policyCode)).toEqual(expect.arrayContaining(['ENV_AIRLESS_ATMOSPHERE', 'ENV_AIRLESS_HYDROSPHERE']))
    expect(lockedConflicts.every((finding) => finding.code === 'LOCKED_FACT_CONFLICT')).toBe(true)
  })

  it('changes output for a different seed', () => {
    const first = generateSystem(options)
    const second = generateSystem({ ...options, seed: '1111111111111111' })

    expect(second).not.toEqual(first)
  })

  it('generates varied contextual names across sampled systems', () => {
    const systems = Array.from({ length: 120 }, (_, index) =>
      generateSystem({ ...options, settlements: 'crowded', seed: `914a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const systemNames = systems.map((system) => system.name.value)
    const firstBodyNames = systems.map((system) => system.bodies[0]?.name.value).filter(Boolean)
    const settlementNames = systems.flatMap((system) => system.settlements.map((settlement) => settlement.name.value))
    const moonNames = systems.flatMap((system) => system.bodies.flatMap((body) => body.moons.map((moon) => moon.name.value)))

    expect(new Set(systemNames).size).toBeGreaterThan(100)
    expect(new Set(firstBodyNames).size).toBeGreaterThan(60)
    expect(new Set(settlementNames).size).toBeGreaterThan(100)
    expect(new Set(moonNames).size).toBeGreaterThan(40)
    expect(firstBodyNames.filter((name) => name === 'Ashkey').length).toBe(0)
  })

  it('uses designation-first names for generated bodies and moons', () => {
    for (let index = 0; index < 40; index++) {
      const system = generateSystem({ ...options, seed: `designation-${index.toString(16).padStart(4, '0')}` })

      system.bodies.forEach((body, bodyIndex) => {
        expect(body.name.value).toBe(bodyDesignation(system.name.value, bodyIndex, body.category.value))
        expect(body.name.source).toContain('celestial designation')

        body.moons.forEach((moon, moonIndex) => {
          expect(moon.name.value).toBe(moonDesignation(body.name.value, moonIndex))
          expect(moon.name.source).toContain('moon designation')
        })
      })
    }
  })

  it('varies generated prose templates across sampled systems', () => {
    const systems = Array.from({ length: 120 }, (_, index) =>
      generateSystem({ ...options, settlements: 'crowded', seed: `a14a9c2e41b8${index.toString(16).padStart(4, '0')}` })
    )
    const opening = (value: string) => value.split(/\s+/).slice(0, 4).join(' ')
    const bodyOpenings = new Set(systems.flatMap((system) => system.bodies.map((body) => opening(body.whyInteresting.value))))
    const whyHereOpenings = new Set(systems.flatMap((system) => system.settlements.map((settlement) => opening(settlement.whyHere.value))))
    const tagHookOpenings = new Set(systems.flatMap((system) => system.settlements.map((settlement) => opening(settlement.tagHook.value))))

    expect(bodyOpenings.size).toBeGreaterThan(8)
    expect(whyHereOpenings.size).toBeGreaterThan(8)
    expect(tagHookOpenings.size).toBeGreaterThan(8)
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
        narrativeFacts: system.narrativeFacts,
        majorHazards: system.majorHazards,
      }).toLowerCase()

      for (const phrase of forbiddenPhrases) {
        expect(playableOutput).not.toContain(phrase)
      }
    }
  })

  it('does not promote benign stellar activity labels into major hazards', () => {
    const benignActivity = new Set(['Dormant / unusually quiet', 'Quiet', 'Normal', 'Active'])

    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, seed: `hazard-activity-${index}` })
      for (const hazard of system.majorHazards) {
        expect(benignActivity.has(hazard.value)).toBe(false)
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

  it('does not emit qualitative environment or prose findings across sampled systems', () => {
    const qualitativeCodes = new Set([
      'ENV_GREENHOUSE_ATMOSPHERE',
      'ENV_OCEAN_HYDROSPHERE',
      'ENV_HYCEAN_HYDROSPHERE',
      'ENV_SOLID_H2_ENVELOPE',
      'PROSE_REDUNDANT_ZONE_WORDING',
      'PROSE_SINGULAR_MOON_GRAMMAR',
    ])

    for (let index = 0; index < 180; index++) {
      const system = generateSystem({
        ...options,
        settlements: index % 3 === 0 ? 'hub' : index % 3 === 1 ? 'crowded' : 'normal',
        seed: `qualitative-regression-${index.toString(16).padStart(4, '0')}`,
      })
      const findings = validateSystem(system).filter((finding) => qualitativeCodes.has(finding.code))

      expect(findings).toEqual([])
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

  it('does not repeat the exact body profile inside the body interest summary', () => {
    const system = generateSystem({ ...options, seed: 'ea1d8ba2f11e808c' })
    const profiledBodies = system.bodies.filter((body) => body.bodyProfile)

    expect(profiledBodies.length).toBeGreaterThan(0)
    for (const body of profiledBodies) {
      expect(body.whyInteresting.value).not.toContain(body.bodyProfile?.value)
    }
  })

  it('does not repeat the exact giant economy note inside the body interest summary', () => {
    const systems = Array.from({ length: 60 }, (_, index) =>
      generateSystem({ ...options, seed: `giant-economy-interest-${index.toString(16).padStart(4, '0')}` })
    )
    const giantBodies = systems.flatMap((system) => system.bodies.filter((body) => body.giantEconomy))

    expect(giantBodies.length).toBeGreaterThan(0)
    for (const body of giantBodies) {
      expect(body.whyInteresting.value).not.toContain(body.giantEconomy?.value)
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

  it('uses observerse terminology consistently in generated output', () => {
    for (let index = 0; index < 80; index++) {
      const system = generateSystem({ ...options, gu: 'fracture', seed: `cb3f9c2e41b8${index.toString(16).padStart(4, '0')}` })
      expect(JSON.stringify(system).toLowerCase()).not.toContain('observiverse')
    }
  })

  it('keeps fracture functions compatible with settlement site category', () => {
    const allowedFunctionsByCategory = new Map(
      Object.entries(guFractureFunctionsBySiteCategory).map(([category, functions]) => [category, new Set(functions)])
    )

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
      expect(settlement.whyHere.source).toMatch(/MASS-GU 18\.1|Graph-aware reshape/)
      expect(settlement.siteCategory.value).toBeTruthy()
      expect(settlement.presence.score.value).toBeGreaterThan(0)
      expect(settlement.presence.roll.value).toBeGreaterThanOrEqual(2)
      expect(settlement.presence.roll.value).toBeLessThanOrEqual(12)
      expect(settlement.presence.tier.value).toBeTruthy()
      expect(settlement.function.value).toBeTruthy()
      expect(settlement.population.value).toBeTruthy()
      expect(settlement.habitationPattern.value).toBeTruthy()
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
    for (const phenomenon of system.phenomena) {
      expect(phenomenon.phenomenon.value).toBeTruthy()
      expect(phenomenon.note.value).toContain('Transit:')
      expect(phenomenon.note.value).toContain('Question:')
      expect(phenomenon.note.value).toContain('Hook:')
      expect(phenomenon.note.value).toContain('Image:')
      expect(phenomenon.note.value).not.toContain('shapes travel, survey priorities, or local conflict')
      expect(phenomenon.travelEffect.value).toBeTruthy()
      expect(phenomenon.surveyQuestion.value).toBeTruthy()
      expect(phenomenon.conflictHook.value).toBeTruthy()
      expect(phenomenon.sceneAnchor.value).toBeTruthy()
    }
    expect(system.narrativeFacts.length).toBeGreaterThan(0)
    expect(JSON.stringify(system.ruins).toLowerCase()).not.toContain('alien')
  })

  it('uses rolled settlement presence and produces varied population + habitation', () => {
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
    expect(new Set(settlements.map((settlement) => settlement.population.value)).size).toBeGreaterThan(4)
    expect(new Set(settlements.map((settlement) => settlement.habitationPattern.value)).size).toBeGreaterThan(3)
    expect(settlements.every((settlement) => settlement.presence.roll.source?.includes('MASS-GU 18.1'))).toBe(true)
    expect(settlements.every((settlement) => Boolean(settlement.population.source))).toBe(true)
    expect(settlements.every((settlement) => Boolean(settlement.habitationPattern.source))).toBe(true)
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
      const counts = Array.from({ length: 100 }, (_, index) => {
        const system = generateSystem({
          ...options,
          settlements: density as GenerationOptions['settlements'],
          seed: `5e771e5${index.toString(16).padStart(8, '0')}`,
        })
        return system.settlements.length + system.gates.length
      })

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

  it('keeps automated and abandoned settlement crises habitationPattern-aware and enforces the joint population constraint', () => {
    const automatedCrises = new Set(settlementCrisisByHabitationPattern.Automated)
    const abandonedCrises = new Set(settlementCrisisByHabitationPattern.Abandoned)
    const automatedConditions = new Set(settlementConditionByHabitationPattern.Automated)
    const abandonedConditions = new Set(settlementConditionByHabitationPattern.Abandoned)
    let sawAutomated = false
    let sawAbandoned = false

    for (let index = 0; index < 180; index++) {
      const system = generateSystem({ ...options, settlements: 'hub', seed: `scale-coherence-${index.toString(16).padStart(4, '0')}` })
      for (const settlement of system.settlements) {
        if (settlement.habitationPattern.value === 'Automated') {
          sawAutomated = true
          expect(automatedCrises.has(settlement.crisis.value)).toBe(true)
          expect(automatedConditions.has(settlement.condition.value)).toBe(true)
          expect(settlement.population.value).toBe('Minimal (<5)')
        }
        if (settlement.habitationPattern.value === 'Abandoned') {
          sawAbandoned = true
          expect(abandonedCrises.has(settlement.crisis.value)).toBe(true)
          expect(abandonedConditions.has(settlement.condition.value)).toBe(true)
          expect(settlement.population.value).toBe('Unknown')
        }
        const floor = HABITATION_POPULATION_FLOORS[settlement.habitationPattern.value]
        if (floor !== undefined) {
          expect(POPULATION_BAND_INDEX[settlement.population.value]).toBeGreaterThanOrEqual(floor)
        }
        if (settlement.habitationPattern.value === 'Generation ship') {
          expect(POPULATION_BAND_INDEX[settlement.population.value]).toBeGreaterThanOrEqual(GENERATION_SHIP_POPULATION_BAND.floor)
          expect(POPULATION_BAND_INDEX[settlement.population.value]).toBeLessThanOrEqual(GENERATION_SHIP_POPULATION_BAND.ceiling)
        }
      }
    }

    expect(sawAutomated).toBe(true)
    expect(sawAbandoned).toBe(true)
  })

  it('emits gates as a first-class type instead of gate-categorized settlements', () => {
    const systems = Array.from({ length: 80 }, (_, index) =>
      generateSystem({
        ...options,
        settlements: 'crowded',
        seed: `gate-promo-${index.toString(16).padStart(4, '0')}`,
      })
    )

    const allGates = systems.flatMap((system) => system.gates)
    expect(allGates.length).toBeGreaterThan(0)

    for (const system of systems) {
      for (const settlement of system.settlements) {
        expect(settlement.siteCategory.value).not.toBe('Gate or route node')
        expect(settlement.habitationPattern.value).not.toBe('Gate or route node')
      }
      system.gates.forEach((gate, index) => {
        expect(gate.id).toBe(`gate-${index + 1}`)
        expect(gate.name.value).toBeTruthy()
        expect(gate.routeNote.value).toBeTruthy()
        expect(gate.anchorName.value).toBeTruthy()
        expect(gate.condition.value).toBeTruthy()
      })
    }
  })

  it('blocks open-water hydrospheres on Hot-zone terrestrial-fallthrough worlds', () => {
    // Classes that previously fell through to the unconstrained terrestrial profile in Hot.
    const fallthroughClasses = new Set([
      'Resonant inner-chain world',
      'Super-Earth with high gravity',
      'Dense-atmosphere pressure world',
      'Basaltic super-Earth',
    ])
    const forbiddenInHot = new Set([
      'Ocean-continent balance',
      'Global ocean',
      'High-pressure deep ocean',
      'Ice-shell subsurface ocean',
      'Hydrocarbon lakes/seas',
      'Cryogenic nitrogen reservoirs',
      'Cryovolcanic vents',
    ])
    let auditedHotPlanets = 0
    for (let index = 0; index < 240; index++) {
      const system = generateSystem({
        ...options,
        seed: `hot-hydro-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (body.thermalZone.value !== 'Hot') continue
        if (!fallthroughClasses.has(body.bodyClass.value)) continue
        auditedHotPlanets++
        expect(forbiddenInHot.has(body.detail.hydrosphere.value)).toBe(false)
      }
    }
    expect(auditedHotPlanets, 'expected to audit at least 20 Hot-zone terrestrial-fallthrough planets').toBeGreaterThan(20)
  })

  it('routes magma-ocean / lava / tidal-volcanic worlds to molten surface states', () => {
    const moltenStates = new Set(['Magma seas / lava lakes', 'Vaporized volatile traces', 'Nightside mineral frost'])
    // Match silicate-surface molten worlds; exclude facility/anomaly classes that share a word like "furnace".
    const triggers = /^(?:lava planet|magma ocean world|carbon-rich furnace world|tidally stretched volcanic world)$/i
    let sawTrigger = false
    let sawMagmaSeas = false
    for (let index = 0; index < 200; index++) {
      const system = generateSystem({
        ...options,
        seed: `magma-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (!triggers.test(body.bodyClass.value)) continue
        sawTrigger = true
        const hydro = body.detail.hydrosphere.value
        expect(moltenStates.has(hydro)).toBe(true)
        if (hydro === 'Magma seas / lava lakes') sawMagmaSeas = true
      }
    }
    expect(sawTrigger).toBe(true)
    expect(sawMagmaSeas).toBe(true)
  })

  it('routes cryovolcanic class names to their flavor hydrosphere', () => {
    let sawCryovolcanic = false
    for (let index = 0; index < 240 && !sawCryovolcanic; index++) {
      const system = generateSystem({
        ...options,
        seed: `cryo-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (/cryovolcanic/i.test(body.bodyClass.value)) {
          expect(body.detail.hydrosphere.value).toBe('Cryovolcanic vents')
          sawCryovolcanic = true
        }
        // Nitrogen glacier worlds are rare in real generation; assert only when present.
        if (/nitrogen glacier/i.test(body.bodyClass.value)) {
          expect(body.detail.hydrosphere.value).toBe('Cryogenic nitrogen reservoirs')
        }
      }
    }
    expect(sawCryovolcanic, 'expected to encounter a cryovolcanic world within 240 seeded systems').toBe(true)
  })

  it('routes perchlorate desert worlds to salt flats', () => {
    let sawPerchlorate = false
    for (let index = 0; index < 240 && !sawPerchlorate; index++) {
      const system = generateSystem({
        ...options,
        seed: `salt-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (/perchlorate/i.test(body.bodyClass.value)) {
          expect(body.detail.hydrosphere.value).toBe('Salt / perchlorate flats')
          sawPerchlorate = true
        }
      }
    }
    expect(sawPerchlorate, 'expected to encounter a perchlorate desert world within 240 seeded systems').toBe(true)
  })

  it('blocks heat-requiring atmospheres on Cold/Cryogenic/Dark bodies', () => {
    const heatRequired = new Set(['Steam atmosphere', 'Sulfur/chlorine/ammonia haze', 'Dense greenhouse'])
    let coldAudits = 0
    for (let index = 0; index < 240; index++) {
      const system = generateSystem({
        ...options,
        seed: `cold-atm-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (body.thermalZone.value !== 'Cold' && body.thermalZone.value !== 'Cryogenic' && body.thermalZone.value !== 'Dark') continue
        if (body.category.value === 'belt') continue
        coldAudits++
        expect(heatRequired.has(body.detail.atmosphere.value), `${body.bodyClass.value} (${body.thermalZone.value}) should not have ${body.detail.atmosphere.value}`).toBe(false)
      }
    }
    expect(coldAudits).toBeGreaterThan(100)
  })

  it('blocks deep-ocean rolls on non-steam greenhouse classes', () => {
    const deepOcean = new Set(['Global ocean', 'High-pressure deep ocean', 'Ice-shell subsurface ocean', 'Hydrocarbon lakes/seas'])
    for (let index = 0; index < 240; index++) {
      const system = generateSystem({
        ...options,
        seed: `gh-hydro-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        const cls = body.bodyClass.value
        // Non-steam greenhouse: Venus-like, Sulfur-cloud, Cloudy greenhouse edge
        const isNonSteamGreenhouse = /venus-like greenhouse|sulfur-cloud world|cloudy greenhouse edge world/i.test(cls)
        if (!isNonSteamGreenhouse) continue
        expect(deepOcean.has(body.detail.hydrosphere.value), `${cls} should not have ${body.detail.hydrosphere.value}`).toBe(false)
      }
    }
  })

  it('pins envelope-category atmospheres to hydrogen or chiral states', () => {
    const allowedEnvelopeAtms = new Set(['Hydrogen/helium envelope', 'Chiral-active or GU-distorted atmosphere'])
    // Some envelope-category classes carry a desert / stripped tag that overrides envelope profile
    // (e.g. "Hot Neptune desert survivor", "Stripped mini-Neptune core"). Skip those.
    const overrideClasses = /desert|stripped|hycean|ocean/i
    let envelopeAudits = 0
    for (let index = 0; index < 200; index++) {
      const system = generateSystem({
        ...options,
        seed: `env-atm-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (body.category.value !== 'sub-neptune' && body.category.value !== 'gas-giant' && body.category.value !== 'ice-giant') continue
        if (overrideClasses.test(body.bodyClass.value)) continue
        envelopeAudits++
        expect(allowedEnvelopeAtms.has(body.detail.atmosphere.value), `${body.bodyClass.value} got ${body.detail.atmosphere.value}`).toBe(true)
      }
    }
    expect(envelopeAudits).toBeGreaterThan(50)
  })

  it('drops hot-only climate tags from cold envelope bodies and cold-only from hot envelopes', () => {
    const hotOnlyClimates = new Set(['Runaway greenhouse', 'Moist greenhouse edge', 'Hot desert', 'Dayside glass fields'])
    const coldOnlyClimates = new Set(['Snowball', 'Methane cycle', 'CO2 glacier cycle'])
    for (let index = 0; index < 200; index++) {
      const system = generateSystem({
        ...options,
        seed: `env-clim-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        const isEnvelope = body.category.value === 'sub-neptune' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant'
        if (!isEnvelope) continue
        const climates = body.detail.climate.map((c) => c.value)
        if (body.thermalZone.value === 'Cold' || body.thermalZone.value === 'Cryogenic' || body.thermalZone.value === 'Dark') {
          for (const c of climates) expect(hotOnlyClimates.has(c), `${body.bodyClass.value} (${body.thermalZone.value}) climate=${c}`).toBe(false)
        }
        if (body.thermalZone.value === 'Hot') {
          for (const c of climates) expect(coldOnlyClimates.has(c), `${body.bodyClass.value} (Hot) climate=${c}`).toBe(false)
        }
      }
    }
  })

  it('blocks cryovolcanism geology on Hot/Furnace/Inferno bodies', () => {
    let auditedHot = 0
    for (let index = 0; index < 200; index++) {
      const system = generateSystem({
        ...options,
        seed: `hot-geo-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (body.thermalZone.value !== 'Hot' && body.thermalZone.value !== 'Furnace' && body.thermalZone.value !== 'Inferno') continue
        if (body.category.value === 'belt') continue
        if (body.category.value === 'sub-neptune' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant') continue
        auditedHot++
        expect(body.detail.geology.value, `${body.bodyClass.value} (${body.thermalZone.value})`).not.toBe('Cryovolcanism')
      }
    }
    expect(auditedHot).toBeGreaterThan(50)
  })

  it('blocks hot-style silicate volcanism on Dark-zone non-tidal classes', () => {
    const hotOnly = new Set(['Active volcanism', 'Extreme plume provinces', 'Global resurfacing', 'Plate tectonic analogue', 'Supercontinent cycle'])
    for (let index = 0; index < 240; index++) {
      const system = generateSystem({
        ...options,
        seed: `dark-geo-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (body.thermalZone.value !== 'Dark') continue
        if (body.category.value === 'belt') continue
        if (body.category.value === 'sub-neptune' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant') continue
        if (/tidally|cryovolcanic|volcanic/i.test(body.bodyClass.value) && !/tidally locked/i.test(body.bodyClass.value)) continue
        expect(hotOnly.has(body.detail.geology.value), `${body.bodyClass.value} (Dark) got ${body.detail.geology.value}`).toBe(false)
      }
    }
  })

  it('pins magma-ocean class geology to silicate-volcanic states', () => {
    const moltenGeos = new Set(['Active volcanism', 'Extreme plume provinces', 'Global resurfacing', 'Tidal heating'])
    const triggers = /^(?:lava planet|magma ocean world|carbon-rich furnace world|tidally stretched volcanic world)$/i
    let sawTrigger = false
    for (let index = 0; index < 200; index++) {
      const system = generateSystem({
        ...options,
        seed: `magma-geo-${index.toString(16).padStart(4, '0')}`,
      })
      for (const body of system.bodies) {
        if (!triggers.test(body.bodyClass.value)) continue
        sawTrigger = true
        expect(moltenGeos.has(body.detail.geology.value), `${body.bodyClass.value} got geology=${body.detail.geology.value}`).toBe(true)
      }
    }
    expect(sawTrigger).toBe(true)
  })

  it('exports a Gates section in markdown when gates are present', async () => {
    const { exportSystemMarkdown } = await import('../lib/export/markdown')
    let withGate: ReturnType<typeof generateSystem> | undefined
    for (let index = 0; index < 80; index++) {
      const system = generateSystem({
        ...options,
        settlements: 'crowded',
        seed: `gate-md-${index.toString(16).padStart(4, '0')}`,
      })
      if (system.gates.length > 0) {
        withGate = system
        break
      }
    }
    expect(withGate, 'expected a seeded system with at least one gate within 80 attempts').toBeDefined()
    const markdown = exportSystemMarkdown(withGate!)
    expect(markdown).toContain('## Gates')
    expect(markdown).toContain(`### ${withGate!.gates[0].name.value}`)
    expect(markdown).toContain('**Route Note:**')
  })

  it('weights settlement tags toward civic at urban scale and remote at outpost scale', () => {
    const allSettlements = Array.from({ length: 200 }, (_, index) =>
      generateSystem({
        ...options,
        settlements: 'crowded',
        seed: `tag-band-${index.toString(16).padStart(4, '0')}`,
      }),
    ).flatMap((sys) => sys.settlements)

    const tagsByLabel = new Map(settlementTagOptions.map((tag) => [tag.label, tag.civicScale ?? 'neutral']))
    const urban = allSettlements.filter((s) => ['10+ million', '1-10 million', '100,001-1 million'].includes(s.population.value))
    const outpost = allSettlements.filter((s) => ['Minimal (<5)', '1-20', '21-100', '101-1,000'].includes(s.population.value))

    if (urban.length > 10) {
      const urbanCivicShare = urban.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'civic').length
      const urbanRemoteShare = urban.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'remote').length
      expect(urbanCivicShare).toBeGreaterThan(urbanRemoteShare)
    }
    if (outpost.length > 10) {
      const outpostCivicShare = outpost.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'civic').length
      const outpostRemoteShare = outpost.flatMap((s) => s.tags.map((t) => tagsByLabel.get(t.value))).filter((c) => c === 'remote').length
      expect(outpostRemoteShare).toBeGreaterThan(outpostCivicShare)
    }
  })

  it('tone-axis shifts settlement habitation distribution', () => {
    const settlementsByTone = (tone: GenerationOptions['tone']) =>
      Array.from({ length: 60 }, (_, index) =>
        generateSystem({
          ...options,
          tone,
          settlements: 'crowded',
          seed: `tone-axis-${tone}-${index.toString(16).padStart(4, '0')}`,
        }),
      ).flatMap((sys) => sys.settlements)

    const cinematic = settlementsByTone('cinematic')
    const astronomy = settlementsByTone('astronomy')

    const rate = (settlements: typeof cinematic, pattern: string) =>
      settlements.filter((s) => s.habitationPattern.value === pattern).length / settlements.length

    expect(rate(cinematic, 'Abandoned')).toBeGreaterThan(rate(astronomy, 'Abandoned'))
    expect(rate(cinematic, 'Distributed swarm')).toBeGreaterThan(rate(astronomy, 'Distributed swarm'))
  })

  it('ties settlement hooks to hidden truths and immediate scene pressure', () => {
    for (let index = 0; index < 60; index++) {
      const system = generateSystem({ ...options, settlements: 'crowded', seed: `hook-coherence-${index.toString(16).padStart(4, '0')}` })
      for (const settlement of system.settlements) {
        expect(settlement.tagHook.value.toLowerCase()).toContain(settlement.hiddenTruth.value.toLowerCase())
        const normalizedFunction = settlement.function.value
          .toLowerCase()
          .replace(/\bshielding\/chiral\b/g, 'shielding and chiral')
        expect(settlement.tagHook.value.toLowerCase()).toContain(normalizedFunction)
      }
    }
  })

  it('keeps settlement tag hook crisis clauses grammatical', () => {
    for (let index = 0; index < 40; index++) {
      const system = generateSystem({
        ...options,
        seed: `tag-hook-grammar-${index.toString(16).padStart(4, '0')}`,
        settlements: index % 2 === 0 ? 'crowded' : 'hub',
        gu: index % 3 === 0 ? 'fracture' : 'high',
      })

      for (const settlement of system.settlements) {
        expect(settlement.tagHook.value).not.toMatch(/\bThe crisis around [^.]+\b(?:is|are|was|were|has|have|cannot|can|will|would)\b/i)
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
    const locationCategoryByLabel = new Map(
      Object.values(settlementLocations).flat().map((location) => [location.label, location.category])
    )
    const allowedFormsByCategory = new Map(
      Object.entries(builtForms.bySiteCategory).map(([category, forms]) => [category, new Set(forms)])
    )
    for (const [label, form] of Object.entries(builtForms.exactLocation)) {
      const category = locationCategoryByLabel.get(label)
      if (category) allowedFormsByCategory.get(category)?.add(form)
    }
    for (const [label, forms] of Object.entries(builtForms.mobileLocationPools)) {
      const category = locationCategoryByLabel.get(label)
      if (category) {
        const allowedForms = allowedFormsByCategory.get(category)
        for (const form of forms) allowedForms?.add(form)
      }
    }
    for (const [category, forms] of Object.entries(builtForms.miningBySiteCategory)) {
      if (category === 'default') {
        for (const allowedForms of allowedFormsByCategory.values()) {
          for (const form of forms) allowedForms.add(form)
        }
      } else {
        const allowedForms = allowedFormsByCategory.get(category)
        for (const form of forms) allowedForms?.add(form)
      }
    }

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
          const moon = body?.moons.find((candidate) => candidate.id === settlement.moonId)
          expect(moon).toBeTruthy()
          expect(settlement.anchorKind.value).toBe('major moon')
          expect(settlement.anchorName.value).toBe(moon?.name.value)
          expect(settlement.anchorName.value).toMatch(/ - Moon [IVXLCDM]+$/)
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

  it('uses source moon detail and ring tables across sampled systems', () => {
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

  it('scales named moon systems by giant category, class, and radius', () => {
    const systems = Array.from({ length: 360 }, (_, index) =>
      generateSystem({ ...options, seed: `moon-regression-${index.toString(16).padStart(4, '0')}` })
    )
    const moonCounts = (bodies: typeof systems[number]['bodies']) => bodies.map((body) => body.moons.length)
    const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length
    const median = (values: number[]) => {
      const sorted = [...values].sort((left, right) => left - right)
      return sorted[Math.floor((sorted.length - 1) / 2)]
    }
    const gasGiants = systems.flatMap((system) => system.bodies.filter((body) => body.category.value === 'gas-giant'))
    const iceGiants = systems.flatMap((system) => system.bodies.filter((body) => body.category.value === 'ice-giant'))
    const superJovians = gasGiants.filter((body) => body.bodyClass.value === 'Super-Jovian')
    const ordinaryGasGiants = gasGiants.filter((body) =>
      !['Hot Jupiter', 'Ultra-hot Jupiter', 'Super-Jovian', 'Migrated giant'].includes(body.bodyClass.value) &&
      !body.physical.closeIn.value
    )
    const largeOrdinaryGasGiants = ordinaryGasGiants.filter((body) => body.physical.radiusEarth.value >= 11)
    const smallOrdinaryGasGiants = ordinaryGasGiants.filter((body) => body.physical.radiusEarth.value < 9.5)

    expect(gasGiants.length).toBeGreaterThan(50)
    expect(iceGiants.length).toBeGreaterThan(20)
    expect(superJovians.length).toBeGreaterThan(10)
    expect(largeOrdinaryGasGiants.length).toBeGreaterThan(10)
    expect(smallOrdinaryGasGiants.length).toBeGreaterThan(10)
    expect(median(moonCounts(gasGiants))).toBeGreaterThanOrEqual(9)
    expect(average(moonCounts(gasGiants))).toBeGreaterThan(average(moonCounts(iceGiants)) + 2)
    expect(median(moonCounts(superJovians))).toBeGreaterThanOrEqual(12)
    expect(average(moonCounts(largeOrdinaryGasGiants))).toBeGreaterThan(average(moonCounts(smallOrdinaryGasGiants)) + 2)
  })
})
