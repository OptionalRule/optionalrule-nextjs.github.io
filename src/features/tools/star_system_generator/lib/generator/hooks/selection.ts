import type { Fact, HookCategory, SystemHook, SystemHooks } from '../../../types'
import {
  contractPool,
  encounterPool,
  HOOK_TERMS,
  npcPool,
  rumorPool,
  twistPool,
  type HookEntry,
} from '../data/hooks'
import type { SeededRng } from '../rng'
import { bindEntryText, canBindEntry, type HookBindContext } from './binding'
import { HOOK_SELECTION_PROFILE_V2, type HookSelectionProfile } from './profile'
import { detectHookTerms, type HookTermContext } from './terms'

export interface HookContext extends HookTermContext, HookBindContext {}

export interface SelectHooksArgs {
  rng: SeededRng
  context: HookContext
  profile?: HookSelectionProfile
}

type HookSlotKey = keyof SystemHooks

const CATEGORY_SLOTS: Readonly<Record<HookCategory, { key: HookSlotKey; pool: readonly HookEntry[] }>> = {
  contract: { key: 'contracts', pool: contractPool },
  npc: { key: 'npcs', pool: npcPool },
  encounter: { key: 'encounters', pool: encounterPool },
  rumor: { key: 'rumors', pool: rumorPool },
  twist: { key: 'twists', pool: twistPool },
}

interface PickArgs {
  rng: SeededRng
  pool: readonly HookEntry[]
  preferredTerms: ReadonlySet<string>
  count: number
  bias: number
  seenIds: Set<string>
  category: HookCategory
  bindContext: HookBindContext
}

function entryId(entry: HookEntry): string {
  return entry.text
}

function toSystemHook(entry: HookEntry, category: HookCategory, bindContext: HookBindContext, bindRng: SeededRng): SystemHook {
  const text: Fact<string> = {
    value: bindEntryText(entry, bindContext, bindRng),
    confidence: 'human-layer',
    source: `Procedural ${category} hook (${entry.tags.join('/')})`,
  }
  return {
    text,
    category,
    tags: entry.tags,
  }
}

function pickHooks({ rng, pool, preferredTerms, count, bias, seenIds, category, bindContext }: PickArgs): SystemHook[] {
  const eligiblePool = pool.filter((entry) => canBindEntry(entry, bindContext))
  const bindRng = rng.fork('binds')
  const picks: SystemHook[] = []
  for (let i = 0; i < count; i += 1) {
    const useBias = preferredTerms.size > 0 && rng.chance(bias)
    let candidates: readonly HookEntry[]
    if (useBias) {
      candidates = eligiblePool.filter((entry) => !seenIds.has(entryId(entry)) && entry.tags.some((tag) => preferredTerms.has(tag)))
      if (candidates.length === 0) {
        candidates = eligiblePool.filter((entry) => !seenIds.has(entryId(entry)))
      }
    } else {
      candidates = eligiblePool.filter((entry) => !seenIds.has(entryId(entry)))
    }
    if (candidates.length === 0) break
    const chosen = candidates[rng.int(0, candidates.length - 1)]
    picks.push(toSystemHook(chosen, category, bindContext, bindRng))
    seenIds.add(entryId(chosen))
  }
  return picks
}

const KNOWN_TERMS = new Set<string>(HOOK_TERMS)

function addResonance(target: Set<string>, hooks: readonly SystemHook[]): void {
  for (const hook of hooks) {
    for (const tag of hook.tags) {
      if (KNOWN_TERMS.has(tag)) target.add(tag)
    }
  }
}

export function selectSystemHooks({ rng, context, profile = HOOK_SELECTION_PROFILE_V2 }: SelectHooksArgs): SystemHooks {
  const activeTerms = new Set<string>([...profile.alwaysActiveTerms, ...detectHookTerms(context)])
  const resonantTerms = new Set(activeTerms)
  const seenIds = new Set<string>()
  const bindContext: HookBindContext = { conflicts: context.conflicts, entities: context.entities }
  const hooks: SystemHooks = { rumors: [], contracts: [], encounters: [], npcs: [], twists: [] }
  const drawnCategories = new Set<HookCategory>()

  for (const step of profile.steps) {
    if (drawnCategories.has(step.category)) {
      throw new Error(`Hook selection profile lists category "${step.category}" more than once`)
    }
    drawnCategories.add(step.category)
    const slot = CATEGORY_SLOTS[step.category]
    const picks = pickHooks({
      rng: rng.fork(slot.key),
      pool: slot.pool,
      preferredTerms: step.preferredTerms === 'active' ? activeTerms : resonantTerms,
      count: step.count,
      bias: step.bias,
      seenIds,
      category: step.category,
      bindContext,
    })
    if (step.feedsResonance) addResonance(resonantTerms, picks)
    hooks[slot.key] = picks
  }

  return hooks
}
