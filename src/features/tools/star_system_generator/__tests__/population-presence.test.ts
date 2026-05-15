import { describe, expect, it } from 'vitest'
import { distributePresence } from '../lib/generator/population'
import type { PresenceDistributionInput } from '../lib/generator/population'

const baseInput: PresenceDistributionInput = {
  band: 'outpost',
  habitability: 'viable',
  hasGate: false,
  isBeltAnchor: false,
  architectureCompact: false,
}

describe('distributePresence', () => {
  it('returns all-none for empty band', () => {
    const result = distributePresence({ ...baseInput, band: 'empty' })
    expect(result).toEqual({ surface: 'none', underground: 'none', orbital: 'none' })
  })

  it('returns all-none for automated band', () => {
    const result = distributePresence({ ...baseInput, band: 'automated' })
    expect(result.surface).toBe('none')
    expect(result.underground).toBe('none')
    expect(result.orbital).toBe('none')
  })

  it('returns minimal-only surface/underground for transient band', () => {
    const result = distributePresence({ ...baseInput, band: 'transient' })
    expect(result.surface).toBe('none')
    expect(result.underground).toBe('none')
  })

  it('puts most of a hostile-body population underground at frontier band or above', () => {
    const result = distributePresence({ ...baseInput, band: 'frontier', habitability: 'hostile' })
    expect(result.surface).toBe('none')
    expect(result.underground).toBe('dominant')
  })

  it('keeps hostile-body underground at none when band is below frontier', () => {
    const result = distributePresence({ ...baseInput, band: 'outpost', habitability: 'hostile' })
    expect(result.underground).toBe('none')
  })

  it('puts harsh-body population in shielded subsurface', () => {
    const result = distributePresence({ ...baseInput, band: 'colony', habitability: 'harsh' })
    expect(result.surface).toBe('scattered')
    expect(result.underground).toBe('widespread')
  })

  it('puts shielded-viable population in subsurface with surface scatter', () => {
    const result = distributePresence({ ...baseInput, band: 'colony', habitability: 'shielded-viable' })
    expect(result.surface).toBe('scattered')
    expect(result.underground).toBe('widespread')
  })

  it('puts viable-body population on the surface with subsurface scatter', () => {
    const result = distributePresence({ ...baseInput, band: 'colony', habitability: 'viable' })
    expect(result.surface).toBe('widespread')
    expect(result.underground).toBe('scattered')
  })

  it('puts comfortable-body population dominantly on the surface', () => {
    const result = distributePresence({ ...baseInput, band: 'established', habitability: 'comfortable' })
    expect(result.surface).toBe('dominant')
    expect(result.underground).toBe('scattered')
  })

  it('reports minimal orbital presence with a Gate even when surface is dominant', () => {
    const noGate = distributePresence({ ...baseInput, band: 'frontier', habitability: 'viable', hasGate: false })
    const withGate = distributePresence({ ...baseInput, band: 'frontier', habitability: 'viable', hasGate: true })
    expect(withGate.orbital).not.toBe('none')
    expect(withGate.orbital).not.toBe(noGate.orbital)
  })

  it('reports substantial+ orbital for ring-city tier on belt-anchor with high band', () => {
    const result = distributePresence({ ...baseInput, band: 'colony', habitability: 'hostile', isBeltAnchor: true })
    expect(['substantial', 'ring-city']).toContain(result.orbital)
  })

  it('reports minimal orbital for compact-architecture bodies with low load', () => {
    const result = distributePresence({ ...baseInput, band: 'outpost', architectureCompact: true })
    expect(['minimal', 'substantial']).toContain(result.orbital)
  })

  it('scales surface intensity with band on viable bodies', () => {
    const outpost = distributePresence({ ...baseInput, band: 'outpost', habitability: 'viable' })
    const frontier = distributePresence({ ...baseInput, band: 'frontier', habitability: 'viable' })
    const established = distributePresence({ ...baseInput, band: 'established', habitability: 'viable' })
    const surfaceOrder = ['none', 'scattered', 'widespread', 'dominant']
    expect(surfaceOrder.indexOf(outpost.surface))
      .toBeLessThanOrEqual(surfaceOrder.indexOf(frontier.surface))
    expect(surfaceOrder.indexOf(frontier.surface))
      .toBeLessThanOrEqual(surfaceOrder.indexOf(established.surface))
  })
})
