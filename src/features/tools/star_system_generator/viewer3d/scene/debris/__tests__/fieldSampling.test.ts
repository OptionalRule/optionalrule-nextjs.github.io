import { describe, it, expect } from 'vitest'
import { defaultDebrisVisualProfile } from '../debrisVisualProfile'
import { sampleRingChunks, sampleRingDust, sampleVolumeDust } from '../fieldSampling'

function finiteVec3(v: [number, number, number]): boolean {
  return v.every(Number.isFinite)
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
}

describe('debris field sampling', () => {
  it('is deterministic for a fixed seed/profile', () => {
    const profile = defaultDebrisVisualProfile('exocomet-swarm', 'sparse')
    const args = {
      fieldId: 'deterministic-field',
      count: 24,
      innerRadius: 4,
      radialThickness: 9,
      startRad: 0,
      spanRad: Math.PI * 2,
      verticalThickness: 3,
      profile,
      kind: 'dust' as const,
    }

    expect(sampleRingDust(args)).toEqual(sampleRingDust(args))
  })

  it('produces finite dust and chunk placements inside the field scale', () => {
    const profile = defaultDebrisVisualProfile('kozai-scattered-halo', 'sparse')
    const dust = sampleVolumeDust({
      fieldId: 'finite-field',
      count: 80,
      innerRadius: 5,
      outerRadius: 25,
      maxTiltRad: Math.PI / 3,
      profile,
      kind: 'dust',
    })
    const chunks = sampleRingChunks({
      fieldId: 'finite-field',
      count: 12,
      innerRadius: 5,
      radialThickness: 20,
      startRad: 0,
      spanRad: Math.PI * 2,
      verticalThickness: 4,
      profile,
      kind: 'chunk',
    })

    expect(dust.every((sample) => finiteVec3(sample.position))).toBe(true)
    expect(chunks.every((sample) => finiteVec3(sample.position))).toBe(true)
    expect(dust.some((sample) => Math.abs(sample.position[1]) > 1)).toBe(true)
    expect(dust.some((sample) => sample.aspect[0] > 1.5)).toBe(true)
  })

  it('keeps a visible medium-to-hero chunk size range for chaotic fields', () => {
    const profile = defaultDebrisVisualProfile('exocomet-swarm', 'asteroid-fleet')
    const chunks = sampleRingChunks({
      fieldId: 'chunk-size-field',
      count: 96,
      innerRadius: 8,
      radialThickness: 18,
      startRad: 0,
      spanRad: Math.PI * 2,
      verticalThickness: 4,
      profile,
      kind: 'chunk',
    })

    const sizes = chunks.map((sample) => sample.sizeMul)
    expect(Math.max(...sizes)).toBeGreaterThan(3)
    expect(sizes.filter((size) => size > 1.2).length).toBeGreaterThan(28)
  })

  it('fades ring dust opacity toward inner and outer radial edges', () => {
    const profile = defaultDebrisVisualProfile('exocomet-swarm', 'asteroid-fleet')
    const innerRadius = 10
    const radialThickness = 20
    const samples = sampleRingDust({
      fieldId: 'ring-edge-fade-field',
      count: 900,
      innerRadius,
      radialThickness,
      startRad: 0,
      spanRad: Math.PI * 2,
      verticalThickness: 4,
      profile,
      kind: 'dust',
    })

    const edgeOpacity: number[] = []
    const interiorOpacity: number[] = []
    for (const sample of samples) {
      const r = Math.hypot(sample.position[0], sample.position[2])
      const radialT = (r - innerRadius) / radialThickness
      if (radialT < 0.12 || radialT > 0.88) edgeOpacity.push(sample.opacity)
      if (radialT > 0.2 && radialT < 0.8) interiorOpacity.push(sample.opacity)
    }

    expect(edgeOpacity.length).toBeGreaterThan(10)
    expect(interiorOpacity.length).toBeGreaterThan(100)
    expect(average(edgeOpacity)).toBeLessThan(average(interiorOpacity) * 0.65)
  })

  it('gives chaotic profiles visibly more vertical scatter than calm rings', () => {
    const calm = defaultDebrisVisualProfile('polar-ring', 'asteroid-fleet')
    const chaos = defaultDebrisVisualProfile('common-envelope-shell', 'shell-dense')
    const baseArgs = {
      fieldId: 'scatter-field',
      count: 160,
      innerRadius: 10,
      radialThickness: 12,
      startRad: 0,
      spanRad: Math.PI * 2,
      verticalThickness: 3,
      kind: 'dust' as const,
    }

    const calmSpread = sampleRingDust({ ...baseArgs, profile: calm })
      .reduce((max, sample) => Math.max(max, Math.abs(sample.position[1])), 0)
    const chaosSpread = sampleRingDust({ ...baseArgs, profile: chaos })
      .reduce((max, sample) => Math.max(max, Math.abs(sample.position[1])), 0)

    expect(chaosSpread).toBeGreaterThan(calmSpread * 1.8)
  })
})
