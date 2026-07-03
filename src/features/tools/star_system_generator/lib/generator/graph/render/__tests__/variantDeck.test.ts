import { describe, expect, it } from 'vitest'
import { VariantDeck } from '../variantDeck'
import { pronominalizeSecondMention } from '../renderSystemStory'
import { createSeededRng } from '../../../rng'
import type { EntityRef } from '../../types'

describe('VariantDeck', () => {
  it('draws every item exactly once before any repeat', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const deck = new VariantDeck(items, createSeededRng('deck'))
    const firstCycle = Array.from({ length: items.length }, () => deck.draw())
    expect(new Set(firstCycle).size).toBe(items.length)
  })

  it('reshuffles and keeps drawing after exhaustion', () => {
    const items = ['a', 'b', 'c']
    const deck = new VariantDeck(items, createSeededRng('deck2'))
    const draws = Array.from({ length: 9 }, () => deck.draw())
    expect(new Set(draws).size).toBe(3)
    expect(draws).toHaveLength(9)
  })

  it('is deterministic for the same seed', () => {
    const items = ['a', 'b', 'c', 'd']
    const a = new VariantDeck(items, createSeededRng('same'))
    const b = new VariantDeck(items, createSeededRng('same'))
    expect(Array.from({ length: 8 }, () => a.draw())).toEqual(Array.from({ length: 8 }, () => b.draw()))
  })

  it('handles single-item pools', () => {
    const deck = new VariantDeck(['only'], createSeededRng('one'))
    expect(deck.draw()).toBe('only')
    expect(deck.draw()).toBe('only')
  })
})

describe('pronominalizeSecondMention', () => {
  const phenomenon: EntityRef = { kind: 'phenomenon', id: 'p1', displayName: 'Trojan megaswarm', layer: 'gu' }
  const faction: EntityRef = { kind: 'namedFaction', id: 'f1', displayName: 'Kestrel Free Compact', layer: 'human' }

  it('replaces the second mention of a phenomenon with "it"', () => {
    const text = 'Trojan megaswarm took shape in the long quiet, Trojan megaswarm is rewriting the constants.'
    expect(pronominalizeSecondMention(text, phenomenon)).toBe(
      'Trojan megaswarm took shape in the long quiet, it is rewriting the constants.',
    )
  })

  it('replaces the second mention of a faction with "it"', () => {
    const text = 'Kestrel Free Compact took control early, and Kestrel Free Compact has never let go.'
    expect(pronominalizeSecondMention(text, faction)).toBe(
      'Kestrel Free Compact took control early, and it has never let go.',
    )
  })

  it('leaves single mentions untouched', () => {
    const text = 'Trojan megaswarm is rewriting the constants.'
    expect(pronominalizeSecondMention(text, phenomenon)).toBe(text)
  })

  it('only matches the exact display name', () => {
    const text = 'Trojan megaswarm grew while the lesser trojan megaswarm cluster watched.'
    expect(pronominalizeSecondMention(text, phenomenon)).toBe(text)
  })
})
