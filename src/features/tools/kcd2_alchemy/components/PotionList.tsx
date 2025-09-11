import type { IngredientId, NormalizedPotionRecipe } from '../types'
import { PotionCard } from './PotionCard'

export function PotionList({ potions, selectedIngredientIds = [] }: { potions: NormalizedPotionRecipe[]; selectedIngredientIds?: IngredientId[] }) {
  if (!potions.length) {
    return (
      <div className="text-sm text-[var(--muted-2)] border border-[var(--border)] rounded-md p-6 bg-[var(--card)]">
        No results. Try clearing filters or searching a different term.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {potions.map((p) => (
        <PotionCard key={p.id} potion={p} highlightIngredientIds={selectedIngredientIds} />
      ))}
    </div>
  )
}
