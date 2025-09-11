import { describe, it, expect } from 'vitest'
import { applyFilters, textMatch, ingredientMatch } from '../lib/filter'
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

  it('ingredientMatch matches any or all selected ids', () => {
    expect(ingredientMatch(sample[0], [], 'any')).toBe(true)
    expect(ingredientMatch(sample[0], ['marigold'], 'any')).toBe(true)
    expect(ingredientMatch(sample[0], ['wormwood'], 'any')).toBe(false)

    // all mode
    expect(ingredientMatch(sample[0], ['marigold', 'dandelion'], 'all')).toBe(true)
    expect(ingredientMatch(sample[0], ['marigold', 'wormwood'], 'all')).toBe(false)
  })
})

describe('applyFilters', () => {
  it('applies text + ingredient filters and sorts by name', () => {
    const results = applyFilters(sample, {
      query: 'increases',
      ingredientIds: ['wormwood'],
      ingredientMode: 'any',
    })
    expect(results.map((r) => r.id)).toEqual(['p2'])
  })

  it('returns all when filters are empty', () => {
    const results = applyFilters(sample, { query: '', ingredientIds: [], ingredientMode: 'any' })
    expect(results.length).toBe(2)
  })
})
