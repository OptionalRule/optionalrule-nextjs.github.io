import { describe, expect, it } from 'vitest'
import type { Fact, OrbitingBody, Star, StellarCompanion } from '../../../types'
import {
  buildBodySurfaceProfile,
  buildMoonSurfaceProfile,
  companionStarVisuals,
  hazardVolumeProfile,
  phenomenonVisualProfile,
} from '../visualProfiles'

function fact<T>(value: T, confidence: Fact<T>['confidence'] = 'derived'): Fact<T> {
  return { value, confidence }
}

function fakeBody(overrides: Partial<OrbitingBody> = {}): OrbitingBody {
  return {
    id: 'body-1',
    orbitAu: fact(1),
    name: fact('Test'),
    category: fact('rocky-planet'),
    massClass: fact('terrestrial'),
    bodyClass: fact('Temperate waterworld'),
    whyInteresting: fact('Liquid water oceans and mild storms'),
    thermalZone: fact('temperate'),
    physical: {
      radiusEarth: fact(1),
      massEarth: fact(1),
      surfaceGravityG: fact(1),
      gravityLabel: fact('1g'),
      periodDays: fact(365),
      closeIn: fact(false),
      volatileEnvelope: fact(false),
    },
    detail: {
      atmosphere: fact('Moderate breathable atmosphere'),
      hydrosphere: fact('Global ocean'),
      geology: fact('Plate tectonics'),
      climate: [fact('Storm tracks')],
      radiation: fact('low'),
      biosphere: fact('none'),
      mineralComposition: fact(''),
      magneticField: fact(''),
      atmosphericTraces: fact(''),
      hydrology: fact(''),
      topography: fact(''),
      rotationProfile: fact(''),
      seismicActivity: fact(''),
      surfaceHazards: fact(''),
      dayLength: fact(''),
      surfaceLight: fact(''),
      axialTilt: fact(''),
      skyPhenomena: fact(''),
      atmosphericPressure: fact(''),
      windRegime: fact(''),
      tidalRegime: fact(''),
      acousticEnvironment: fact(''),
      resourceAccess: fact(''),
      biosphereDistribution: fact(''),
    },
    moons: [],
    filterNotes: [],
    traits: [],
    sites: [],
    ...overrides,
  } as OrbitingBody
}

function fakeCompanionStar(overrides: Partial<Star> = {}): Star {
  return {
    id: 'companion-star-1',
    name: fact('Companion'),
    spectralType: fact('M dwarf'),
    massSolar: fact(0.3),
    luminositySolar: fact(0.05),
    ageState: fact('Main sequence, mature'),
    metallicity: fact('Solar'),
    activity: fact('Quiet'),
    activityRoll: fact(7),
    activityModifiers: [],
    ...overrides,
  }
}

function fakeCompanion(overrides: Partial<StellarCompanion> = {}): StellarCompanion {
  return {
    id: 'companion-1',
    companionType: fact('Red dwarf companion'),
    separation: fact('wide'),
    planetaryConsequence: fact('stable outer companion'),
    guConsequence: fact('none'),
    rollMargin: fact(4),
    mode: 'orbital-sibling',
    star: fakeCompanionStar(),
    ...overrides,
  }
}

describe('visualProfiles', () => {
  it('keeps body surface profiles deterministic for the same body and seed', () => {
    const body = fakeBody()
    expect(buildBodySurfaceProfile(body, 'seed-a', 0)).toEqual(buildBodySurfaceProfile(body, 'seed-a', 0))
    expect(buildBodySurfaceProfile(body, 'seed-a', 0).surfaceSeed).not.toBe(buildBodySurfaceProfile(body, 'seed-b', 0).surfaceSeed)
  })

  it('derives ocean, airless, and settled families from physical details', () => {
    expect(buildBodySurfaceProfile(fakeBody(), 'seed', 0).family).toBe('ocean')
    expect(buildBodySurfaceProfile(fakeBody({
      bodyClass: fact('Airless rubble remnant'),
      detail: { ...fakeBody().detail, atmosphere: fact('Hard vacuum'), hydrosphere: fact('none / dispersed') },
    }), 'seed', 0).family).toBe('airless')
    expect(buildBodySurfaceProfile(fakeBody(), 'seed', 2).family).toBe('settled')
  })

  it('builds moon profiles from moon facts instead of a single shared gray material', () => {
    const icy = buildMoonSurfaceProfile({
      id: 'moon-ice',
      name: fact('Icy'),
      moonType: fact('Ice-shell ocean moon'),
      scale: fact('large differentiated moon'),
      resource: fact('volatile ice'),
      hazard: fact('cryovolcanic plumes'),
      use: fact('survey base'),
    }, 'seed')

    expect(icy.family).toBe('ice')
    expect(icy.iceCoverage).toBeGreaterThan(0)
    expect(icy.surfaceSeed).toBe(buildMoonSurfaceProfile({
      id: 'moon-ice',
      name: fact('Icy'),
      moonType: fact('Ice-shell ocean moon'),
      scale: fact('large differentiated moon'),
      resource: fact('volatile ice'),
      hazard: fact('cryovolcanic plumes'),
      use: fact('survey base'),
    }, 'seed').surfaceSeed)
  })

  it('uses companion.star.spectralType for companion star color families', () => {
    const red = companionStarVisuals(fakeCompanion())
    const white = companionStarVisuals(fakeCompanion({
      id: 'companion-2',
      star: fakeCompanionStar({ id: 'companion-star-2', spectralType: fact('White dwarf') }),
    }))

    expect(red.coreColor).toMatch(/^#/)
    expect(white.coreColor).toMatch(/^#/)
    expect(red.coreColor).not.toBe(white.coreColor)
  })

  it('maps hazards and phenomena into deterministic visual shapes and colors', () => {
    expect(hazardVolumeProfile('radiation belt near gas giant', 'h1').shape).toBe('torus')
    expect(hazardVolumeProfile('route corridor shear', 'h2').shape).toBe('ribbon')
    expect(phenomenonVisualProfile('metric fold static', 'p1')).toEqual(phenomenonVisualProfile('metric fold static', 'p1'))
    expect(phenomenonVisualProfile('metric fold static', 'p1').color).not.toBe('#000000')
    expect(phenomenonVisualProfile('metric fold static', 'p1').glowColor).toMatch(/^#/)
  })
})
