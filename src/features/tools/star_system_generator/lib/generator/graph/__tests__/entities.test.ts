import { describe, expect, it } from 'vitest'
import { buildEntityInventory, type EntityInventoryInput } from '../entities'

const minimalInput = (): EntityInventoryInput => ({
  systemName: 'Nosaxa IV',
  primary: { spectralType: { value: 'G2V' } },
  companions: [],
  bodies: [
    { id: 'body-1', name: { value: 'Nosaxa IV-a' } },
    { id: 'body-2', name: { value: 'Nosaxa IV-b' } },
  ],
  settlements: [
    { id: 'settlement-1', name: { value: 'Orison Hold' } },
  ],
  guOverlay: {
    resource: { value: 'chiral ice belt' },
    hazard: { value: 'flare-amplified bleed season' },
  },
  phenomena: [
    { id: 'phenomenon-1', phenomenon: { value: 'Dense debris disk' } },
    { id: 'phenomenon-2', phenomenon: { value: 'Resonant compact chain' } },
  ],
  ruins: [
    { id: 'ruin-1', remnantType: { value: 'First-wave colony shell' } },
  ],
  narrativeFacts: [
    { kind: 'namedFaction', value: { value: 'Route Authority' } },
    { kind: 'namedFaction', value: { value: 'Kestrel Free Compact' } },
    { kind: 'namedFaction', value: { value: 'Route Authority' } },
    { kind: 'settlement.crisis', value: { value: 'Bleed node changed course' } },
  ],
})

describe('buildEntityInventory', () => {
  it('produces a single system entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const systemRefs = refs.filter(r => r.kind === 'system')
    expect(systemRefs).toHaveLength(1)
    expect(systemRefs[0]).toMatchObject({
      kind: 'system',
      id: 'system',
      displayName: 'Nosaxa IV',
      layer: 'physical',
    })
  })

  it('produces a primary star entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const starRefs = refs.filter(r => r.kind === 'star')
    expect(starRefs).toHaveLength(1)
    expect(starRefs[0]).toMatchObject({
      kind: 'star',
      id: 'star-primary',
      layer: 'physical',
    })
    expect(starRefs[0].displayName).toContain('G2V')
  })

  it('produces companion star entities with id and displayName fallbacks', () => {
    const input: EntityInventoryInput = {
      ...minimalInput(),
      companions: [
        { id: 'star-b', spectralType: { value: 'M3V' }, name: 'Companion B' },
        {},
      ],
    }
    const refs = buildEntityInventory(input)
    const stars = refs.filter(r => r.kind === 'star')
    expect(stars).toHaveLength(3)

    const primary = stars.find(s => s.id === 'star-primary')
    expect(primary?.displayName).toContain('G2V')

    const namedCompanion = stars.find(s => s.id === 'star-b')
    expect(namedCompanion).toBeDefined()
    expect(namedCompanion?.displayName).toBe('M3V')

    const fallbackCompanion = stars.find(s => s.id === 'star-companion-2')
    expect(fallbackCompanion).toBeDefined()
    expect(fallbackCompanion?.displayName).toBe('companion-2')
    expect(fallbackCompanion?.layer).toBe('physical')
  })

  it('produces one body entity per body', () => {
    const refs = buildEntityInventory(minimalInput())
    const bodyRefs = refs.filter(r => r.kind === 'body')
    expect(bodyRefs).toHaveLength(2)
    expect(bodyRefs.map(r => r.id)).toEqual(['body-1', 'body-2'])
    expect(bodyRefs.every(r => r.layer === 'physical')).toBe(true)
  })

  it('produces one settlement entity per settlement', () => {
    const refs = buildEntityInventory(minimalInput())
    const sRefs = refs.filter(r => r.kind === 'settlement')
    expect(sRefs).toHaveLength(1)
    expect(sRefs[0]).toMatchObject({
      kind: 'settlement',
      id: 'settlement-1',
      displayName: 'Orison Hold',
      layer: 'human',
    })
  })

  it('produces one guResource and one guHazard entity', () => {
    const refs = buildEntityInventory(minimalInput())
    const guRes = refs.filter(r => r.kind === 'guResource')
    const guHaz = refs.filter(r => r.kind === 'guHazard')
    expect(guRes).toHaveLength(1)
    expect(guHaz).toHaveLength(1)
    expect(guRes[0].displayName).toBe('chiral ice belt')
    expect(guHaz[0].displayName).toBe('flare-amplified bleed season')
    expect(guRes[0].layer).toBe('gu')
    expect(guHaz[0].layer).toBe('gu')
  })

  it('produces one phenomenon entity per phenomenon', () => {
    const refs = buildEntityInventory(minimalInput())
    const pRefs = refs.filter(r => r.kind === 'phenomenon')
    expect(pRefs).toHaveLength(2)
    expect(pRefs.map(r => r.displayName)).toEqual(['Dense debris disk', 'Resonant compact chain'])
  })

  it('produces one ruin entity per ruin', () => {
    const refs = buildEntityInventory(minimalInput())
    const rRefs = refs.filter(r => r.kind === 'ruin')
    expect(rRefs).toHaveLength(1)
    expect(rRefs[0].displayName).toBe('First-wave colony shell')
    expect(rRefs[0].layer).toBe('human')
  })

  it('produces one namedFaction entity per unique namedFaction fact', () => {
    const refs = buildEntityInventory(minimalInput())
    const fRefs = refs.filter(r => r.kind === 'namedFaction')
    expect(fRefs).toHaveLength(2)
    expect(fRefs.map(r => r.displayName).sort())
      .toEqual(['Kestrel Free Compact', 'Route Authority'])
    expect(fRefs.every(r => r.layer === 'human')).toBe(true)
  })

  it('returns no localInstitution / route / gate entities (deferred to Phase 2)', () => {
    const refs = buildEntityInventory(minimalInput())
    expect(refs.some(r => r.kind === 'localInstitution')).toBe(false)
    expect(refs.some(r => r.kind === 'route')).toBe(false)
    expect(refs.some(r => r.kind === 'gate')).toBe(false)
  })

  it('handles empty arrays gracefully', () => {
    const empty: EntityInventoryInput = {
      systemName: 'Empty',
      primary: { spectralType: { value: 'M5V' } },
      companions: [],
      bodies: [],
      settlements: [],
      guOverlay: { resource: { value: 'none' }, hazard: { value: 'none' } },
      phenomena: [],
      ruins: [],
      narrativeFacts: [],
    }
    const refs = buildEntityInventory(empty)
    expect(refs.length).toBeGreaterThanOrEqual(4)
    expect(refs.some(r => r.kind === 'system')).toBe(true)
    expect(refs.some(r => r.kind === 'star')).toBe(true)
    expect(refs.some(r => r.kind === 'guResource')).toBe(true)
    expect(refs.some(r => r.kind === 'guHazard')).toBe(true)
  })
})
