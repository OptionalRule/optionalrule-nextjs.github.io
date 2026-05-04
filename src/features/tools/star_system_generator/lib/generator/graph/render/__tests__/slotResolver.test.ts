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

describe('resolveSlots with per-slot expects', () => {
  it('reshapes nounPhrase slots — strips leading "the" before applying :article', () => {
    const ctx = makeCtx({
      object: { kind: 'guResource', id: 'gu', displayName: 'the chiral ice belt', layer: 'gu' },
    })
    expect(resolveSlots('depends on {object:article}', ctx, { object: 'nounPhrase' }))
      .toBe('depends on the chiral ice belt')
  })

  it('reshapes nounPhrase slots — strips trailing punctuation before substitution', () => {
    const ctx = makeCtx({
      qualifier: 'the dispute,',
    })
    expect(resolveSlots('over {qualifier|fallback}', ctx, { qualifier: 'nounPhrase' }))
      .toBe('over dispute')
  })

  it('preserves properNoun shape (default) when expects undeclared', () => {
    const ctx = makeCtx()
    expect(resolveSlots('{subject}', ctx)).toBe('Orison Hold')
  })

  it('preserves properNoun shape (default) when slot is missing from expects', () => {
    const ctx = makeCtx()
    expect(resolveSlots('{subject}', ctx, { object: 'nounPhrase' })).toBe('Orison Hold')
  })

  it('reshape composes idempotently with :article and :lower', () => {
    const ctx = makeCtx({
      subject: { kind: 'phenomenon', id: 'p', displayName: 'a flare-amplified bleed season', layer: 'gu' },
    })
    expect(resolveSlots('{subject:article}', ctx, { subject: 'nounPhrase' }))
      .toBe('the flare-amplified bleed season')
  })

  it('does NOT strip "the " when shape is properNoun', () => {
    const ctx = makeCtx({
      subject: { kind: 'namedFaction', id: 'f', displayName: 'The Pale Choir Communion', layer: 'human' },
    })
    expect(resolveSlots('{subject}', ctx, { subject: 'properNoun' }))
      .toBe('The Pale Choir Communion')
  })
})

describe('resolveSlots historical slots', () => {
  it('resolves {historical:summary} from ctx.historical.summary', () => {
    const ctx = makeCtx({
      historical: { summary: 'the second-wave terraforming failure' },
    })
    expect(resolveSlots('after {historical:summary}', ctx))
      .toBe('after the second-wave terraforming failure')
  })

  it('resolves {historical:era} from ctx.historical.era', () => {
    const ctx = makeCtx({
      historical: { era: 'the second wave' },
    })
    expect(resolveSlots('during {historical:era}', ctx))
      .toBe('during the second wave')
  })

  it('uses fallback when historical context is absent', () => {
    const ctx = makeCtx()
    expect(resolveSlots('during {historical:era|an unrecorded era}', ctx))
      .toBe('during an unrecorded era')
  })

  it('returns empty string when historical context is absent and no fallback', () => {
    const ctx = makeCtx()
    expect(resolveSlots('during {historical:era}', ctx)).toBe('during ')
  })

  it('strips trailing punctuation from {historical:summary}', () => {
    const ctx = makeCtx({
      historical: { summary: 'the breach of compact,' },
    })
    expect(resolveSlots('after {historical:summary}', ctx))
      .toBe('after the breach of compact')
  })

  it('does NOT strip "the " from {historical:era} (era shape)', () => {
    const ctx = makeCtx({
      historical: { era: 'the first wave' },
    })
    expect(resolveSlots('during {historical:era}', ctx))
      .toBe('during the first wave')
  })
})
