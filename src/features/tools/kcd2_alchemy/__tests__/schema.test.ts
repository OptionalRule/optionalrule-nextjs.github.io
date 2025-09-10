import { describe, it, expect } from 'vitest';
import { parseIngredients, parsePotions, validateReferentialIntegrity } from '../lib/schema';

describe('Schema validators', () => {
  it('parses valid ingredient list', () => {
    const data = [
      { id: 'mint', name: 'Mint' },
      { id: 101, name: 'Belladonna' },
    ];
    const result = parseIngredients(data);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('mint');
    expect(result[1].id).toBe(101);
  });

  it('parses valid potions and ensures item ids + quantities', () => {
    const potions = [
      {
        id: '01',
        name: 'Test Potion',
        ingredients: {
          liquid: 'Water',
          items: [
            { id: 'mint', quantity: 2 },
            { id: 101, quantity: 1 },
          ],
        },
        instructions: {
          default: ['Add water', 'Add mint', 'Boil'],
          optimized: { minLevel: 10, steps: ['Add water', 'Mint', 'Distil'] },
        },
        quantity: {
          base: 1,
          withSecretOfMatterI: 2,
          withSecretOfMatterII: 3,
          withBothSecrets: 4,
        },
        effects: [{ quality: 'Standard', description: 'Does something' }],
        notes: null,
      },
    ];
    const parsed = parsePotions(potions);
    expect(parsed[0].ingredients.items[0].id).toBe('mint');
    expect(parsed[0].instructions.optimized?.minLevel).toBe(10);
  });

  it('detects missing ingredient references across files', () => {
    const ingredients = parseIngredients([{ id: 'mint', name: 'Mint' }]);
    const potions = parsePotions([
      {
        id: '01',
        name: 'Missing Ref',
        ingredients: { liquid: 'Water', items: [{ id: 'unknown', quantity: 1 }] },
        instructions: { default: [] },
        quantity: {
          base: 1,
          withSecretOfMatterI: 2,
          withSecretOfMatterII: 3,
          withBothSecrets: 4,
        },
        effects: [{ quality: 'Weak', description: 'x' }],
      },
    ]);

    const missing = validateReferentialIntegrity(potions, ingredients);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({ potionId: '01', itemId: 'unknown' });
  });

  it('throws on invalid shapes', () => {
    expect(() => parseIngredients({})).toThrow();
    expect(() => parsePotions({})).toThrow();
    expect(() => parsePotions([{ id: 1 }])).toThrow();
    expect(() =>
      parsePotions([
        {
          id: 'x',
          name: 'Bad',
          ingredients: { liquid: 'Water', items: [{ id: 'a', quantity: 0 }] },
          instructions: { default: ['ok'] },
          quantity: { base: 1, withSecretOfMatterI: 2, withSecretOfMatterII: 3, withBothSecrets: 4 },
          effects: [{ quality: 'q', description: 'd' }],
        },
      ]),
    ).toThrow();
  });
});
