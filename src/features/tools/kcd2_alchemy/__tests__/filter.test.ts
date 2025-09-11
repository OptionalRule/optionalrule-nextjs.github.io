import { describe, it, expect } from 'vitest'
import { applyFilters, textMatch, ingredientMatch, effectQualityMatch } from '../lib/filter'
import type { NormalizedPotionRecipe } from '../types'

const sample: NormalizedPotionRecipe[] = [
  {
    id: 'p1',
    name: 'Aqua Vitalis',
    ingredients: {
      liquid: 'Water',
      items: [
        { id: 'dandelion', name: 'Dandelion', quantity: 2 },
        { id: 'marigold', name: 'Marigold', quantity: 1 },
      ],
    },
    instructions: { default: ['Add water'] },
    quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
    effects: [
      { quality: 'Weak', description: 'You lose 15% less Health when struck.' },
      { quality: 'Strong', description: 'You lose 50% less Health.' },
    ],
  },
  {
    id: 'p2',
    name: 'Artemisia',
    ingredients: {
      liquid: 'Spirits',
      items: [
        { id: 'sage', name: 'Sage', quantity: 1 },
        { id: 'wormwood', name: 'Wormwood', quantity: 2 },
      ],
    },
    instructions: { default: ['Add spirits'], optimized: { minLevel: 12, steps: ['Add spirits', 'Distil'] } },
    quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
    effects: [
      { quality: 'Standard', description: 'Increases Strength by 4.' },
    ],
  },
]

describe('filter predicates', () => {
  it('textMatch looks into name and effect descriptions', () => {
    expect(textMatch(sample[0], 'vitalis')).toBe(true)
    expect(textMatch(sample[0], 'Health')).toBe(true)
    expect(textMatch(sample[0], 'xyz')).toBe(false)
  })

  it('ingredientMatch matches any selected ingredient id', () => {
    expect(ingredientMatch(sample[0], [])).toBe(true)
    expect(ingredientMatch(sample[0], ['marigold'])).toBe(true)
    expect(ingredientMatch(sample[0], ['wormwood'])).toBe(false)
  })

  it('effectQualityMatch matches any selected quality', () => {
    expect(effectQualityMatch(sample[0], [])).toBe(true)
    expect(effectQualityMatch(sample[0], ['weak'])).toBe(true)
    expect(effectQualityMatch(sample[0], ['strong'])).toBe(true)
    expect(effectQualityMatch(sample[0], ['standard'])).toBe(false)
  })
})

describe('applyFilters', () => {
  it('applies text + ingredient + effect filters and sorts by name', () => {
    const results = applyFilters(sample, {
      query: 'increases',
      ingredientIds: ['wormwood'],
      effectQualities: ['standard'],
    })
    expect(results.map((r) => r.id)).toEqual(['p2'])
  })

  it('returns all when filters are empty', () => {
    const results = applyFilters(sample, { query: '', ingredientIds: [], effectQualities: [] })
    expect(results.length).toBe(2)
  })
})

