'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LayerVisibility } from '../types'
import { ALL_LAYERS_ON } from '../types'

export type SelectionKind = 'body' | 'moon' | 'settlement' | 'star' | 'hazard' | 'gu-bleed' | 'phenomenon' | null

export interface SelectionTarget {
  kind: NonNullable<SelectionKind>
  id: string
}

export interface ViewerContextValue {
  layers: LayerVisibility
  toggleLayer: (k: keyof LayerVisibility) => void
  selection: SelectionTarget | null
  select: (target: SelectionTarget | null) => void
  hovered: SelectionTarget | null
  hover: (target: SelectionTarget | null) => void
  prefersReducedMotion: boolean
}

const ViewerContext = createContext<ViewerContextValue | null>(null)

export function ViewerContextProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerVisibility>(ALL_LAYERS_ON)
  const [selection, setSelection] = useState<SelectionTarget | null>(null)
  const [hovered, setHovered] = useState<SelectionTarget | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const value = useMemo<ViewerContextValue>(
    () => ({
      layers,
      toggleLayer: (k) => setLayers((prev) => ({ ...prev, [k]: !prev[k] })),
      selection,
      select: setSelection,
      hovered,
      hover: setHovered,
      prefersReducedMotion,
    }),
    [layers, selection, hovered, prefersReducedMotion],
  )

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}

export function useViewerContext(): ViewerContextValue {
  const ctx = useContext(ViewerContext)
  if (!ctx) throw new Error('useViewerContext used outside ViewerContextProvider')
  return ctx
}
