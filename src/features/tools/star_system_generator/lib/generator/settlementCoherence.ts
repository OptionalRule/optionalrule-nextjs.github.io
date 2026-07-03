import type { SeededRng } from './rng'
import { pickOne } from './dice'
import { crisisTruthPairs, hiddenTruths } from './data/settlements'

const truthsByCrisis = new Map(crisisTruthPairs.map(p => [p.crisis, p.truths]))

export function selectCoherentHiddenTruth(crisis: string, rng: SeededRng): string {
  const preferPaired = rng.chance(0.7)
  const paired = truthsByCrisis.get(crisis)
  if (preferPaired && paired && paired.length > 0) return pickOne(rng, paired)
  return pickOne(rng, hiddenTruths)
}
