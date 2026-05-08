import hooksData from '../../../data/hooks.json'

export interface HookEntry {
  text: string
  tags: readonly string[]
}

interface HooksFile {
  rumors: readonly HookEntry[]
  contracts: readonly HookEntry[]
  encounters: readonly HookEntry[]
  npcs: readonly HookEntry[]
  twists: readonly HookEntry[]
}

const typed = hooksData as unknown as HooksFile

export const rumorPool = typed.rumors
export const contractPool = typed.contracts
export const encounterPool = typed.encounters
export const npcPool = typed.npcs
export const twistPool = typed.twists

export const HOOK_TERMS = [
  'GU',
  'Bleed',
  'Chirality',
  'Shiab',
  'Dark sector',
  'Programmable matter',
  'Metric storm',
  'Pinchdrive',
  'Iggygate',
  'Gardener',
  'Sol Silence',
  'Narrow AI',
  'First-wave',
] as const

export type HookTerm = typeof HOOK_TERMS[number]
