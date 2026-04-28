import { describe, expect, it } from 'vitest'
import { generateSystem } from '../lib/generator'
import { canonicalNameKey, NameRegistry } from '../lib/generator/nameRegistry'

const context = {
  bodyName: 'Nadir Shell 1',
  anchorName: 'Nadir Shell 1 moon',
  anchorKind: 'moon',
  location: 'Moon crater base',
  siteCategory: 'Moon base',
  authority: 'Corporate concession office',
  functionName: 'Dark-sector ore extraction',
  settlementId: 'settlement-2',
  ordinal: 2,
}

describe('settlement name registry', () => {
  it('canonicalizes punctuation, case, and spacing variants', () => {
    expect(canonicalNameKey(" Nadir's   Choir-Base ")).toBe('nadirs choir base')
    expect(canonicalNameKey('NADIRS CHOIR BASE')).toBe('nadirs choir base')
  })

  it('repairs generated duplicates with deterministic semantic qualifiers', () => {
    const registry = new NameRegistry()

    expect(registry.uniqueGeneratedName('Nadir Shell Base', { ...context, ordinal: 1, settlementId: 'settlement-1' })).toBe('Nadir Shell Base')
    expect(registry.uniqueGeneratedName('Nadir Shell Base', context)).toBe('Nadir Shell Base Claim')
    expect(registry.uniqueGeneratedName('Nadir Shell Base', { ...context, ordinal: 3, settlementId: 'settlement-3' })).toBe('Nadir Shell Base Concession')
  })

  it('preserves reserved names and repairs generated collisions around them', () => {
    const registry = new NameRegistry()
    registry.reserve('Cairn Node')

    const repaired = registry.uniqueGeneratedName('Cairn Node', {
      ...context,
      siteCategory: 'Gate or route node',
      functionName: 'Iggygate control station',
      location: 'Route customs throat',
      anchorKind: 'route geometry',
    })

    expect(repaired).toBe('Cairn Node Gate')
    expect(registry.has('Cairn Node')).toBe(true)
    expect(registry.has(repaired)).toBe(true)
  })

  it('keeps generated settlement names unique within each system', () => {
    for (let index = 0; index < 160; index++) {
      const system = generateSystem({
        seed: `name-registry-${index.toString(16).padStart(4, '0')}`,
        distribution: 'frontier',
        tone: 'balanced',
        gu: index % 2 === 0 ? 'fracture' : 'normal',
        settlements: 'hub',
      })
      const names = system.settlements.map((settlement) => settlement.name.value)

      expect(new Set(names).size).toBe(names.length)
      expect(generateSystem(system.options)).toEqual(system)
    }
  })
})
