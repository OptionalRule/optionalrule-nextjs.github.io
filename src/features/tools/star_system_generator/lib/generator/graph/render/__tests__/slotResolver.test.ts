import { describe, expect, it } from 'vitest'
import { resolveSlots, parseSlotExpression } from '../slotResolver'
import type { EdgeRenderContext } from '../slotResolver'

function makeCtx(overrides: Partial<EdgeRenderContext> = {}): EdgeRenderContext {
  return {
    subject: { kind: 'settlement', id: 's1', displayName: 'Orison Hold', layer: 'human' },
    object: { kind: 'guResource', id: 'gu-resource', displayName: 'chiral ice belt', layer: 'gu' },
    qualifier: undefined,
    edgeType: 'DEPENDS_ON',
    visibility: 'public',
    ...overrides,
  }
}

describe('parseSlotExpression', () => {
  it('parses bare slot name', () => {
    expect(parseSlotExpression('subject')).toEqual({ name: 'subject' })
  })
  it('parses slot:modifier', () => {
    expect(parseSlotExpression('subject:article')).toEqual({ name: 'subject', modifier: 'article' })
  })
  it('parses slot|fallback', () => {
    expect(parseSlotExpression('qualifier|the route')).toEqual({ name: 'qualifier', fallback: 'the route' })
  })
  it('parses slot:modifier|fallback', () => {
    expect(parseSlotExpression('subject:lower|the actor')).toEqual({ name: 'subject', modifier: 'lower', fallback: 'the actor' })
  })
})

describe('resolveSlots', () => {
  it('substitutes {subject} with displayName', () => {
    expect(resolveSlots('{subject} watches', makeCtx())).toBe('Orison Hold watches')
  })

  it('substitutes {object} with displayName', () => {
    expect(resolveSlots('controls {object}', makeCtx())).toBe('controls chiral ice belt')
  })

  it('substitutes {subject:article} with definite-article-prefixed form when not a proper noun', () => {
    const ctx = makeCtx({
      subject: { kind: 'namedFaction', id: 'f1', displayName: 'Route Authority', layer: 'human' },
    })
    expect(resolveSlots('{subject:article} stalks the lanes', ctx)).toBe('Route Authority stalks the lanes')
  })

  it('substitutes {object:article} with article when value is not a proper noun', () => {
    expect(resolveSlots('depends on {object:article}', makeCtx())).toBe('depends on the chiral ice belt')
  })

  it('substitutes {subject:lower} with lowercased displayName', () => {
    expect(resolveSlots('walks past {subject:lower}', makeCtx())).toBe('walks past orison hold')
  })

  it('uses fallback when qualifier is undefined', () => {
    expect(resolveSlots('contests {qualifier|the route asset}', makeCtx())).toBe('contests the route asset')
  })

  it('uses qualifier when defined and non-empty', () => {
    expect(resolveSlots('contests {qualifier|the route asset}', makeCtx({ qualifier: 'the quota' }))).toBe('contests the quota')
  })

  it('uses fallback when qualifier is empty string', () => {
    expect(resolveSlots('contests {qualifier|the route asset}', makeCtx({ qualifier: '' }))).toBe('contests the route asset')
  })

  it('returns empty string for unsupported {historical:*} slots in Phase 3', () => {
    expect(resolveSlots('after {historical:summary}', makeCtx())).toBe('after ')
    expect(resolveSlots('during {historical:era}', makeCtx())).toBe('during ')
  })

  it('throws on unknown slot name', () => {
    expect(() => resolveSlots('mystery {nonExistentSlot}', makeCtx()))
      .toThrow(/unknown slot/i)
  })

  it('handles multiple slots in the same template', () => {
    expect(resolveSlots('{subject} depends on {object:article}', makeCtx()))
      .toBe('Orison Hold depends on the chiral ice belt')
  })

  it('preserves text between slots verbatim', () => {
    expect(resolveSlots('— {subject}, in transit —', makeCtx())).toBe('— Orison Hold, in transit —')
  })
})
