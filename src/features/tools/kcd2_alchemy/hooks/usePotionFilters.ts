'use client'

import { useMemo } from 'react'
import type { IngredientId, NormalizedPotionRecipe } from '../types'
import { applyFilters, type FilterState, type IngredientMatchMode } from '../lib/filter'

export interface UsePotionFiltersInput {
  potions: NormalizedPotionRecipe[]
  query: string
  ingredientIds: IngredientId[]
  ingredientMode: IngredientMatchMode
}

export function usePotionFilters({ potions, query, ingredientIds, ingredientMode }: UsePotionFiltersInput) {
  return useMemo(() => {
    const filters: FilterState = { query, ingredientIds, ingredientMode }
    const results = applyFilters(potions, filters)
    return { results, count: results.length }
  }, [potions, query, ingredientIds, ingredientMode])
}
