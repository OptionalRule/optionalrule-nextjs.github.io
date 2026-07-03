import { describe, expect, it } from 'vitest'
import { renderConflictNarrative, BEAT_POOLS, GRAMMARS } from '../conflictNarrative'
import { createSeededRng } from '../../../rng'
import type { SeededRng } from '../../../rng'
import type { Conflict } from '../../../conflicts/types'
import type { EntityRef } from '../../types'
import type { GeneratorTone } from '../../../../../types'

const TONES: readonly GeneratorTone[] = ['balanced', 'cinematic', 'astronomy']
const ALLOWED_SLOTS = new Set([
  'aggressor', 'defender', 'bystander', 'stake', 'pressure', 'secret',
  'frozenReason', 'aggressorStake', 'defenderStake', 'bystanderStake',
])

const factionA: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const factionB: EntityRef = { kind: 'namedFaction', id: 'fac-b', displayName: 'Red Vane Labor Combine', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const resource: EntityRef = { kind: 'guResource', id: 'gu-1', displayName: 'Chiral ice belt', layer: 'gu' }

function makeConflict(overrides: Partial<Conflict> = {}): Conflict {
  return {
    id: 'conflict-e1',
    edgeId: 'e1',
    edgeType: 'CONTESTS',
    pressure: 'there is only one stable route chart, and two charters that each name it',
    parties: [
      { ref: factionA, role: 'aggressor', stake: 'first claim on the next harvest window' },
      { ref: factionB, role: 'defender', stake: 'the margin that keeps the lights on' },
      { ref: settlement, role: 'bystander', stake: 'rationed air while the principals negotiate' },
    ],
    stakeRef: resource,
    temperature: 'open',
    visibleSign: 'Every shift change, someone repaints the boundary line around {stake} a hand-width farther out.',
    ...overrides,
  }
}

function stubRng(values: readonly number[]): SeededRng {
  let i = 0
  const next = (): number => {
    const v = values[Math.min(i, values.length - 1)]
    i += 1
    return v
  }
  const rng: SeededRng = {
    seed: 'stub', next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: p => next() < p,
    fork: () => rng,
  }
  return rng
}

describe('beat pools', () => {
  it('has at least 4 templates per beat per tone', () => {
    for (const tone of TONES) {
      for (const beat of ['pressure', 'parties2', 'parties3', 'complication'] as const) {
        expect(BEAT_POOLS[tone][beat].length, `${tone}/${beat}`).toBeGreaterThanOrEqual(4)
      }
      expect(BEAT_POOLS[tone].temperature.open.length, `${tone}/temperature`).toBeGreaterThanOrEqual(2)
    }
  })

  it('uses only allowed slots', () => {
    for (const tone of TONES) {
      const flat = [
        ...BEAT_POOLS[tone].pressure,
        ...BEAT_POOLS[tone].parties2,
        ...BEAT_POOLS[tone].parties3,
        ...BEAT_POOLS[tone].complication,
        ...Object.values(BEAT_POOLS[tone].temperature).flat(),
      ]
      for (const template of flat) {
        for (const m of template.matchAll(/\{(\w+)\}/g)) {
          expect(ALLOWED_SLOTS.has(m[1]), `${m[1]} in "${template}"`).toBe(true)
        }
      }
    }
  })

  it('defines 3-4 beat grammars for every tone', () => {
    for (const tone of TONES) {
      expect(GRAMMARS[tone].length).toBeGreaterThanOrEqual(3)
      for (const grammar of GRAMMARS[tone]) {
        expect(grammar.length).toBeGreaterThanOrEqual(3)
        expect(grammar.length).toBeLessThanOrEqual(4)
      }
    }
  })
})

describe('renderConflictNarrative', () => {
  it('returns 2-4 complete sentences with no unresolved slots across tones and seeds', () => {
    for (const tone of TONES) {
      for (let s = 0; s < 20; s++) {
        const sentences = renderConflictNarrative(makeConflict(), tone, createSeededRng(`sweep-${s}`))
        expect(sentences.length).toBeGreaterThanOrEqual(2)
        expect(sentences.length).toBeLessThanOrEqual(4)
        for (const sentence of sentences) {
          expect(sentence).not.toContain('{')
          expect(sentence).toMatch(/[.!?]$/)
          expect(sentence[0]).toBe(sentence[0].toUpperCase())
        }
      }
    }
  })

  it('binds party display names verbatim somewhere in the output', () => {
    const sentences = renderConflictNarrative(makeConflict(), 'balanced', createSeededRng('bind'))
    const joined = sentences.join(' ')
    expect(joined).toContain('Kestrel Free Compact')
    expect(joined).toContain('Red Vane Labor Combine')
  })

  it('mentions the frozen reason when a frozen conflict renders its temperature beat', () => {
    const conflict = makeConflict({
      temperature: 'frozen',
      frozenReason: 'a suppressed record keeps both sides quiet',
    })
    const rng = stubRng([0.3, 0.1, 0.1, 0.1, 0.1, 0.1])
    const sentences = renderConflictNarrative(conflict, 'balanced', rng)
    expect(sentences.join(' ')).toContain('a suppressed record keeps both sides quiet')
  })

  it('skips the complication beat when there is no complication', () => {
    const conflict = makeConflict()
    const rng = stubRng([0.3, 0.1, 0.1, 0.1, 0.1, 0.1])
    const withoutComplication = renderConflictNarrative(conflict, 'balanced', rng)
    const withComplication = renderConflictNarrative(
      makeConflict({ complication: { kind: 'secret', text: 'the quarantine is political', sourceRef: settlement } }),
      'balanced',
      stubRng([0.3, 0.1, 0.1, 0.1, 0.1, 0.1]),
    )
    expect(withComplication.length).toBe(withoutComplication.length + 1)
    expect(withComplication.join(' ')).toContain('the quarantine is political')
  })

  it('is deterministic for the same seed', () => {
    const a = renderConflictNarrative(makeConflict(), 'cinematic', createSeededRng('det'))
    const b = renderConflictNarrative(makeConflict(), 'cinematic', createSeededRng('det'))
    expect(a).toEqual(b)
  })
})
