'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { GeneratedSystem, OrbitingBody } from '../../types'

const Ctx = createContext<((id: string) => OrbitingBody | undefined) | null>(null)

export function BodyLookupProvider({ system, children }: { system: GeneratedSystem; children: ReactNode }) {
  const lookup = (id: string) => system.bodies.find((b) => b.id === id)
  return <Ctx.Provider value={lookup}>{children}</Ctx.Provider>
}

export function useGeneratedBodyLookup(): (id: string) => OrbitingBody | undefined {
  const lookup = useContext(Ctx)
  if (!lookup) throw new Error('useGeneratedBodyLookup outside BodyLookupProvider')
  return lookup
}
