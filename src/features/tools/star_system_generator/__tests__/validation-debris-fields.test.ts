import { describe, it, expect } from 'vitest'
import { generateSystem } from '../lib/generator'
import { validateSystem } from '../lib/generator/validation'

describe('debris-field audit rules', () => {
  it('DEBRIS_FIELD_MISSING fires when an expected field is absent', () => {
    let found = false
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ seed: `audit-debris-missing-${i}`, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
      if (sys.debrisFields.length === 0) continue
      found = true
      const mutated = { ...sys, debrisFields: [] }
      const findings = validateSystem(mutated)
      expect(findings.some(f => f.code === 'DEBRIS_FIELD_MISSING'), 'expected DEBRIS_FIELD_MISSING for stripped debrisFields').toBe(true)
      break
    }
    expect(found, 'no debris-field seed in sweep').toBe(true)
  })

  it('DEBRIS_FIELD_ANCHOR_VIOLATION fires when an unanchorable field has a settlement', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ seed: `audit-anchor-${i}`, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'crowded' })
      const unanchorable = sys.debrisFields.find(d => d.anchorMode.value === 'unanchorable')
      if (!unanchorable) continue
      const fakeSettlement = sys.settlements[0]
      if (!fakeSettlement) continue
      const mutated = { ...sys, settlements: [{ ...fakeSettlement, debrisFieldId: unanchorable.id, bodyId: undefined }] }
      const findings = validateSystem(mutated)
      expect(findings.some(f => f.code === 'DEBRIS_FIELD_ANCHOR_VIOLATION')).toBe(true)
      return
    }
  })

  it('DEBRIS_FIELD_ANCHOR_VIOLATION fires when a transient-only field has a non-mobile settlement', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ seed: `audit-anchor-transient-${i}`, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'crowded' })
      const transientField = sys.debrisFields.find(d => d.anchorMode.value === 'transient-only')
      if (!transientField) continue
      const fakeSettlement = sys.settlements[0]
      if (!fakeSettlement) continue
      const mutated = {
        ...sys,
        settlements: [{
          ...fakeSettlement,
          debrisFieldId: transientField.id,
          bodyId: undefined,
          habitationPattern: { ...fakeSettlement.habitationPattern, value: 'Permanent station' },
        }],
      }
      const findings = validateSystem(mutated)
      expect(findings.some(f => f.code === 'DEBRIS_FIELD_ANCHOR_VIOLATION')).toBe(true)
      return
    }
  })

  it('DEBRIS_FIELD_PHENOMENON_ORPHAN fires on broken link', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ seed: `audit-orphan-${i}`, distribution: 'frontier', tone: 'cinematic', gu: 'normal', settlements: 'normal' })
      const field = sys.debrisFields[0]
      if (!field) continue
      if (!field.spawnedPhenomenonId) continue
      const mutated = { ...sys, phenomena: sys.phenomena.filter(p => p.id !== field.spawnedPhenomenonId) }
      const findings = validateSystem(mutated)
      expect(findings.some(f => f.code === 'DEBRIS_FIELD_PHENOMENON_ORPHAN')).toBe(true)
      return
    }
  })

  it('DEBRIS_FIELD_PHENOMENON_ORPHAN fires when phenomenon claims debris origin but field does not exist', () => {
    for (let i = 0; i < 50; i++) {
      const sys = generateSystem({ seed: `audit-orphan-reverse-${i}`, distribution: 'frontier', tone: 'cinematic', gu: 'normal', settlements: 'normal' })
      const field = sys.debrisFields[0]
      if (!field) continue
      const mutated = { ...sys, debrisFields: sys.debrisFields.filter(d => d.id !== field.id) }
      if (!field.spawnedPhenomenonId) continue
      const findings = validateSystem(mutated)
      expect(findings.some(f => f.code === 'DEBRIS_FIELD_PHENOMENON_ORPHAN')).toBe(true)
      return
    }
  })

  it('clean systems produce zero DEBRIS_FIELD_* findings', () => {
    for (let i = 0; i < 30; i++) {
      const sys = generateSystem({ seed: `audit-clean-${i}`, distribution: 'frontier', tone: 'balanced', gu: 'normal', settlements: 'normal' })
      const findings = validateSystem(sys)
      const debrisFindings = findings.filter(f => f.code.startsWith('DEBRIS_FIELD_'))
      expect(debrisFindings, `seed ${i} unexpected: ${JSON.stringify(debrisFindings)}`).toEqual([])
    }
  })
})
