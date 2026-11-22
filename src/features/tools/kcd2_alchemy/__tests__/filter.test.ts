import { describe, it, expect } from 'vitest'
import { applyFilters, textMatch, ingredientMatch, addLiquidsToLiquidlessOnlyFilter } from '../lib/filter'
import type { NormalizedPotionRecipe } from '../types'

const sample: NormalizedPotionRecipe[] = [
  {
    id: 'p1',
    name: 'Aqua Vitalis',
    baseValue: 0,
    ingredients: {
      liquid: 'Water',
      liquidId: 'water',
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
    baseValue: 0,
    ingredients: {
      liquid: 'Spirits',
      liquidId: 'spirits',
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

  it('ingredientMatch matches any or only modes', () => {
    expect(ingredientMatch(sample[0], [], 'any')).toBe(true)
    expect(ingredientMatch(sample[0], ['marigold'], 'any')).toBe(true)
    expect(ingredientMatch(sample[0], ['wormwood'], 'any')).toBe(false)
    expect(ingredientMatch(sample[0], ['water'], 'any')).toBe(true)

    // only mode (potion ingredients, including its base liquid, must be subset of selected)
    expect(ingredientMatch(sample[0], ['marigold', 'dandelion', 'water'], 'only')).toBe(true)
    // Missing the base liquid -> not a subset
    expect(ingredientMatch(sample[0], ['marigold', 'dandelion'], 'only')).toBe(false)
    // Extra selected items are fine (still a superset of potion ingredients)
    expect(ingredientMatch(sample[0], ['marigold', 'dandelion', 'water', 'sage'], 'only')).toBe(true)
    // Missing one of potion's ingredients -> not a subset
    expect(ingredientMatch(sample[0], ['marigold'], 'only')).toBe(false)
    // Selecting unrelated ingredients only -> not a subset
    expect(ingredientMatch(sample[0], ['wormwood'], 'only')).toBe(false)
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

describe('addLiquidsToLiquidlessOnlyFilter', () => {
  const liquids = ['water', 'spirits', 'wine', 'oil']

  it('adds every liquid to an Only filter that selects none, preserving pre-liquid behaviour', () => {
    expect(addLiquidsToLiquidlessOnlyFilter(['sage'], 'only', liquids)).toEqual(['sage', ...liquids])
  })

  it('leaves an Only filter that already selects a liquid unchanged', () => {
    expect(addLiquidsToLiquidlessOnlyFilter(['sage', 'water'], 'only', liquids)).toBeNull()
  })

  it('leaves Any filters and empty selections unchanged', () => {
    expect(addLiquidsToLiquidlessOnlyFilter(['sage'], 'any', liquids)).toBeNull()
    expect(addLiquidsToLiquidlessOnlyFilter([], 'only', liquids)).toBeNull()
  })
})
