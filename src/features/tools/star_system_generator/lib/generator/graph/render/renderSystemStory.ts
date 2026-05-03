import type { SeededRng } from '../../rng'
import type { SystemRelationshipGraph, SystemStoryOutput } from '../types'

export function renderSystemStory(
  _graph: SystemRelationshipGraph,
  _rng: SeededRng,
): SystemStoryOutput {
  return {
    spineSummary: '',
    body: [],
    hooks: [],
  }
}
