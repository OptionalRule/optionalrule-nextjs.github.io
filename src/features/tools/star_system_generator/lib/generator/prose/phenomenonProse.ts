import type { PhenomenonEntry } from '../data/narrative'

export function phenomenonNote(phenomenon: PhenomenonEntry): string {
  return `Transit: ${phenomenon.travelEffect} Question: ${phenomenon.surveyQuestion} Hook: ${phenomenon.conflictHook} Image: ${phenomenon.sceneAnchor}`
}
