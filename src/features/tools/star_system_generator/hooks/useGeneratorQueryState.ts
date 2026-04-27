'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GenerationOptions, GeneratorDistribution, GeneratorTone, GuPreference, SettlementDensity } from '../types'
import { createRandomSeed, normalizeSeed } from '../lib/generator/rng'

const defaultOptions: Omit<GenerationOptions, 'seed'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

function parseDistribution(value: string | null): GeneratorDistribution {
  return value === 'realistic' ? 'realistic' : 'frontier'
}

function parseTone(value: string | null): GeneratorTone {
  if (value === 'astronomy' || value === 'cinematic') return value
  return 'balanced'
}

function parseGu(value: string | null): GuPreference {
  if (value === 'low' || value === 'high' || value === 'fracture') return value
  return 'normal'
}

function parseSettlements(value: string | null): SettlementDensity {
  if (value === 'sparse' || value === 'crowded' || value === 'hub') return value
  return 'normal'
}

function readOptionsFromLocation(): GenerationOptions {
  if (typeof window === 'undefined') {
    return { seed: '0000000000000000', ...defaultOptions }
  }

  const params = new URLSearchParams(window.location.search)
  return {
    seed: normalizeSeed(params.get('seed')),
    distribution: parseDistribution(params.get('distribution')),
    tone: parseTone(params.get('tone')),
    gu: parseGu(params.get('gu')),
    settlements: parseSettlements(params.get('settlements')),
  }
}

function writeOptionsToUrl(options: GenerationOptions): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams()
  params.set('seed', options.seed)
  if (options.distribution !== defaultOptions.distribution) params.set('distribution', options.distribution)
  if (options.tone !== defaultOptions.tone) params.set('tone', options.tone)
  if (options.gu !== defaultOptions.gu) params.set('gu', options.gu)
  if (options.settlements !== defaultOptions.settlements) params.set('settlements', options.settlements)

  const query = params.toString()
  const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`
  const nextUrl = `${pathname}?${query}`
  const currentUrl = `${window.location.pathname}${window.location.search}`
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl)
  }
}

export function useGeneratorQueryState(): [GenerationOptions, (next: Partial<GenerationOptions>) => void] {
  const [options, setOptions] = useState<GenerationOptions>(() => readOptionsFromLocation())

  useEffect(() => {
    writeOptionsToUrl(options)
  }, [options])

  useEffect(() => {
    const handler = () => setOptions(readOptionsFromLocation())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const setQueryState = useCallback((next: Partial<GenerationOptions>) => {
    setOptions((current) => {
      return {
        ...current,
        ...next,
        seed: next.seed !== undefined ? normalizeSeed(next.seed) : current.seed,
      }
    })
  }, [])

  return [options, setQueryState]
}

export function createNextRandomOptions(current: GenerationOptions): GenerationOptions {
  return { ...current, seed: createRandomSeed() }
}
