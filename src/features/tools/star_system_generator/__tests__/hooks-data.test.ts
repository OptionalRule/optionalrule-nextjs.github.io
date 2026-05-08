import { describe, expect, it } from 'vitest'
import {
  contractPool,
  encounterPool,
  HOOK_TERMS,
  npcPool,
  rumorPool,
  twistPool,
} from '../lib/generator/data/hooks'

const POOLS = {
  rumors: rumorPool,
  contracts: contractPool,
  encounters: encounterPool,
  npcs: npcPool,
  twists: twistPool,
} as const

const KNOWN_TAGS = new Set<string>(HOOK_TERMS)

describe('hook data integrity', () => {
  it('has non-empty pools for every category', () => {
    for (const [name, pool] of Object.entries(POOLS)) {
      expect(pool.length, `${name} pool`).toBeGreaterThanOrEqual(15)
    }
  })

  it('every entry has non-empty text', () => {
    for (const [name, pool] of Object.entries(POOLS)) {
      for (const entry of pool) {
        expect(entry.text.length, `${name} entry text`).toBeGreaterThan(0)
      }
    }
  })

  it('every entry has at least one canonical tag', () => {
    for (const [name, pool] of Object.entries(POOLS)) {
      for (const entry of pool) {
        expect(entry.tags.length, `${name} entry tags`).toBeGreaterThan(0)
        for (const tag of entry.tags) {
          expect(KNOWN_TAGS.has(tag), `${name} tag "${tag}" must be in HOOK_TERMS`).toBe(true)
        }
      }
    }
  })

  it('has no duplicate texts within a pool', () => {
    for (const [name, pool] of Object.entries(POOLS)) {
      const texts = new Set<string>()
      for (const entry of pool) {
        expect(texts.has(entry.text), `${name} duplicate: ${entry.text}`).toBe(false)
        texts.add(entry.text)
      }
    }
  })

  it('covers every canonical term across all pools', () => {
    const seen = new Set<string>()
    for (const pool of Object.values(POOLS)) {
      for (const entry of pool) {
        for (const tag of entry.tags) seen.add(tag)
      }
    }
    for (const term of HOOK_TERMS) {
      expect(seen.has(term), `term "${term}" must appear in at least one pool`).toBe(true)
    }
  })
})
