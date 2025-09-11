'use client'

import { useMemo } from 'react'
import type { IngredientId, NormalizedPotionRecipe } from '../types'
import { applyFilters, type FilterState } from '../lib/filter'

export interface UsePotionFiltersInput {
  potions: NormalizedPotionRecipe[]
  query: string
  ingredientIds: IngredientId[]
  effectQualities: string[]
}

export function usePotionFilters({ potions, query, ingredientIds, effectQualities }: UsePotionFiltersInput) {
  return useMemo(() => {
    const filters: FilterState = { query, ingredientIds, effectQualities }
    const results = applyFilters(potions, filters)
    return { results, count: results.length }
  }, [potions, query, ingredientIds, effectQualities])
}

