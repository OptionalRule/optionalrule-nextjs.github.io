import { describe, expect, it } from 'vitest'
import { pickHabitationGlyph } from '../pickHabitation'
import { GLYPH_COMPONENTS, GLYPH_META } from '../glyphRegistry'
import type { BodyPopulationBand, TerraformState } from '../../../../types'

function buildPop(band: BodyPopulationBand, terraformState: TerraformState = 'none') {
  return {
    band,
    surface: 'scattered' as const,
    underground: 'scattered' as const,
    orbital: 'minimal' as const,
    unnamedSiteCount: 'dozens' as const,
    prominentForm: null,
    terraformState,
    terraformNote: null,
  }
}

describe('pickHabitationGlyph', () => {
  it('returns null for empty/automated/transient bands', () => {
    expect(pickHabitationGlyph(buildPop('empty'))).toBeNull()
    expect(pickHabitationGlyph(buildPop('automated'))).toBeNull()
    expect(pickHabitationGlyph(buildPop('transient'))).toBeNull()
  })

  it('returns HB with "present" status for outpost / frontier / colony', () => {
    for (const band of ['outpost', 'frontier', 'colony'] as const) {
      const result = pickHabitationGlyph(buildPop(band))
      expect(result?.glyph).toBe('HB')
      expect(result?.status).toBe('active')
      expect(result?.dominant).toBe(false)
    }
  })

  it('returns HB with dominant=true for established / populous / dense-world', () => {
    for (const band of ['established', 'populous', 'dense-world'] as const) {
      const result = pickHabitationGlyph(buildPop(band))
      expect(result?.glyph).toBe('HB')
      expect(result?.dominant).toBe(true)
    }
  })

  it('flags in-progress terraform with a ring indicator', () => {
    const result = pickHabitationGlyph(buildPop('colony', 'in-progress'))
    expect(result?.terraformRing).toBe(true)
  })

  it('does not flag stabilized or candidate terraforms with a ring', () => {
    expect(pickHabitationGlyph(buildPop('colony', 'stabilized'))?.terraformRing).toBe(false)
    expect(pickHabitationGlyph(buildPop('colony', 'candidate'))?.terraformRing).toBe(false)
  })
})

describe('glyph registry', () => {
  it('registers HB glyph metadata', () => {
    expect(GLYPH_META.HB).toBeDefined()
    expect(GLYPH_META.HB.register).toBe('human')
    expect(GLYPH_META.HB.name.toLowerCase()).toContain('habitation')
  })

  it('registers HB glyph component', () => {
    expect(GLYPH_COMPONENTS.HB).toBeDefined()
  })
})
