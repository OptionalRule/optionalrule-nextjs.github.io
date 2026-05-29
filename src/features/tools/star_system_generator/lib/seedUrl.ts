import type { GenerationOptions } from '../types'

export const OPTION_DEFAULTS: Omit<GenerationOptions, 'seed' | 'graphAware'> = {
  distribution: 'frontier',
  tone: 'balanced',
  gu: 'normal',
  settlements: 'normal',
}

export function buildSeedParams(options: GenerationOptions): URLSearchParams {
  const params = new URLSearchParams()
  params.set('seed', options.seed)
  if (options.distribution !== OPTION_DEFAULTS.distribution) params.set('distribution', options.distribution)
  if (options.tone !== OPTION_DEFAULTS.tone) params.set('tone', options.tone)
  if (options.gu !== OPTION_DEFAULTS.gu) params.set('gu', options.gu)
  if (options.settlements !== OPTION_DEFAULTS.settlements) params.set('settlements', options.settlements)
  return params
}

export function buildSeedHref(seed: string): string {
  if (typeof window === 'undefined') return `?seed=${encodeURIComponent(seed)}`
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed)
  return `${url.pathname}${url.search}`
}
