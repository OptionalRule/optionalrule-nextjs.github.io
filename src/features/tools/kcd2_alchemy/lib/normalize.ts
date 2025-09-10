import type {
  Ingredient,
  IngredientId,
  NormalizedPotionRecipe,
  PotionRecipe,
  ResolvedPotionItem,
} from '../types';

export type IngredientIndex = Map<string, Ingredient>;

export function toKey(id: IngredientId): string {
  return String(id);
}

export function buildIngredientIndex(ingredients: Ingredient[]): IngredientIndex {
  const map: IngredientIndex = new Map();
  for (const ing of ingredients) {
    map.set(toKey(ing.id), ing);
  }
  return map;
}

export function resolvePotion(
  potion: PotionRecipe,
  ingredientIndex: IngredientIndex,
): NormalizedPotionRecipe {
  const items: ResolvedPotionItem[] = potion.ingredients.items.map((it) => {
    const found = ingredientIndex.get(toKey(it.id));
    return {
      ...it,
      name: found?.name ?? String(it.id),
    };
  });

  return {
    ...potion,
    ingredients: {
      liquid: potion.ingredients.liquid,
      items,
    },
  };
}

export function resolvePotions(
  potions: PotionRecipe[],
  ingredientIndex: IngredientIndex,
): NormalizedPotionRecipe[] {
  return potions.map((p) => resolvePotion(p, ingredientIndex));
}

export function deriveIngredientOptions(ingredients: Ingredient[]) {
  return ingredients
    .map((i) => ({ id: i.id, name: i.name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function deriveEffectQualities(potions: PotionRecipe[]): string[] {
  const set = new Set<string>();
  for (const p of potions) {
    for (const e of p.effects) set.add(e.quality);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

