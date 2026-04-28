import { describe, expect, it } from 'vitest'
import type { BodyCategory, Fact, GeneratedSystem, OrbitingBody, Settlement } from '../types'
import {
  validateArchitecture,
  validateBodyEnvironment,
  validateBodyPhysicalContract,
  validateSettlementCompatibility,
  validateSettlementNames,
} from '../lib/generator/validation'

function fact<T>(value: T): Fact<T> {
  return { value, confidence: 'inferred' }
}

function body(overrides: Partial<OrbitingBody> = {}): OrbitingBody {
  const category = overrides.category?.value ?? 'rocky-planet'

  return {
    id: 'body-1',
    orbitAu: fact(1),
    name: fact('Test Body'),
    category: fact(category),
    massClass: fact('Terrestrial'),
    bodyClass: fact('Earth-sized terrestrial'),
    whyInteresting: fact('Test body.'),
    thermalZone: fact('Temperate band'),
    physical: {
      radiusEarth: fact(1),
      massEarth: fact(category === 'belt' || category === 'anomaly' ? null : 1),
      surfaceGravityG: fact(category === 'belt' || category === 'anomaly' ? null : 1),
      gravityLabel: fact(category === 'belt' ? 'Not applicable for distributed belt/swarm.' : category === 'anomaly' ? 'Unreliable due to anomaly.' : 'Estimated surface gravity 1 g.'),
      periodDays: fact(365),
      closeIn: fact(false),
      volatileEnvelope: fact(category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'),
    },
    detail: {
      atmosphere: fact('Moderate inert atmosphere'),
      hydrosphere: fact('Briny aquifers'),
      geology: fact('Static lid'),
      climate: [fact('Permanent storm tracks')],
      radiation: fact('Manageable'),
      biosphere: fact('Sterile'),
    },
    moons: [],
    filterNotes: [],
    traits: [],
    sites: [],
    ...overrides,
  }
}

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    id: 'settlement-1',
    bodyId: 'body-1',
    name: fact('Test Settlement'),
    anchorKind: fact('surface'),
    anchorName: fact('Test Body'),
    anchorDetail: fact('on Test Body'),
    siteCategory: fact('Surface settlement'),
    location: fact('Equatorial highland'),
    function: fact('Refinery'),
    scale: fact('21-100 people'),
    authority: fact('Worker council'),
    builtForm: fact('Dome cluster'),
    aiSituation: fact('No local AI'),
    condition: fact('Functional'),
    tags: [fact('Useful'), fact('Contested')],
    tagHook: fact('Useful but contested.'),
    crisis: fact('Water ration failure'),
    hiddenTruth: fact('The settlement is insolvent'),
    encounterSites: [fact('Dock'), fact('Market')],
    whyHere: fact('It is useful here.'),
    methodNotes: [fact('Generated')],
    presence: {
      score: fact(1),
      roll: fact(7),
      tier: fact('Settlement'),
      resource: fact(1),
      access: fact(1),
      strategic: fact(1),
      guValue: fact(0),
      habitability: fact(0),
      hazard: fact(0),
      legalHeat: fact(0),
    },
    ...overrides,
  }
}

function system(overrides: Partial<GeneratedSystem> = {}): GeneratedSystem {
  return {
    id: 'system-test',
    seed: 'test',
    options: { seed: 'test', distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' },
    name: fact('Test System'),
    dataBasis: fact('Fixture'),
    primary: {} as GeneratedSystem['primary'],
    companions: [],
    reachability: {} as GeneratedSystem['reachability'],
    architecture: {
      name: fact('Compact inner system'),
      description: fact('Fixture architecture'),
    },
    zones: {} as GeneratedSystem['zones'],
    bodies: [body({ id: 'body-1', category: fact('rocky-planet' as BodyCategory) })],
    guOverlay: {
      intensity: fact('Useful bleed'),
      bleedLocation: fact('Lagrange point'),
      bleedBehavior: fact('Stable'),
      resource: fact('Metric shear condensates'),
      hazard: fact('Navigation baselines drift'),
      intensityRoll: fact(7),
      intensityModifiers: [],
    },
    settlements: [],
    ruins: [],
    phenomena: [],
    majorHazards: [],
    noAlienCheck: { passed: true, note: 'passed' },
    ...overrides,
  }
}

describe('star system validation contracts', () => {
  it('reports airless atmosphere and hydrosphere contradictions as generated errors', () => {
    const findings = validateBodyEnvironment(body({
      bodyClass: fact('Airless rock in nominal HZ'),
      detail: {
        atmosphere: fact('Moderate inert atmosphere'),
        hydrosphere: fact('Global ocean'),
        geology: fact('Static lid'),
        climate: [fact('Cold desert')],
        radiation: fact('Manageable'),
        biosphere: fact('Sterile'),
      },
    }))

    expect(findings.map((finding) => finding.code)).toContain('ENV_AIRLESS_ATMOSPHERE')
    expect(findings.map((finding) => finding.code)).toContain('ENV_AIRLESS_HYDROSPHERE')
    expect(findings.every((finding) => finding.severity === 'error')).toBe(true)
  })

  it('reports desert hydrosphere contradictions as generated errors', () => {
    const findings = validateBodyEnvironment(body({
      bodyClass: fact('Dry supercontinent world'),
      detail: {
        atmosphere: fact('Thin CO2/N2'),
        hydrosphere: fact('Global ocean'),
        geology: fact('Static lid'),
        climate: [fact('Hot desert')],
        radiation: fact('Manageable'),
        biosphere: fact('Sterile'),
      },
    }))

    expect(findings.map((finding) => finding.code)).toContain('ENV_DESERT_HYDROSPHERE')
  })

  it('reports compact architecture core-count failures', () => {
    const findings = validateArchitecture(system({
      architecture: { name: fact('Compact inner system'), description: fact('Fixture') },
      bodies: [
        body({ id: 'belt-1', category: fact('belt' as BodyCategory), physical: { ...body({ category: fact('belt' as BodyCategory) }).physical } }),
        body({ id: 'giant-1', category: fact('gas-giant' as BodyCategory), physical: { ...body({ category: fact('gas-giant' as BodyCategory) }).physical } }),
      ],
    }))

    expect(findings.map((finding) => finding.code)).toContain('ARCH_MINIMUM_UNSATISFIED')
  })

  it('reports duplicate settlement names as hard errors after registry repair', () => {
    const findings = validateSettlementNames(system({
      settlements: [
        settlement({ id: 'settlement-1', name: fact('Nadir Hold') }),
        settlement({ id: 'settlement-2', name: fact('Nadir Hold') }),
      ],
    }))

    expect(findings).toHaveLength(1)
    expect(findings[0].code).toBe('SETTLEMENT_DUPLICATE_NAME')
    expect(findings[0].severity).toBe('error')
  })

  it('reports incompatible settlement built forms', () => {
    const testSystem = system({
      bodies: [body({ id: 'body-1' })],
    })
    const findings = validateSettlementCompatibility(testSystem, settlement({
      siteCategory: fact('Surface settlement'),
      builtForm: fact('Rotating cylinder'),
    }))

    expect(findings.map((finding) => finding.code)).toContain('SETTLEMENT_BUILT_FORM_INCOMPATIBLE')
  })

  it('reports belt physical contract failures', () => {
    const findings = validateBodyPhysicalContract(body({
      category: fact('belt' as BodyCategory),
      physical: {
        radiusEarth: fact(1),
        massEarth: fact(1),
        surfaceGravityG: fact(1),
        gravityLabel: fact('Estimated surface gravity 1 g.'),
        periodDays: fact(365),
        closeIn: fact(false),
        volatileEnvelope: fact(false),
      },
    }))

    expect(findings.map((finding) => finding.code)).toContain('BODY_BELT_PHYSICAL')
  })
})
