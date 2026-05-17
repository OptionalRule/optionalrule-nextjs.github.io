import { describe, it, expect } from 'vitest'
import { debrisVisualProfile } from '../debrisVisualProfile'
import type { DebrisFieldVisual } from '../../../types'
import type { DebrisField } from '../../../../../types'

function makeField(
  shape: DebrisField['shape']['value'],
  opts: Partial<Pick<DebrisField, 'companionId'>> & { density?: DebrisField['densityBand']['value']; name?: string; whyHere?: string } = {},
): DebrisFieldVisual {
  return {
    field: {
      id: `field-${shape}`,
      shape: { value: shape, confidence: 'derived' },
      archetypeName: { value: opts.name ?? 'Test field', confidence: 'derived' },
      companionId: opts.companionId ?? 'companion-1',
      spatialExtent: {
        innerAu: { value: 1, confidence: 'derived' },
        outerAu: { value: 4, confidence: 'derived' },
        inclinationDeg: { value: 20, confidence: 'derived' },
        spanDeg: { value: 360, confidence: 'derived' },
        centerAngleDeg: { value: 0, confidence: 'derived' },
      },
      densityBand: { value: opts.density ?? 'sparse', confidence: 'inferred' },
      anchorMode: { value: 'transient-only', confidence: 'inferred' },
      guCharacter: { value: '', confidence: 'gu-layer' },
      prize: { value: '', confidence: 'inferred' },
      spawnedPhenomenonId: null,
      whyHere: { value: opts.whyHere ?? '', confidence: 'inferred' },
    },
    innerRadius: 8,
    outerRadius: 20,
    inclinationDeg: 20,
    spanDeg: 360,
    centerAngleDeg: 0,
  }
}

describe('debrisVisualProfile', () => {
  it('keeps settled rings much calmer than ejecta shells', () => {
    const ring = debrisVisualProfile(makeField('polar-ring', { density: 'asteroid-fleet' }))
    const shell = debrisVisualProfile(makeField('common-envelope-shell', { density: 'shell-dense' }))

    expect(ring.style).toBe('settled-ring')
    expect(shell.style).toBe('ejecta-shell')
    expect(shell.chaos).toBeGreaterThan(ring.chaos)
    expect(shell.knotCount).toBeGreaterThan(ring.knotCount)
    expect(shell.verticalScatter).toBeGreaterThan(ring.verticalScatter)
  })

  it('promotes system-origin fields to a high-chaos profile', () => {
    const profile = debrisVisualProfile(makeField('exocomet-swarm', {
      companionId: null,
      density: 'shell-dense',
      name: 'Primordial debris chaos',
      whyHere: 'young formation debris',
    }))

    expect(profile.style).toBe('chaotic-disk')
    expect(profile.chaos).toBeGreaterThanOrEqual(0.9)
    expect(profile.knotCount).toBeGreaterThanOrEqual(16)
    expect(profile.hazeOpacity).toBeGreaterThan(0.4)
  })
})
