import { describe, expect, it } from 'vitest'
import { calculateHabitableZone, calculateInsolation, calculateSnowLine, classifyThermalZone } from '../lib/generator/calculations'

describe('astronomy calculations', () => {
  it('calculates insolation with inverse square luminosity scaling', () => {
    expect(calculateInsolation(1, 1)).toBe(1)
    expect(calculateInsolation(1, 2)).toBe(0.25)
    expect(calculateInsolation(4, 2)).toBe(1)
  })

  it('calculates simplified habitable zone and snow line', () => {
    expect(calculateHabitableZone(1)).toEqual({ inner: 0.75, center: 1, outer: 1.77 })
    expect(calculateSnowLine(1)).toBe(2.7)
  })

  it('classifies thermal zones from insolation', () => {
    expect(classifyThermalZone(30)).toBe('Furnace')
    expect(classifyThermalZone(12)).toBe('Inferno')
    expect(classifyThermalZone(3)).toBe('Hot')
    expect(classifyThermalZone(1)).toBe('Temperate band')
    expect(classifyThermalZone(0.1)).toBe('Cold')
    expect(classifyThermalZone(0.01)).toBe('Cryogenic')
    expect(classifyThermalZone(0.001)).toBe('Dark')
  })
})
