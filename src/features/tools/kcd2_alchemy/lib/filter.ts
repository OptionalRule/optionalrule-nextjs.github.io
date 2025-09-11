import type { IngredientId, NormalizedPotionRecipe } from '../types'

export interface FilterState {
  query: string
  ingredientIds: IngredientId[]
  effectQualities: string[]
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
): boolean {
  if (!ingredientIds.length) return true
  const set = new Set<string>(ingredientIds.map(String))
  return p.ingredients.items.some((it) => set.has(String(it.id)))
}

export function effectQualityMatch(
  p: NormalizedPotionRecipe,
  qualities: string[],
): boolean {
  if (!qualities.length) return true
  const set = new Set(qualities.map((q) => q.toLowerCase()))
  return p.effects.some((e) => set.has(e.quality.toLowerCase()))
}

export function applyFilters(
  potions: NormalizedPotionRecipe[],
  filters: FilterState,
): NormalizedPotionRecipe[] {
  const { query, ingredientIds, effectQualities } = filters
  return potions
    .filter((p) => textMatch(p, query))
    .filter((p) => ingredientMatch(p, ingredientIds))
    .filter((p) => effectQualityMatch(p, effectQualities))
    .sort((a, b) => a.name.localeCompare(b.name))
}

