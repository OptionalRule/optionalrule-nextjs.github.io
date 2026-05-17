'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LayerVisibility, OrbitScaleMode } from '../types'
import { ALL_LAYERS_ON } from '../types'

export type SelectionKind = 'body' | 'moon' | 'settlement' | 'gate' | 'star' | 'hazard' | 'gu-bleed' | 'phenomenon' | 'ruin' | 'debris' | null

export interface SelectionTarget {
  kind: NonNullable<SelectionKind>
  id: string
}

interface LayersContextValue {
  layers: LayerVisibility
  toggleLayer: (k: keyof LayerVisibility) => void
}

interface SelectionStateContextValue {
  selection: SelectionTarget | null
  hovered: SelectionTarget | null
}

interface SelectionActionsContextValue {
  select: (target: SelectionTarget | null) => void
  hover: (target: SelectionTarget | null) => void
}

interface ScaleModeContextValue {
  scaleMode: OrbitScaleMode
  setScaleMode: (mode: OrbitScaleMode) => void
}

const LayersContext = createContext<LayersContextValue | null>(null)
const SelectionStateContext = createContext<SelectionStateContextValue | null>(null)
const SelectionActionsContext = createContext<SelectionActionsContextValue | null>(null)
const MotionContext = createContext<boolean | null>(null)
const ScaleModeContext = createContext<ScaleModeContextValue | null>(null)

export function ViewerContextProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerVisibility>(ALL_LAYERS_ON)
  const [scaleMode, setScaleMode] = useState<OrbitScaleMode>('readable-log')
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

  const layersValue = useMemo<LayersContextValue>(
    () => ({ layers, toggleLayer: (k) => setLayers((prev) => ({ ...prev, [k]: !prev[k] })) }),
    [layers],
  )
  const selectionStateValue = useMemo<SelectionStateContextValue>(
    () => ({ selection, hovered }),
    [selection, hovered],
  )
  const selectionActionsValue = useMemo<SelectionActionsContextValue>(
    () => ({ select: setSelection, hover: setHovered }),
    [],
  )
  const scaleModeValue = useMemo<ScaleModeContextValue>(
    () => ({ scaleMode, setScaleMode }),
    [scaleMode],
  )

  return (
    <LayersContext.Provider value={layersValue}>
      <MotionContext.Provider value={prefersReducedMotion}>
        <ScaleModeContext.Provider value={scaleModeValue}>
          <SelectionStateContext.Provider value={selectionStateValue}>
            <SelectionActionsContext.Provider value={selectionActionsValue}>
              {children}
            </SelectionActionsContext.Provider>
          </SelectionStateContext.Provider>
        </ScaleModeContext.Provider>
      </MotionContext.Provider>
    </LayersContext.Provider>
  )
}

export function useLayers(): LayersContextValue {
  const ctx = useContext(LayersContext)
  if (!ctx) throw new Error('useLayers used outside ViewerContextProvider')
  return ctx
}

export function useSelectionState(): SelectionStateContextValue {
  const ctx = useContext(SelectionStateContext)
  if (!ctx) throw new Error('useSelectionState used outside ViewerContextProvider')
  return ctx
}

export function useSelectionActions(): SelectionActionsContextValue {
  const ctx = useContext(SelectionActionsContext)
  if (!ctx) throw new Error('useSelectionActions used outside ViewerContextProvider')
  return ctx
}

export function usePrefersReducedMotion(): boolean {
  const ctx = useContext(MotionContext)
  if (ctx === null) throw new Error('usePrefersReducedMotion used outside ViewerContextProvider')
  return ctx
}

export function useScaleMode(): ScaleModeContextValue {
  const ctx = useContext(ScaleModeContext)
  if (!ctx) throw new Error('useScaleMode used outside ViewerContextProvider')
  return ctx
}
