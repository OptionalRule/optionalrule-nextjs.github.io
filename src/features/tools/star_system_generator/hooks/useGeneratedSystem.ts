'use client'

import { useMemo } from 'react'
import type { GenerationOptions, GeneratorVersion } from '../types'
import { generateSystem } from '../lib/generator'

export function useGeneratedSystem(options: GenerationOptions, generatorVersion: GeneratorVersion) {
  return useMemo(() => generateSystem(options, { generatorVersion }), [options, generatorVersion])
}
