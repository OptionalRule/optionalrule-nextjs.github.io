// Lightweight validators for KCD2 Alchemy data (no external deps)

import type {
  Ingredient,
  IngredientId,
  PotionRecipe,
  PotionItem,
} from '../types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isId(value: unknown): value is IngredientId {
  return isString(value) || isNumber(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function parseIngredients(input: unknown): Ingredient[] {
  assert(Array.isArray(input), 'ingredients: expected an array');
  return input.map((row, idx) => {
    assert(isObject(row), `ingredients[${idx}]: expected object`);
    const obj = row as Record<string, unknown>;
    const id = obj.id;
    const name = obj.name;
    assert(isId(id), `ingredients[${idx}].id: expected string|number`);
    assert(isString(name) && name.trim().length > 0, `ingredients[${idx}].name: expected non-empty string`);
    return { id: id as IngredientId, name: name as string } satisfies Ingredient;
  });
}

export function parsePotions(input: unknown): PotionRecipe[] {
  assert(Array.isArray(input), 'potions: expected an array');

  return input.map((row, idx) => {
    assert(isObject(row), `potions[${idx}]: expected object`);
    const obj = row as Record<string, unknown>;
    const id = obj.id;
    const name = obj.name;
    assert(isString(id), `potions[${idx}].id: expected string`);
    assert(isString(name) && name.trim().length > 0, `potions[${idx}].name: expected non-empty string`);

    const ingredients = obj.ingredients as unknown;
    assert(isObject(ingredients), `potions[${idx}].ingredients: expected object`);
    const ingObj = ingredients as Record<string, unknown>;
    const liquid = ingObj.liquid;
    assert(isString(liquid) && liquid.trim().length > 0, `potions[${idx}].ingredients.liquid: expected non-empty string`);
    const items = ingObj.items as unknown;
    assert(Array.isArray(items) && items.length > 0, `potions[${idx}].ingredients.items: expected non-empty array`);

    const parsedItems: PotionItem[] = (items as unknown[]).map((it, j: number) => {
      assert(isObject(it), `potions[${idx}].ingredients.items[${j}]: expected object`);
      const itm = it as Record<string, unknown>;
      const _id = itm.id;
      const quantity = itm.quantity;
      assert(isId(_id), `potions[${idx}].ingredients.items[${j}].id: expected string|number`);
      assert(isNumber(quantity) && quantity > 0, `potions[${idx}].ingredients.items[${j}].quantity: expected number > 0`);
      return { id: _id as IngredientId, quantity: quantity as number };
    });

    const instructions = obj.instructions as unknown;
    assert(isObject(instructions), `potions[${idx}].instructions: expected object`);
    const instObj = instructions as Record<string, unknown>;
    const def = instObj.default as unknown;
    assert(Array.isArray(def), `potions[${idx}].instructions.default: expected array`);
    (def as unknown[]).forEach((s, k) => assert(isString(s), `potions[${idx}].instructions.default[${k}]: expected string`));

    const optimized = instObj.optimized as unknown;
    if (optimized !== undefined) {
      assert(isObject(optimized), `potions[${idx}].instructions.optimized: expected object`);
      const optObj = optimized as Record<string, unknown>;
      assert(isNumber(optObj.minLevel), `potions[${idx}].instructions.optimized.minLevel: expected number`);
      const steps = optObj.steps as unknown;
      assert(Array.isArray(steps), `potions[${idx}].instructions.optimized.steps: expected array`);
      (steps as unknown[]).forEach((s: unknown, k: number) => assert(isString(s), `potions[${idx}].instructions.optimized.steps[${k}]: expected string`));
    }

    const quantity = obj.quantity as unknown;
    assert(isObject(quantity), `potions[${idx}].quantity: expected object`);
    const qtyObj = quantity as Record<string, unknown>;
    ;(['base', 'withSecretOfMatterI', 'withSecretOfMatterII', 'withBothSecrets'] as const).forEach((key) => {
      assert(isNumber(qtyObj[key]), `potions[${idx}].quantity.${key}: expected number`);
    });
    if (qtyObj.withSecretOfSecrets !== undefined) {
      assert(isObject(qtyObj.withSecretOfSecrets), `potions[${idx}].quantity.withSecretOfSecrets: expected object`);
    }

    const effects = obj.effects as unknown;
    assert(Array.isArray(effects) && effects.length > 0, `potions[${idx}].effects: expected non-empty array`);
    (effects as unknown[]).forEach((e, k: number) => {
      assert(isObject(e), `potions[${idx}].effects[${k}]: expected object`);
      const eff = e as Record<string, unknown>;
      assert(isString(eff.quality), `potions[${idx}].effects[${k}].quality: expected string`);
      assert(isString(eff.description), `potions[${idx}].effects[${k}].description: expected string`);
    });

    const notes = obj.notes as unknown;
    assert(notes === null || notes === undefined || isString(notes), `potions[${idx}].notes: expected string|null|undefined`);

    return {
      id: id as string,
      name: name as string,
      ingredients: { liquid: liquid as string, items: parsedItems },
      instructions: {
        default: def as string[],
        ...(optimized
          ? {
              optimized: {
                minLevel: (optimized as Record<string, unknown>).minLevel as number,
                steps: (optimized as Record<string, unknown>).steps as string[],
              },
            }
          : {}),
      },
      quantity: {
        base: qtyObj.base as number,
        withSecretOfMatterI: qtyObj.withSecretOfMatterI as number,
        withSecretOfMatterII: qtyObj.withSecretOfMatterII as number,
        withBothSecrets: qtyObj.withBothSecrets as number,
        ...(isObject(qtyObj.withSecretOfSecrets)
          ? { withSecretOfSecrets: qtyObj.withSecretOfSecrets as Record<string, number> }
          : {}),
      },
      effects: (effects as unknown[]).map((e) => e as { quality: string; description: string }),
      notes: (notes as string | null | undefined) ?? undefined,
    } satisfies PotionRecipe;
  });
}

export function validateReferentialIntegrity(potions: PotionRecipe[], ingredients: Ingredient[]) {
  const idSet = new Set<string>(ingredients.map((i) => String(i.id)));
  const missing: Array<{ potionId: string; itemId: IngredientId }> = [];
  for (const p of potions) {
    for (const it of p.ingredients.items) {
      if (!idSet.has(String(it.id))) {
        missing.push({ potionId: p.id, itemId: it.id });
      }
    }
  }
  return missing;
}
