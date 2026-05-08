import { describe, it, expect } from 'vitest'
import { spectralVisuals } from '../stellarColor'

describe('spectralVisuals', () => {
  it('returns warm yellow for G-type', () => {
    const v = spectralVisuals('G2V', 50)
    expect(v.coreColor).toMatch(/^#fff/i)
    expect(v.coronaColor).toMatch(/^#ff[cd]/i)
  })

  it('returns deep red for M-type', () => {
    const v = spectralVisuals('M5V', 50)
    expect(v.coreColor.toLowerCase()).not.toBe('#ffffff')
    expect(v.coronaColor.toLowerCase()).toMatch(/^#(ff|f[0-9a-f]){1}/i)
  })

  it('returns blue-white for O/B-type', () => {
    const v = spectralVisuals('O5V', 50)
    expect(v.coreColor.toLowerCase()).not.toEqual(spectralVisuals('M5V', 50).coreColor.toLowerCase())
  })

  it('falls back to G-type defaults for unknown spectral strings', () => {
    const fallback = spectralVisuals('???', 50)
    const g = spectralVisuals('G2V', 50)
    expect(fallback.coreColor).toBe(g.coreColor)
  })

  it('scales corona radius with luminosity class (giants > dwarfs)', () => {
    const dwarf = spectralVisuals('G2V', 50)
    const giant = spectralVisuals('G2III', 50)
    expect(giant.coronaRadius).toBeGreaterThan(dwarf.coronaRadius)
  })

  it('scales rayCount and bloom with activityRoll', () => {
    const calm = spectralVisuals('G2V', 10)
    const active = spectralVisuals('G2V', 95)
    expect(active.rayCount).toBeGreaterThan(calm.rayCount)
    expect(active.bloomStrength).toBeGreaterThan(calm.bloomStrength)
  })
})
