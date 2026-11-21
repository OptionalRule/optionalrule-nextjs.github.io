import type { HookCategory } from '../../../types'
import type { HookTerm } from '../data/hooks'

export interface HookSelectionStep {
  category: HookCategory
  count: number
  bias: number
  preferredTerms: 'active' | 'resonant'
  feedsResonance: boolean
}

export interface HookSelectionProfile {
  alwaysActiveTerms: readonly HookTerm[]
  steps: readonly HookSelectionStep[]
}

export const HOOK_SELECTION_PROFILE_V2 = {
  alwaysActiveTerms: ['GU', 'Bleed'],
  steps: [
    { category: 'contract', count: 1, bias: 0.7, preferredTerms: 'active', feedsResonance: true },
    { category: 'npc', count: 2, bias: 0.4, preferredTerms: 'resonant', feedsResonance: true },
    { category: 'encounter', count: 1, bias: 0.7, preferredTerms: 'resonant', feedsResonance: false },
    { category: 'rumor', count: 3, bias: 0.35, preferredTerms: 'active', feedsResonance: false },
    { category: 'twist', count: 1, bias: 0.8, preferredTerms: 'resonant', feedsResonance: false },
  ],
} as const satisfies HookSelectionProfile
