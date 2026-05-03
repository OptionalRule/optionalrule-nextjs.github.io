import { describe, expect, it } from 'vitest'
import { connectiveFor } from '../connectives'

describe('connectiveFor', () => {
  it('returns a connective for known edge-type pairs', () => {
    expect(connectiveFor('CONTESTS', 'DESTABILIZES')).toBe('Meanwhile, ')
    expect(connectiveFor('DEPENDS_ON', 'DESTABILIZES')).toBe('And ')
  })

  it('returns empty string when prev is undefined (first sentence in a paragraph)', () => {
    expect(connectiveFor(undefined, 'HOSTS')).toBe('')
  })

  it('returns empty string for unknown pairs (default fallback)', () => {
    expect(connectiveFor('HOSTS', 'WITNESSES')).toBe('')
  })

  it('is fully deterministic', () => {
    expect(connectiveFor('CONTESTS', 'DESTABILIZES')).toBe(connectiveFor('CONTESTS', 'DESTABILIZES'))
  })
})
