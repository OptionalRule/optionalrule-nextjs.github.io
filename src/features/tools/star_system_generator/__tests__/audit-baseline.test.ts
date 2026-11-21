import { describe, expect, it } from 'vitest'
import {
  baselineKeyForFinding,
  compareToBaseline,
  countErrorsByCode,
  parseAuditBaseline,
  withProfileBaseline,
} from '../../../../../scripts/star-system-audit-baseline'

describe('star system audit error baseline', () => {
  it('keys coded findings by code and uncoded findings by source and index-free path', () => {
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[2].x', code: 'ENV_COLD_CLIMATE' })).toBe('ENV_COLD_CLIMATE')
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[2].moons[10].name' })).toBe('audit:bodies[].moons[].name')
  })

  it('counts only errors', () => {
    expect(countErrorsByCode([
      { severity: 'error', path: 'a', code: 'B' },
      { severity: 'error', path: 'a', code: 'B' },
      { severity: 'warning', path: 'a', code: 'B' },
      { severity: 'error', path: 'settlements[0].bodyId' },
    ])).toEqual({ 'audit:settlements[].bodyId': 1, B: 2 })
  })

  it('passes when counts hold or drop and reports improvements', () => {
    const result = compareToBaseline({ A: 3, B: 2 }, { A: 3, B: 1 })
    expect(result.passed).toBe(true)
    expect(result.regressions).toEqual([])
    expect(result.improvements).toEqual([{ code: 'B', baseline: 2, current: 1 }])
  })

  it('reports a code that disappears entirely as an improvement', () => {
    expect(compareToBaseline({ A: 3 }, {}).improvements).toEqual([{ code: 'A', baseline: 3, current: 0 }])
  })

  it('fails when a count rises or a new code appears', () => {
    expect(compareToBaseline({ A: 3 }, { A: 4 })).toMatchObject({ passed: false, regressions: [{ code: 'A', baseline: 3, current: 4 }] })
    expect(compareToBaseline({ A: 3 }, { A: 3, NEW: 1 })).toMatchObject({ passed: false, regressions: [{ code: 'NEW', baseline: 0, current: 1 }] })
  })

  it('replaces only the named profile when rewriting', () => {
    expect(withProfileBaseline({ quick: { A: 1 }, default: { A: 5 } }, 'quick', { B: 2 })).toEqual({ default: { A: 5 }, quick: { B: 2 } })
  })

  it('rejects malformed baseline files', () => {
    expect(() => parseAuditBaseline([])).toThrow()
    expect(() => parseAuditBaseline({ quick: { A: -1 } })).toThrow()
    expect(() => parseAuditBaseline({ quick: { A: 1.5 } })).toThrow()
    expect(parseAuditBaseline({ quick: { A: 2 } })).toEqual({ quick: { A: 2 } })
  })
})
