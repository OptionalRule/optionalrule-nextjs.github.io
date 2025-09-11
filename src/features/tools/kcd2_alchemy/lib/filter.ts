import type { IngredientId, NormalizedPotionRecipe } from '../types'

export type IngredientMatchMode = 'any' | 'all'

export interface FilterState {
  query: string
  ingredientIds: IngredientId[]
  ingredientMode: IngredientMatchMode
}

function includesCaseInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export function textMatch(p: NormalizedPotionRecipe, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim()
  if (includesCaseInsensitive(p.name, q)) return true
  for (const e of p.effects) {
    if (includesCaseInsensitive(e.description, q)) return true
  }
  return false
}

export function ingredientMatch(
  p: NormalizedPotionRecipe,
  ingredientIds: IngredientId[],
  mode: IngredientMatchMode,
): boolean {
  if (!ingredientIds.length) return true
  const set = new Set<string>(ingredientIds.map(String))
  const has = (id: string | number) => set.has(String(id))
  if (mode === 'all') {
    // Every selected id must be present in the potion's items
    return Array.from(set).every((sel) => p.ingredients.items.some((it) => has(it.id) && String(it.id) === sel))
  }
  // any
  return p.ingredients.items.some((it) => has(it.id))
}

export function applyFilters(
  potions: NormalizedPotionRecipe[],
  filters: FilterState,
): NormalizedPotionRecipe[] {
  const { query, ingredientIds, ingredientMode } = filters
  return potions
    .filter((p) => textMatch(p, query))
    .filter((p) => ingredientMatch(p, ingredientIds, ingredientMode))
    .sort((a, b) => a.name.localeCompare(b.name))
}
