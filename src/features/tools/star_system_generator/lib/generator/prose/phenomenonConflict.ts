import type { PhenomenonEntry } from '../data/narrative'
import type { SeededRng } from '../rng'
import { sentenceStart } from './helpers'

const FRICTION_FRAMES: readonly string[] = [
  '{actor} {dependence}, but {friction}.',
  '{actor} {dependence} — except that {friction}.',
  '{actor} {dependence}; the catch is that {friction}.',
  '{actor} {dependence}, and the trouble is that {friction}.',
  '{actor} {dependence}, though {friction}.',
  '{actor} {dependence}. The catch: {friction}.',
]

export function composePhenomenonConflict(entry: PhenomenonEntry, rng: SeededRng): string {
  const livelihoods = entry.livelihoods
  if (!livelihoods || livelihoods.length === 0) return entry.conflictHook

  const livelihood = livelihoods[rng.int(0, livelihoods.length - 1)]
  const frame = FRICTION_FRAMES[rng.int(0, FRICTION_FRAMES.length - 1)]

  return frame
    .replaceAll('{actor}', sentenceStart(livelihood.actor))
    .replaceAll('{dependence}', livelihood.dependence)
    .replaceAll('{friction}', livelihood.friction)
}
