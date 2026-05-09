'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { GeneratedSystem, OrbitingBody } from '../../types'

const Ctx = createContext<((id: string) => OrbitingBody | undefined) | null>(null)

export function BodyLookupProvider({ system, children }: { system: GeneratedSystem; children: ReactNode }) {
  const lookup = useMemo(() => {
    const map = new Map(system.bodies.map((b) => [b.id, b]))
    return (id: string) => map.get(id)
  }, [system])
  return <Ctx.Provider value={lookup}>{children}</Ctx.Provider>
}

export function useGeneratedBodyLookup(): (id: string) => OrbitingBody | undefined {
  const lookup = useContext(Ctx)
  if (!lookup) throw new Error('useGeneratedBodyLookup outside BodyLookupProvider')
  return lookup
}
