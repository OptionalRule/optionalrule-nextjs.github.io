import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { buildSeedHref } from '../lib/seedUrl'

describe('buildSeedHref', () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/tools/star_system_generator/?seed=abc&distribution=realistic&gu=fracture'),
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('preserves non-seed query params when swapping the seed', () => {
    const href = buildSeedHref('foo:c1')
    expect(href).toContain('seed=foo%3Ac1')
    expect(href).toContain('distribution=realistic')
    expect(href).toContain('gu=fracture')
  })

  it('encodes the seed value', () => {
    const href = buildSeedHref('foo:c1')
    expect(href).toContain('seed=foo%3Ac1')
  })
})
