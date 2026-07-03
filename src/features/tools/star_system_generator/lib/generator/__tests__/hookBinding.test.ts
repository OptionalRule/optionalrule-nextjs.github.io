import { describe, expect, it } from 'vitest'
import {
  selectSystemHooks,
  canBindEntry,
  bindEntryText,
  type HookBindContext,
  type HookContext,
} from '../hooks'
import type { HookEntry } from '../data/hooks'
import { createSeededRng } from '../rng'
import type { SeededRng } from '../rng'
import type { EntityRef } from '../graph/types'
import type { Conflict } from '../conflicts/types'
import type { Fact, GuOverlay, SystemArchitecture, Reachability } from '../../../types'

function fact<T>(value: T): Fact<T> {
  return { value, confidence: 'human-layer' }
}

const faction: EntityRef = { kind: 'namedFaction', id: 'fac-a', displayName: 'Kestrel Free Compact', layer: 'human' }
const settlement: EntityRef = { kind: 'settlement', id: 'set-1', displayName: 'Orison Hold', layer: 'human' }
const body: EntityRef = { kind: 'body', id: 'body-1', displayName: 'Verrin IV', layer: 'physical' }
const phenomenon: EntityRef = { kind: 'phenomenon', id: 'phen-1', displayName: 'the Kestrel Bloom', layer: 'gu' }
const stakeRef: EntityRef = { kind: 'guResource', id: 'gu-res', displayName: 'the chiral ice concession', layer: 'gu' }

function makeConflict(overrides: Partial<Conflict> = {}): Conflict {
  return {
    id: 'conflict-1',
    edgeId: 'edge-1',
    edgeType: 'CONTESTS',
    pressure: 'test pressure',
    parties: [
      { ref: faction, role: 'aggressor', stake: 'stake text' },
      { ref: settlement, role: 'defender', stake: 'stake text' },
    ],
    stakeRef,
    temperature: 'open',
    visibleSign: 'test sign',
    ...overrides,
  }
}

function stubRng(values: readonly number[]): { rng: SeededRng; calls: () => number } {
  let i = 0
  const next = (): number => {
    const v = values[Math.min(i, values.length - 1)]
    i += 1
    return v
  }
  const rng: SeededRng = {
    seed: 'stub',
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: p => next() < p,
    fork: () => rng,
  }
  return { rng, calls: () => i }
}

const guOverlay: GuOverlay = {
  intensity: fact('moderate'),
  bleedLocation: fact('the outer belt'),
  bleedBehavior: fact('steady seep'),
  resource: fact('chiral ice'),
  hazard: fact('metric shear'),
  intensityRoll: fact(10),
  intensityModifiers: [],
}

const architecture: SystemArchitecture = {
  name: fact('Standard architecture'),
  description: fact('A workaday frontier system.'),
}

const reachability: Reachability = {
  className: fact('B-class'),
  routeNote: fact('a stable lane'),
  pinchDifficulty: fact('moderate'),
  roll: fact(5),
  modifiers: [],
}

function baseContext(overrides: Partial<HookContext> = {}): HookContext {
  return {
    guOverlay,
    settlements: [],
    ruins: [],
    phenomena: [],
    architecture,
    reachability,
    conflicts: [],
    entities: [],
    ...overrides,
  }
}

describe('hook slot binder (pure functions)', () => {
  it('binds {party}, {place}, {stake}, {phenomenon} to real displayNames', () => {
    const entry: HookEntry = {
      text: '{party} moves against {place} over {stake} while {phenomenon} keeps everyone guessing.',
      tags: ['GU'],
      binds: ['party', 'place', 'stake', 'phenomenon'],
    }
    const ctx: HookBindContext = {
      conflicts: [makeConflict()],
      entities: [faction, settlement, body, phenomenon],
    }
    const rng = createSeededRng('bind-test')
    const bound = bindEntryText(entry, ctx, rng)
    expect(bound).not.toContain('{')
    expect(bound).toContain(stakeRef.displayName)
    expect([faction.displayName, settlement.displayName].some(n => bound.includes(n))).toBe(true)
    expect([settlement.displayName, body.displayName].some(n => bound.includes(n))).toBe(true)
    expect(bound).toContain(phenomenon.displayName)
  })

  it('draws exactly one rng.int per distinct slot, even when it appears twice in the text', () => {
    const entry: HookEntry = {
      text: '{party} argues with {party} about the same thing.',
      tags: ['GU'],
      binds: ['party'],
    }
    const ctx: HookBindContext = { conflicts: [makeConflict()], entities: [faction, settlement] }
    const { rng, calls } = stubRng([0])
    const bound = bindEntryText(entry, ctx, rng)
    expect(calls()).toBe(1)
    expect(bound).not.toContain('{party}')
  })

  it('leaves unslotted entries untouched and consumes no rng draws', () => {
    const entry: HookEntry = { text: 'A plain hook with no slots.', tags: ['GU'] }
    const ctx: HookBindContext = { conflicts: [], entities: [] }
    const { rng, calls } = stubRng([0.5])
    const bound = bindEntryText(entry, ctx, rng)
    expect(bound).toBe(entry.text)
    expect(calls()).toBe(0)
  })

  it('canBindEntry is true for entries without binds regardless of context', () => {
    const entry: HookEntry = { text: 'A plain hook.', tags: ['GU'] }
    expect(canBindEntry(entry, { conflicts: [], entities: [] })).toBe(true)
  })

  it('canBindEntry is false when a required slot has no candidates, true once satisfied', () => {
    const entry: HookEntry = { text: 'Something about {phenomenon}.', tags: ['GU'], binds: ['phenomenon'] }
    const ctxWithout: HookBindContext = { conflicts: [makeConflict()], entities: [faction, settlement, body] }
    expect(canBindEntry(entry, ctxWithout)).toBe(false)
    const ctxWith: HookBindContext = { conflicts: [makeConflict()], entities: [faction, settlement, body, phenomenon] }
    expect(canBindEntry(entry, ctxWith)).toBe(true)
  })

  it('party binding prefers faction/settlement party kinds over other party kinds', () => {
    const bystanderBody: EntityRef = { kind: 'body', id: 'body-2', displayName: 'Onlooker Moon', layer: 'physical' }
    const conflictWithBystander = makeConflict({
      parties: [
        { ref: faction, role: 'aggressor', stake: 's' },
        { ref: settlement, role: 'defender', stake: 's' },
        { ref: bystanderBody, role: 'bystander', stake: 's' },
      ],
    })
    const entry: HookEntry = { text: '{party} is involved.', tags: ['GU'], binds: ['party'] }
    const ctx: HookBindContext = { conflicts: [conflictWithBystander], entities: [] }
    for (let i = 0; i < 20; i += 1) {
      const rng = createSeededRng(`party-pref-${i}`)
      const bound = bindEntryText(entry, ctx, rng)
      expect(bound).not.toContain(bystanderBody.displayName)
    }
  })
})

describe('selectSystemHooks with binding context', () => {
  it('never selects a slotted entry whose binds cannot be satisfied (no unresolved braces)', () => {
    for (let i = 0; i < 40; i += 1) {
      const rng = createSeededRng(`no-binds-${i}`)
      const result = selectSystemHooks({ rng, context: baseContext() })
      const allTexts = [
        ...result.rumors, ...result.contracts, ...result.encounters, ...result.npcs, ...result.twists,
      ].map(h => h.text.value)
      for (const text of allTexts) {
        expect(text).not.toContain('{')
      }
    }
  })

  it('binds real system names into slotted pool entries when a rich context is provided', () => {
    const richConflicts = [makeConflict()]
    const richEntities = [faction, settlement, body, phenomenon]
    const knownNames = [faction.displayName, settlement.displayName, body.displayName, phenomenon.displayName, stakeRef.displayName]
    let sawBoundName = false
    for (let i = 0; i < 80; i += 1) {
      const rng = createSeededRng(`rich-${i}`)
      const result = selectSystemHooks({
        rng,
        context: baseContext({ conflicts: richConflicts, entities: richEntities }),
      })
      const allTexts = [
        ...result.rumors, ...result.contracts, ...result.encounters, ...result.npcs, ...result.twists,
      ].map(h => h.text.value)
      for (const text of allTexts) {
        expect(text).not.toContain('{')
      }
      if (allTexts.some(text => knownNames.some(name => text.includes(name)))) {
        sawBoundName = true
      }
    }
    expect(sawBoundName).toBe(true)
  })

  it('is deterministic for a given seed and context', () => {
    const ctx = baseContext({ conflicts: [makeConflict()], entities: [faction, settlement, body, phenomenon] })
    const a = selectSystemHooks({ rng: createSeededRng('det-hooks'), context: ctx })
    const b = selectSystemHooks({ rng: createSeededRng('det-hooks'), context: ctx })
    expect(a).toEqual(b)
  })
})
