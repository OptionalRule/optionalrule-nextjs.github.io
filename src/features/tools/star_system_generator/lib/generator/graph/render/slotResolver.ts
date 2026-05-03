import type { EdgeType, EdgeVisibility, EntityRef } from '../types'
import type { SlotShape } from './templates/types'
import { reshapeSlot } from './grammarSafety'

export interface EdgeRenderContext {
  subject: EntityRef
  object: EntityRef
  qualifier?: string
  edgeType: EdgeType
  visibility: EdgeVisibility
  historical?: { summary?: string; era?: string }
}

export interface SlotExpression {
  name: string
  modifier?: string
  fallback?: string
}

const SLOT_PATTERN = /\{([^}]+)\}/g

export function parseSlotExpression(expr: string): SlotExpression {
  let body = expr
  let fallback: string | undefined
  const pipeIndex = body.indexOf('|')
  if (pipeIndex >= 0) {
    fallback = body.slice(pipeIndex + 1)
    body = body.slice(0, pipeIndex)
  }
  let modifier: string | undefined
  const colonIndex = body.indexOf(':')
  if (colonIndex >= 0) {
    modifier = body.slice(colonIndex + 1)
    body = body.slice(0, colonIndex)
  }
  const result: SlotExpression = { name: body }
  if (modifier !== undefined) result.modifier = modifier
  if (fallback !== undefined) result.fallback = fallback
  return result
}

export function resolveSlots(
  template: string,
  ctx: EdgeRenderContext,
  expects?: Partial<Record<string, SlotShape>>,
): string {
  return template.replace(SLOT_PATTERN, (_full, expr: string) => {
    const slot = parseSlotExpression(expr)
    return resolveOne(slot, ctx, expects)
  })
}

function resolveOne(
  slot: SlotExpression,
  ctx: EdgeRenderContext,
  expects?: Partial<Record<string, SlotShape>>,
): string {
  if (slot.name === 'historical') {
    const sub = slot.modifier
    let raw: string | undefined
    if (sub === 'summary') raw = ctx.historical?.summary
    else if (sub === 'era') raw = ctx.historical?.era
    else raw = undefined

    if (raw === undefined || raw === '') return slot.fallback ?? ''

    const shape: SlotShape = sub === 'era' ? 'era' : 'clause'
    return reshapeSlot(raw, shape)
  }

  let raw: string | undefined
  if (slot.name === 'subject') raw = ctx.subject.displayName
  else if (slot.name === 'object') raw = ctx.object.displayName
  else if (slot.name === 'qualifier') raw = ctx.qualifier
  else throw new Error(`unknown slot: ${slot.name}`)

  if (raw === undefined || raw === '') {
    return slot.fallback ?? ''
  }
  const shape: SlotShape = expects?.[slot.name] ?? 'properNoun'
  const reshaped = reshapeSlot(raw, shape)
  return applyModifier(reshaped, slot.modifier)
}

function applyModifier(value: string, modifier: string | undefined): string {
  if (modifier === undefined) return value
  if (modifier === 'lower') return value.toLowerCase()
  if (modifier === 'article') return startsWithUppercase(value) ? value : `the ${value}`
  return value
}

function startsWithUppercase(value: string): boolean {
  if (value.length === 0) return false
  const first = value[0]
  return first === first.toUpperCase() && first !== first.toLowerCase()
}
