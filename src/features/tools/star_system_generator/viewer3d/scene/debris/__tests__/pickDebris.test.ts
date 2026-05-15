import { describe, it, expect } from 'vitest'
import { pickDebrisRenderer } from '../pickDebris'
import type { DebrisFieldShape } from '../../../../types'

const SHAPES: DebrisFieldShape[] = [
  'polar-ring', 'mass-transfer-stream', 'common-envelope-shell',
  'inner-pair-halo', 'trojan-camp', 'kozai-scattered-halo',
  'hill-sphere-capture-cone', 'exocomet-swarm', 'accretion-bridge', 'gardener-cordon',
]

describe('pickDebrisRenderer', () => {
  it('every archetype maps to a renderer', () => {
    for (const shape of SHAPES) {
      const r = pickDebrisRenderer({ shape, densityBand: 'sparse' })
      expect(r.component, shape).toBeDefined()
      expect(['ring', 'shell', 'stream', 'halo']).toContain(r.component)
    }
  })

  it('rings map to ring component', () => {
    for (const shape of ['polar-ring', 'trojan-camp', 'inner-pair-halo', 'gardener-cordon'] as const) {
      expect(pickDebrisRenderer({ shape, densityBand: 'asteroid-fleet' }).component).toBe('ring')
    }
  })

  it('shell maps to shell component', () => {
    expect(pickDebrisRenderer({ shape: 'common-envelope-shell', densityBand: 'shell-dense' }).component).toBe('shell')
  })

  it('streams map to stream component', () => {
    expect(pickDebrisRenderer({ shape: 'mass-transfer-stream', densityBand: 'stream' }).component).toBe('stream')
    expect(pickDebrisRenderer({ shape: 'accretion-bridge', densityBand: 'dust' }).component).toBe('stream')
  })

  it('halos map to halo component', () => {
    for (const shape of ['kozai-scattered-halo', 'hill-sphere-capture-cone', 'exocomet-swarm'] as const) {
      expect(pickDebrisRenderer({ shape, densityBand: 'sparse' }).component).toBe('halo')
    }
  })

  it('density band drives particleCount and opacity', () => {
    expect(pickDebrisRenderer({ shape: 'common-envelope-shell', densityBand: 'shell-dense' }).visualParams.particleCount).toBe(600)
    expect(pickDebrisRenderer({ shape: 'gardener-cordon', densityBand: 'dust' }).visualParams.opacity).toBe(0.35)
  })
})
