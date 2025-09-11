'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Ingredient, NormalizedPotionRecipe } from '../types'
import { parseIngredients, parsePotions, validateReferentialIntegrity } from '../lib/schema'
import {
  buildIngredientIndex,
  deriveEffectQualities,
  deriveIngredientOptions,
  resolvePotions,
} from '../lib/normalize'

export interface AlchemyDataState {
  loading: boolean
  error: string | null
  potions: NormalizedPotionRecipe[]
  ingredients: Ingredient[]
  ingredientOptions: { id: string | number; name: string }[]
  effectQualities: string[]
}

export function useAlchemyData(): AlchemyDataState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [potions, setPotions] = useState<NormalizedPotionRecipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [ingRes, potRes] = await Promise.all([
          fetch('/tools/kcd2_alchemy/ingredients.json'),
          fetch('/tools/kcd2_alchemy/potions.json'),
        ])
        if (!ingRes.ok || !potRes.ok) {
          throw new Error('Failed to fetch data assets')
        }

        const ingJson = (await ingRes.json()) as unknown
        const potJson = (await potRes.json()) as unknown

        const parsedIngredients = parseIngredients(ingJson)
        const parsedPotions = parsePotions(potJson)

        const missing = validateReferentialIntegrity(parsedPotions, parsedIngredients)
        if (missing.length > 0) {
          // Surface a concise message; details in console
          console.error('Missing ingredient references:', missing)
          throw new Error('Data integrity error: some potions reference unknown ingredient IDs')
        }

        const index = buildIngredientIndex(parsedIngredients)
        const resolved = resolvePotions(parsedPotions, index)

        if (!cancelled) {
          setIngredients(parsedIngredients)
          setPotions(resolved)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const ingredientOptions = useMemo(() => deriveIngredientOptions(ingredients), [ingredients])
  const effectQualities = useMemo(() => deriveEffectQualities(potions), [potions])

  return { loading, error, potions, ingredients, ingredientOptions, effectQualities }
}
