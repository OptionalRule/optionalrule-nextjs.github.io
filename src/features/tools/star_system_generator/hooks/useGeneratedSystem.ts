'use client'

import { useMemo } from 'react'
import type { GenerationOptions } from '../types'
import { generateSystem } from '../lib/generator'

export function useGeneratedSystem(options: GenerationOptions) {
  return useMemo(() => generateSystem(options), [options])
}
