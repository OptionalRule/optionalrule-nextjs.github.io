import type { Conflict } from '../conflicts'
import type { HookBindSlot, HookEntry } from '../data/hooks'
import type { EntityRef } from '../graph/types'
import type { SeededRng } from '../rng'

export interface HookBindContext {
  conflicts: readonly Conflict[]
  entities: readonly EntityRef[]
}

function preferPartyKinds(refs: readonly EntityRef[]): readonly EntityRef[] {
  const preferred = refs.filter((ref) => ref.kind === 'namedFaction' || ref.kind === 'settlement')
  return preferred.length > 0 ? preferred : refs
}

function conflictPartyPool(conflict: Conflict, excluded: ReadonlySet<string>): readonly EntityRef[] {
  return preferPartyKinds(
    conflict.parties.map((party) => party.ref).filter((ref) => !excluded.has(ref.displayName)),
  )
}

function flattenedPartyPool(ctx: HookBindContext): readonly EntityRef[] {
  return preferPartyKinds(ctx.conflicts.flatMap((conflict) => conflict.parties.map((party) => party.ref)))
}

function stakePool(ctx: HookBindContext): readonly EntityRef[] {
  const refs: EntityRef[] = []
  for (const conflict of ctx.conflicts) {
    if (conflict.stakeRef) refs.push(conflict.stakeRef)
  }
  return refs
}

function placePool(ctx: HookBindContext): readonly EntityRef[] {
  return ctx.entities.filter((entity) => entity.kind === 'settlement' || entity.kind === 'body')
}

function phenomenonPool(ctx: HookBindContext): readonly EntityRef[] {
  return ctx.entities.filter((entity) => entity.kind === 'phenomenon')
}

function pairedConflicts(ctx: HookBindContext): readonly Conflict[] {
  return ctx.conflicts.filter((conflict) => {
    if (!conflict.stakeRef) return false
    return conflictPartyPool(conflict, new Set([conflict.stakeRef.displayName])).length > 0
  })
}

function distinctBinds(entry: HookEntry): ReadonlySet<HookBindSlot> {
  return new Set(entry.binds ?? [])
}

// canBindEntry checks each pool against the worst-case set of names any upstream
// draw could bind, so a true result guarantees bindEntryText never dead-ends and
// the pre-draw pool filter agrees exactly with the binder.
export function canBindEntry(entry: HookEntry, ctx: HookBindContext): boolean {
  const slots = distinctBinds(entry)
  const worstCaseBound = new Set<string>()
  if (slots.has('party') && slots.has('stake')) {
    const eligible = pairedConflicts(ctx)
    if (eligible.length === 0) return false
    for (const conflict of eligible) {
      if (!conflict.stakeRef) continue
      worstCaseBound.add(conflict.stakeRef.displayName)
      for (const ref of conflictPartyPool(conflict, new Set([conflict.stakeRef.displayName]))) {
        worstCaseBound.add(ref.displayName)
      }
    }
  } else if (slots.has('party')) {
    const pool = flattenedPartyPool(ctx)
    if (pool.length === 0) return false
    for (const ref of pool) worstCaseBound.add(ref.displayName)
  } else if (slots.has('stake')) {
    const pool = stakePool(ctx)
    if (pool.length === 0) return false
    for (const ref of pool) worstCaseBound.add(ref.displayName)
  }
  if (slots.has('place')) {
    const pool = placePool(ctx).filter((ref) => !worstCaseBound.has(ref.displayName))
    if (pool.length === 0) return false
    for (const ref of pool) worstCaseBound.add(ref.displayName)
  }
  if (slots.has('phenomenon')) {
    const pool = phenomenonPool(ctx).filter((ref) => !worstCaseBound.has(ref.displayName))
    if (pool.length === 0) return false
  }
  return true
}

export function bindEntryText(entry: HookEntry, ctx: HookBindContext, rng: SeededRng): string {
  const slots = distinctBinds(entry)
  if (slots.size === 0) return entry.text
  const bound = new Map<HookBindSlot, string>()
  const boundNames = new Set<string>()

  const bindFromPool = (slot: HookBindSlot, pool: readonly EntityRef[]): void => {
    const chosen = pool[rng.int(0, pool.length - 1)]
    bound.set(slot, chosen.displayName)
    boundNames.add(chosen.displayName)
  }

  if (slots.has('party') && slots.has('stake')) {
    const eligible = pairedConflicts(ctx)
    const conflict = eligible[rng.int(0, eligible.length - 1)]
    if (conflict.stakeRef) {
      bound.set('stake', conflict.stakeRef.displayName)
      boundNames.add(conflict.stakeRef.displayName)
      bindFromPool('party', conflictPartyPool(conflict, new Set([conflict.stakeRef.displayName])))
    }
  } else if (slots.has('party')) {
    bindFromPool('party', flattenedPartyPool(ctx))
  } else if (slots.has('stake')) {
    bindFromPool('stake', stakePool(ctx))
  }
  if (slots.has('place')) {
    bindFromPool('place', placePool(ctx).filter((ref) => !boundNames.has(ref.displayName)))
  }
  if (slots.has('phenomenon')) {
    bindFromPool('phenomenon', phenomenonPool(ctx).filter((ref) => !boundNames.has(ref.displayName)))
  }

  let text = entry.text
  for (const [slot, name] of bound) {
    text = text.split(`{${slot}}`).join(name)
  }
  return text
}
