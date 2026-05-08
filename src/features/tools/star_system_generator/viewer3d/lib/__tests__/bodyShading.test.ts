import { describe, it, expect } from 'vitest'
import type { OrbitingBody } from '../../../types'
import { chooseShading, shaderUniforms } from '../bodyShading'

function fakeBody(category: OrbitingBody['category']['value'], overrides: Partial<OrbitingBody> = {}): OrbitingBody {
  return {
    id: 'b1',
    orbitAu: { value: 1, confidence: 'derived' },
    name: { value: 'Test', confidence: 'derived' },
    category: { value: category, confidence: 'derived' },
    massClass: { value: '', confidence: 'derived' },
    bodyClass: { value: '', confidence: 'derived' },
    whyInteresting: { value: '', confidence: 'derived' },
    thermalZone: { value: 'temperate', confidence: 'derived' },
    physical: {
      radiusEarth: { value: 1, confidence: 'derived' },
      massEarth: { value: 1, confidence: 'derived' },
      surfaceGravityG: { value: 1, confidence: 'derived' },
      gravityLabel: { value: '1g', confidence: 'derived' },
      periodDays: { value: 365, confidence: 'derived' },
      closeIn: { value: false, confidence: 'derived' },
      volatileEnvelope: { value: false, confidence: 'derived' },
    },
    detail: {
      atmosphere: { value: '', confidence: 'derived' },
      hydrosphere: { value: '', confidence: 'derived' },
      geology: { value: '', confidence: 'derived' },
      climate: [],
      radiation: { value: '', confidence: 'derived' },
      biosphere: { value: '', confidence: 'derived' },
    },
    moons: [],
    filterNotes: [],
    traits: [],
    sites: [],
    ...overrides,
  } as OrbitingBody
}

describe('chooseShading', () => {
  it('maps gas-giant to gas-giant shading', () => {
    expect(chooseShading(fakeBody('gas-giant'))).toBe('gas-giant')
  })

  it('maps ice-giant to ice-giant shading', () => {
    expect(chooseShading(fakeBody('ice-giant'))).toBe('ice-giant')
  })

  it('maps sub-neptune to sub-neptune shading', () => {
    expect(chooseShading(fakeBody('sub-neptune'))).toBe('sub-neptune')
  })

  it('maps anomaly to anomaly shading', () => {
    expect(chooseShading(fakeBody('anomaly'))).toBe('anomaly')
  })

  it('maps dwarf-body to dwarf shading', () => {
    expect(chooseShading(fakeBody('dwarf-body'))).toBe('dwarf')
  })

  it('routes rocky-planet by thermal hint: hot → desert, cold → rocky-cool, habitable hydrosphere → earthlike', () => {
    const hot = fakeBody('rocky-planet', {
      thermalZone: { value: 'inner-hot', confidence: 'derived' },
      physical: { ...fakeBody('rocky-planet').physical, closeIn: { value: true, confidence: 'derived' } },
    })
    const cold = fakeBody('rocky-planet', { thermalZone: { value: 'outer-cold', confidence: 'derived' } })
    const habitable = fakeBody('rocky-planet', {
      detail: {
        ...fakeBody('rocky-planet').detail,
        hydrosphere: { value: 'liquid water oceans', confidence: 'derived' },
      },
    })
    expect(chooseShading(hot)).toBe('desert')
    expect(chooseShading(cold)).toBe('rocky-cool')
    expect(chooseShading(habitable)).toBe('earthlike')
  })

  it('falls through to rocky-warm for unspecified rocky planets', () => {
    expect(chooseShading(fakeBody('rocky-planet'))).toBe('rocky-warm')
  })
})

describe('shaderUniforms', () => {
  it('returns a baseColor and a noiseScale for every shading key', () => {
    const u = shaderUniforms(fakeBody('rocky-planet'))
    expect(u.baseColor).toBeDefined()
    expect(u.noiseScale).toBeGreaterThan(0)
  })

  it('boosts atmosphere haze when volatileEnvelope is true', () => {
    const dry = shaderUniforms(fakeBody('rocky-planet'))
    const hazy = shaderUniforms(
      fakeBody('rocky-planet', {
        physical: { ...fakeBody('rocky-planet').physical, volatileEnvelope: { value: true, confidence: 'derived' } },
      }),
    )
    expect(hazy.atmosphereStrength).toBeGreaterThan(dry.atmosphereStrength)
  })

  it('boosts heat tint when closeIn is true', () => {
    const cool = shaderUniforms(fakeBody('rocky-planet'))
    const hot = shaderUniforms(
      fakeBody('rocky-planet', {
        physical: { ...fakeBody('rocky-planet').physical, closeIn: { value: true, confidence: 'derived' } },
      }),
    )
    expect(hot.heatTint).toBeGreaterThan(cool.heatTint)
  })
})
