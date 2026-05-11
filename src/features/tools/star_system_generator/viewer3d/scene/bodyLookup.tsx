'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type {
  Gate,
  GeneratedSystem,
  HumanRemnant,
  OrbitingBody,
  Settlement,
  SystemPhenomenon,
} from '../../types'

interface SystemLookups {
  body: (id: string) => OrbitingBody | undefined
  settlement: (id: string) => Settlement | undefined
  gate: (id: string) => Gate | undefined
  ruin: (id: string) => HumanRemnant | undefined
  phenomenon: (id: string) => SystemPhenomenon | undefined
  settlementsByBody: (bodyId: string) => readonly Settlement[]
  gatesByBody: (bodyId: string) => readonly Gate[]
  settlementsByMoon: (moonId: string) => readonly Settlement[]
  gatesByMoon: (moonId: string) => readonly Gate[]
}

const Ctx = createContext<SystemLookups | null>(null)

export function BodyLookupProvider({ system, children }: { system: GeneratedSystem; children: ReactNode }) {
  const lookups = useMemo<SystemLookups>(() => {
    const bodyMap = new Map(system.bodies.map((b) => [b.id, b]))
    const settlementMap = new Map(system.settlements.map((s) => [s.id, s]))
    const gateMap = new Map(system.gates.map((g) => [g.id, g]))
    const ruinMap = new Map(system.ruins.map((r) => [r.id, r]))
    const phenomenonMap = new Map(system.phenomena.map((p) => [p.id, p]))
    const settlementsByBody = new Map<string, Settlement[]>()
    const settlementsByMoon = new Map<string, Settlement[]>()
    for (const s of system.settlements) {
      if (s.moonId) {
        const list = settlementsByMoon.get(s.moonId)
        if (list) list.push(s)
        else settlementsByMoon.set(s.moonId, [s])
      } else if (s.bodyId) {
        const list = settlementsByBody.get(s.bodyId)
        if (list) list.push(s)
        else settlementsByBody.set(s.bodyId, [s])
      }
    }
    const gatesByBody = new Map<string, Gate[]>()
    const gatesByMoon = new Map<string, Gate[]>()
    for (const g of system.gates) {
      if (g.moonId) {
        const list = gatesByMoon.get(g.moonId)
        if (list) list.push(g)
        else gatesByMoon.set(g.moonId, [g])
      } else if (g.bodyId) {
        const list = gatesByBody.get(g.bodyId)
        if (list) list.push(g)
        else gatesByBody.set(g.bodyId, [g])
      }
    }
    return {
      body: (id) => bodyMap.get(id),
      settlement: (id) => settlementMap.get(id),
      gate: (id) => gateMap.get(id),
      ruin: (id) => ruinMap.get(id),
      phenomenon: (id) => phenomenonMap.get(id),
      settlementsByBody: (bodyId) => settlementsByBody.get(bodyId) ?? [],
      gatesByBody: (bodyId) => gatesByBody.get(bodyId) ?? [],
      settlementsByMoon: (moonId) => settlementsByMoon.get(moonId) ?? [],
      gatesByMoon: (moonId) => gatesByMoon.get(moonId) ?? [],
    }
  }, [system])
  return <Ctx.Provider value={lookups}>{children}</Ctx.Provider>
}

function useLookups(): SystemLookups {
  const lookups = useContext(Ctx)
  if (!lookups) throw new Error('Lookups used outside BodyLookupProvider')
  return lookups
}

export function useGeneratedBodyLookup(): (id: string) => OrbitingBody | undefined {
  return useLookups().body
}

export function useSettlementLookup(): (id: string) => Settlement | undefined {
  return useLookups().settlement
}

export function useSettlementsForBody(): (bodyId: string) => readonly Settlement[] {
  return useLookups().settlementsByBody
}

export function useGateLookup(): (id: string) => Gate | undefined {
  return useLookups().gate
}

export function useGatesForBody(): (bodyId: string) => readonly Gate[] {
  return useLookups().gatesByBody
}

export function useSettlementsForMoon(): (moonId: string) => readonly Settlement[] {
  return useLookups().settlementsByMoon
}

export function useGatesForMoon(): (moonId: string) => readonly Gate[] {
  return useLookups().gatesByMoon
}

export function useRuinLookup(): (id: string) => HumanRemnant | undefined {
  return useLookups().ruin
}

export function usePhenomenonLookup(): (id: string) => SystemPhenomenon | undefined {
  return useLookups().phenomenon
}
