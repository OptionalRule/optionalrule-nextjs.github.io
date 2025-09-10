import { describe, it, expect } from 'vitest';
import { buildIngredientIndex, resolvePotion, deriveIngredientOptions, deriveEffectQualities } from '../lib/normalize';
import type { Ingredient, PotionRecipe } from '../types';

describe('Normalization utilities', () => {
  const ingredients: Ingredient[] = [
    { id: 'mint', name: 'Mint' },
    { id: 'belladonna', name: 'Belladonna' },
  ];

  const potion: PotionRecipe = {
    id: '01',
    name: 'Test',
    ingredients: {
      liquid: 'Water',
      items: [
        { id: 'mint', quantity: 2 },
        { id: 'belladonna', quantity: 1 },
      ],
    },
    instructions: { default: ['Add', 'Boil'] },
    quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
    effects: [
      { quality: 'Weak', description: 'x' },
      { quality: 'Strong', description: 'y' },
    ],
  };

  it('builds ingredient index by id', () => {
    const index = buildIngredientIndex(ingredients);
    expect(index.get('mint')?.name).toBe('Mint');
  });

  it('resolves potion items to names using index', () => {
    const index = buildIngredientIndex(ingredients);
    const resolved = resolvePotion(potion, index);
    expect(resolved.ingredients.items[0].name).toBe('Mint');
    expect(resolved.ingredients.items[1].name).toBe('Belladonna');
  });

  it('derives sorted ingredient options', () => {
    const opts = deriveIngredientOptions(ingredients);
    expect(opts.map((o) => o.name)).toEqual(['Belladonna', 'Mint']);
  });

  it('derives effect quality list', () => {
    const qualities = deriveEffectQualities([potion]);
    expect(qualities).toEqual(['Strong', 'Weak']);
  });
});

