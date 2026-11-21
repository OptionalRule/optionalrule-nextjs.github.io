'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GenerationOptions, GeneratorVersion } from '../types'
import { GENERATOR_VERSION } from '../lib/generator'
import { createRandomSeed, normalizeSeed } from '../lib/generator/rng'
import { OPTION_DEFAULTS, buildSeedLink, decodeSeedLink, sameGenerationOptions } from '../lib/seedUrl'
import type { SeedLink } from '../lib/seedUrl'

function readLinkFromLocation(): SeedLink {
  if (typeof window === 'undefined') {
    return { options: { seed: '0000000000000000', ...OPTION_DEFAULTS }, generatorVersion: GENERATOR_VERSION }
  }
  return decodeSeedLink(window.location.search)
}

function writeLinkToUrl(link: SeedLink): void {
  if (typeof window === 'undefined') return

  const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`
  const nextUrl = `${pathname}${buildSeedLink(link)}`
  const currentUrl = `${window.location.pathname}${window.location.search}`
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl)
  }
}

export function useGeneratorQueryState(): [
  GenerationOptions,
  (next: Partial<GenerationOptions>) => void,
  GeneratorVersion,
] {
  const [link, setLink] = useState<SeedLink>(() => readLinkFromLocation())

  useEffect(() => {
    writeLinkToUrl(link)
  }, [link])

  useEffect(() => {
    const handler = () => setLink(readLinkFromLocation())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const setQueryState = useCallback((next: Partial<GenerationOptions>) => {
    setLink((current) => {
      const candidate: GenerationOptions = {
        ...current.options,
        ...next,
        seed: next.seed !== undefined ? normalizeSeed(next.seed) : current.options.seed,
      }
      if (sameGenerationOptions(candidate, current.options)) {
        return current
      }
      return { options: candidate, generatorVersion: GENERATOR_VERSION }
    })
  }, [])

  return [link.options, setQueryState, link.generatorVersion]
}

export function createNextRandomOptions(current: GenerationOptions): GenerationOptions {
  return { ...current, seed: createRandomSeed() }
}
