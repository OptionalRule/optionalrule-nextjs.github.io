import { describe, expect, it } from 'vitest'
import {
  baselineKeyForFinding,
  compareToBaseline,
  countErrorsByCode,
  parseAuditBaseline,
  withProfileBaseline,
} from '../../../../../scripts/star-system-audit-baseline'

describe('star system audit error baseline', () => {
  it('keys coded findings by code and uncoded findings by source, index-free path and message template', () => {
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[2].x', code: 'ENV_COLD_CLIMATE' })).toBe('ENV_COLD_CLIMATE')
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[2].moons[10].name', message: 'Moon name is missing or blank.' }))
      .toBe('audit:bodies[].moons[].name :: Moon name is missing or blank.')
  })

  it('strips quoted values, numbers and ids from uncoded message templates', () => {
    expect(baselineKeyForFinding({ severity: 'error', path: 'settlements[3].bodyId', message: 'Settlement references missing body "body-7".' }))
      .toBe('audit:settlements[].bodyId :: Settlement references missing body "*".')
    expect(baselineKeyForFinding({ severity: 'error', path: 'story.hiddenLeak', message: 'Hidden edge SUPPRESSES:a--b--settlement3 appears to leak into body paragraph: "x y"' }))
      .toBe('audit:story.hiddenLeak :: Hidden edge # appears to leak into body paragraph: "*"')
    expect(baselineKeyForFinding({ severity: 'error', path: 'reachability.roll', message: 'Reachability roll must be clamped to 1-12; got 14.' }))
      .toBe('audit:reachability.roll :: Reachability roll must be clamped to # got #')
  })

  it('keeps ordinary hyphenated words in uncoded message templates', () => {
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[1].detail.geology', message: 'sub-neptune has surface geology "rock".' }))
      .toBe('audit:bodies[].detail.geology :: sub-neptune has surface geology "*".')
    expect(baselineKeyForFinding({ severity: 'error', path: 'bodies[1].detail.geology', message: 'super-Earth has surface geology "rock".' }))
      .toBe('audit:bodies[].detail.geology :: super-Earth has surface geology "*".')
    expect(baselineKeyForFinding({ severity: 'error', path: 'prose.unresolvedSlot', message: 'Settlement faction-watch-order-trust whyHere contains unresolved slot.' }))
      .toBe('audit:prose.unresolvedSlot :: Settlement # whyHere contains unresolved slot.')
  })

  it('catches a rise in one uncoded finding hidden by a drop in another on the same path', () => {
    const furnace = { severity: 'error', path: 'bodies[0].detail.hydrosphere', message: 'Furnace world has implausible hydrosphere "ice".' }
    const inferno = { severity: 'error', path: 'bodies[1].detail.hydrosphere', message: 'Inferno world has implausible hydrosphere "ice".' }
    const baseline = countErrorsByCode([furnace, inferno, inferno])
    const current = countErrorsByCode([furnace, furnace, inferno])
    expect(compareToBaseline(baseline, current)).toMatchObject({
      passed: false,
      regressions: [{ code: 'audit:bodies[].detail.hydrosphere :: Furnace world has implausible hydrosphere "*".', baseline: 1, current: 2 }],
    })
  })

  it('counts only errors', () => {
    expect(countErrorsByCode([
      { severity: 'error', path: 'a', code: 'B' },
      { severity: 'error', path: 'a', code: 'B' },
      { severity: 'warning', path: 'a', code: 'B' },
      { severity: 'error', path: 'settlements[0].bodyId', message: 'Settlement references missing body "x".' },
    ])).toEqual({ 'audit:settlements[].bodyId :: Settlement references missing body "*".': 1, B: 2 })
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
