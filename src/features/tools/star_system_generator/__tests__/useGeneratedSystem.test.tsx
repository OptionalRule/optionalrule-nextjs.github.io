import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGeneratedSystem } from '../hooks/useGeneratedSystem'
import { generateSystem } from '../lib/generator'
import { seedLinkFrom } from '../lib/seedUrl'
import type { GenerationOptions, GeneratorVersion } from '../types'

const options: GenerationOptions = {
  seed: 'hook-version',
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

describe('useGeneratedSystem', () => {
  it.each([2, 3] as GeneratorVersion[])('generates and stamps the decoded version %i', (version) => {
    const { result } = renderHook(() => useGeneratedSystem(options, version))
    expect(result.current.generatorVersion).toBe(version)
    expect(result.current).toEqual(generateSystem(options, { generatorVersion: version }))
  })

  it('regenerates when only the version changes', () => {
    const { result, rerender } = renderHook(({ version }) => useGeneratedSystem(options, version), {
      initialProps: { version: 2 as GeneratorVersion },
    })
    expect(result.current.generatorVersion).toBe(2)
    rerender({ version: 3 })
    expect(result.current.generatorVersion).toBe(3)
  })

  it('lets companion links inherit the version the system was generated under', () => {
    const { result } = renderHook(() => useGeneratedSystem(options, 2))
    expect(new URLSearchParams(seedLinkFrom(result.current, 'hook-version:c1')).get('v')).toBe('2')
  })
})
