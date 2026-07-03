import type {
  Fact,
  GuOverlay,
  HookCategory,
  HumanRemnant,
  Reachability,
  Settlement,
  SystemArchitecture,
  SystemHook,
  SystemHooks,
  SystemPhenomenon,
} from '../../types'
import type { Conflict } from './conflicts'
import type { EntityRef } from './graph/types'
import {
  contractPool,
  encounterPool,
  HOOK_TERMS,
  npcPool,
  rumorPool,
  twistPool,
  type HookBindSlot,
  type HookEntry,
} from './data/hooks'
import type { SeededRng } from './rng'

export interface HookContext {
  guOverlay: GuOverlay
  settlements: readonly Settlement[]
  ruins: readonly HumanRemnant[]
  phenomena: readonly SystemPhenomenon[]
  architecture: SystemArchitecture
  reachability: Reachability
  conflicts: readonly Conflict[]
  entities: readonly EntityRef[]
}

export interface HookBindContext {
  conflicts: readonly Conflict[]
  entities: readonly EntityRef[]
}

function partyCandidates(ctx: HookBindContext): readonly EntityRef[] {
  const refs = ctx.conflicts.flatMap((conflict) => conflict.parties.map((party) => party.ref))
  const preferred = refs.filter((ref) => ref.kind === 'namedFaction' || ref.kind === 'settlement')
  return preferred.length > 0 ? preferred : refs
}

function placeCandidates(ctx: HookBindContext): readonly EntityRef[] {
  return ctx.entities.filter((entity) => entity.kind === 'settlement' || entity.kind === 'body')
}

function stakeCandidates(ctx: HookBindContext): readonly EntityRef[] {
  const refs: EntityRef[] = []
  for (const conflict of ctx.conflicts) {
    if (conflict.stakeRef) refs.push(conflict.stakeRef)
  }
  return refs
}

function phenomenonCandidates(ctx: HookBindContext): readonly EntityRef[] {
  return ctx.entities.filter((entity) => entity.kind === 'phenomenon')
}

const SLOT_CANDIDATES: Record<HookBindSlot, (ctx: HookBindContext) => readonly EntityRef[]> = {
  party: partyCandidates,
  place: placeCandidates,
  stake: stakeCandidates,
  phenomenon: phenomenonCandidates,
}

function distinctBinds(entry: HookEntry): readonly HookBindSlot[] {
  if (!entry.binds || entry.binds.length === 0) return []
  return Array.from(new Set(entry.binds))
}

export function canBindEntry(entry: HookEntry, ctx: HookBindContext): boolean {
  return distinctBinds(entry).every((slot) => SLOT_CANDIDATES[slot](ctx).length > 0)
}

export function bindEntryText(entry: HookEntry, ctx: HookBindContext, rng: SeededRng): string {
  const slots = distinctBinds(entry)
  if (slots.length === 0) return entry.text
  let text = entry.text
  for (const slot of slots) {
    const candidates = SLOT_CANDIDATES[slot](ctx)
    const chosen = candidates[rng.int(0, candidates.length - 1)]
    text = text.split(`{${slot}}`).join(chosen.displayName)
  }
  return text
}

export interface SelectHooksArgs {
  rng: SeededRng
  context: HookContext
}

const TERM_PATTERNS: Record<string, readonly RegExp[]> = {
  Bleed: [/\bbleed\b/i, /bleed-/i, /\bbloom\b/i, /\briver\b/i, /\bnode\b/i, /\bscar\b/i, /\bseep\b/i],
  Chirality: [/\bchiral/i, /handedness/i, /wrong-handed/i, /right-handed/i, /left-handed/i],
  Shiab: [/\bshiab/i, /\bblade\b/i],
  'Dark sector': [/dark[- ]sector/i, /anchor[- ]mass/i, /shadow[- ]lance/i, /gravity[- ]tide/i, /doped[- ]ore/i],
  'Programmable matter': [/programmable/i, /microseed/i, /self-ordering regolith/i, /crystal foam/i, /runaway growth/i],
  'Metric storm': [/metric[- ]storm/i, /\bshear\b/i, /clock desync/i, /phase instab/i, /metric mirage/i, /baseline drift/i],
  Pinchdrive: [/pinchdrive/i, /\bpinch\b/i, /calibration/i, /misjump/i],
  Iggygate: [/iggygate/i, /\bthroat\b/i, /\bwake\b/i, /\bpylon\b/i, /gate-selected/i, /gate authority/i],
  Gardener: [/gardener/i, /surgical strike/i, /sol[- ]interdiction/i, /warning beacon/i],
  'Sol Silence': [/\bsilence\b/i, /sol[- ]shadow/i, /exclusion zone/i],
  'Narrow AI': [/narrow[- ]ai/i, /narrow ai/i, /stabilizer/i, /perception error/i, /witness core/i, /asi[- ]fragment/i, /fragmentation/i],
  'First-wave': [/first[- ]wave/i, /\bheir\b/i, /\bcharter\b/i, /\bruin/i, /pre-silence/i],
}

function collectHaystack(context: HookContext): string {
  const parts: string[] = [
    context.guOverlay.intensity.value,
    context.guOverlay.bleedLocation.value,
    context.guOverlay.bleedBehavior.value,
    context.guOverlay.resource.value,
    context.guOverlay.hazard.value,
    context.architecture.name.value,
    context.architecture.description.value,
    context.reachability.className.value,
    context.reachability.routeNote.value,
  ]
  for (const settlement of context.settlements) {
    parts.push(
      settlement.tags.map((tag) => tag.value).join(' '),
      settlement.tagHook.value,
      settlement.aiSituation.value,
      settlement.function.value,
      settlement.habitationPattern.value,
      settlement.builtForm.value,
      settlement.crisis.value,
      settlement.hiddenTruth.value,
      settlement.location.value,
      settlement.siteCategory.value,
    )
  }
  for (const ruin of context.ruins) {
    parts.push(ruin.location.value, ruin.remnantType.value, ruin.hook.value)
  }
  for (const phenomenon of context.phenomena) {
    parts.push(
      phenomenon.phenomenon.value,
      phenomenon.note.value,
      phenomenon.travelEffect.value,
      phenomenon.surveyQuestion.value,
      phenomenon.conflictHook.value,
      phenomenon.sceneAnchor.value,
    )
  }
  return parts.join(' ')
}

export function deriveActiveTerms(context: HookContext): Set<string> {
  const haystack = collectHaystack(context)
  const active = new Set<string>(['GU', 'Bleed'])
  for (const [term, patterns] of Object.entries(TERM_PATTERNS)) {
    if (patterns.some((re) => re.test(haystack))) active.add(term)
  }
  return active
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

export function selectSystemHooks({ rng, context }: SelectHooksArgs): SystemHooks {
  const activeTerms = deriveActiveTerms(context)
  const seenIds = new Set<string>()
  const bindContext: HookBindContext = { conflicts: context.conflicts, entities: context.entities }

  const contracts = pickHooks({
    rng: rng.fork('contracts'),
    pool: contractPool,
    preferredTerms: activeTerms,
    count: 1,
    bias: 0.7,
    seenIds,
    category: 'contract',
    bindContext,
  })

  const resonantTerms = new Set(activeTerms)
  addResonance(resonantTerms, contracts)

  const npcs = pickHooks({
    rng: rng.fork('npcs'),
    pool: npcPool,
    preferredTerms: resonantTerms,
    count: 2,
    bias: 0.7,
    seenIds,
    category: 'npc',
    bindContext,
  })
  addResonance(resonantTerms, npcs)

  const encounters = pickHooks({
    rng: rng.fork('encounters'),
    pool: encounterPool,
    preferredTerms: resonantTerms,
    count: 1,
    bias: 0.7,
    seenIds,
    category: 'encounter',
    bindContext,
  })

  const rumors = pickHooks({
    rng: rng.fork('rumors'),
    pool: rumorPool,
    preferredTerms: activeTerms,
    count: 3,
    bias: 0.6,
    seenIds,
    category: 'rumor',
    bindContext,
  })

  const twists = pickHooks({
    rng: rng.fork('twists'),
    pool: twistPool,
    preferredTerms: resonantTerms,
    count: 1,
    bias: 0.8,
    seenIds,
    category: 'twist',
    bindContext,
  })

  return { rumors, contracts, encounters, npcs, twists }
}
