import { describe, expect, it } from 'vitest'
import { bodyDesignation, moonDesignation, toRomanNumeral } from '../lib/generator/designations'

describe('celestial designations', () => {
  it('formats positive integers as standard Roman numerals', () => {
    expect(toRomanNumeral(1)).toBe('I')
    expect(toRomanNumeral(4)).toBe('IV')
    expect(toRomanNumeral(9)).toBe('IX')
    expect(toRomanNumeral(14)).toBe('XIV')
    expect(toRomanNumeral(44)).toBe('XLIV')
  })

  it('rejects values that cannot be Roman numerals', () => {
    expect(() => toRomanNumeral(0)).toThrow(/positive integer/)
    expect(() => toRomanNumeral(1.5)).toThrow(/positive integer/)
  })

  it('uses bare system numerals for planet-like bodies', () => {
    expect(bodyDesignation('Nosaxa', 0, 'rocky-planet')).toBe('Nosaxa I')
    expect(bodyDesignation('Nosaxa', 1, 'super-earth')).toBe('Nosaxa II')
    expect(bodyDesignation('Nosaxa', 2, 'sub-neptune')).toBe('Nosaxa III')
    expect(bodyDesignation('Nosaxa', 3, 'gas-giant')).toBe('Nosaxa IV')
    expect(bodyDesignation('Nosaxa', 4, 'ice-giant')).toBe('Nosaxa V')
  })

  it('adds type words for nonplanet bodies while preserving orbital order', () => {
    expect(bodyDesignation('Nosaxa', 2, 'belt')).toBe('Nosaxa Belt III')
    expect(bodyDesignation('Nosaxa', 5, 'dwarf-body')).toBe('Nosaxa Dwarf VI')
    expect(bodyDesignation('Nosaxa', 6, 'rogue-captured')).toBe('Nosaxa Captive VII')
    expect(bodyDesignation('Nosaxa', 7, 'anomaly')).toBe('Nosaxa Anomaly VIII')
  })

  it('designates moons from their parent body designation', () => {
    expect(moonDesignation('Nosaxa IV', 0)).toBe('Nosaxa IV - Moon I')
    expect(moonDesignation('Nosaxa IV', 1)).toBe('Nosaxa IV - Moon II')
    expect(moonDesignation('Nosaxa Dwarf VI', 0)).toBe('Nosaxa Dwarf VI - Moon I')
  })
})
