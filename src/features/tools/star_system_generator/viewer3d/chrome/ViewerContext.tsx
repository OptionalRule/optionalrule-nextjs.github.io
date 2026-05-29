'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
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

export interface SelectionSlice {
  isSelected: boolean
  isHovered: boolean
}

interface SelectionActionsContextValue {
  select: (target: SelectionTarget | null) => void
  hover: (target: SelectionTarget | null) => void
}

interface ScaleModeContextValue {
  scaleMode: OrbitScaleMode
  setScaleMode: (mode: OrbitScaleMode) => void
}

// Selection/hover live in a tiny external store rather than React state so that a
// hover or selection change does NOT re-render the provider or every subscriber.
// Full-state consumers (one each: HoverTooltip, BodyDetailCard, CameraRig, the
// chrome panels) read the whole snapshot via useSelectionState; the many-instance
// consumers (Body, OverlayMarker) read only their own slice via useSelectionSlice
// and re-render solely when their own selected/hovered booleans flip.
interface SelectionStore {
  getSnapshot: () => SelectionStateContextValue
  subscribe: (listener: () => void) => () => void
  setSelection: (target: SelectionTarget | null) => void
  setHovered: (target: SelectionTarget | null) => void
}

function createSelectionStore(): SelectionStore {
  let snapshot: SelectionStateContextValue = { selection: null, hovered: null }
  const listeners = new Set<() => void>()
  const emit = () => {
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setSelection: (target) => {
      if (snapshot.selection === target) return
      snapshot = { selection: target, hovered: snapshot.hovered }
      emit()
    },
    setHovered: (target) => {
      if (snapshot.hovered === target) return
      snapshot = { selection: snapshot.selection, hovered: target }
      emit()
    },
  }
}

const LayersContext = createContext<LayersContextValue | null>(null)
const SelectionStoreContext = createContext<SelectionStore | null>(null)
const SelectionActionsContext = createContext<SelectionActionsContextValue | null>(null)
const MotionContext = createContext<boolean | null>(null)
const ScaleModeContext = createContext<ScaleModeContextValue | null>(null)

export function ViewerContextProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerVisibility>(ALL_LAYERS_ON)
  const [scaleMode, setScaleMode] = useState<OrbitScaleMode>('readable-log')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  // Lazy useState initializer creates the store exactly once and keeps a stable
  // reference for the provider's lifetime (no re-render on selection changes).
  const [selectionStore] = useState(createSelectionStore)

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
  const selectionActionsValue = useMemo<SelectionActionsContextValue>(
    () => ({ select: selectionStore.setSelection, hover: selectionStore.setHovered }),
    [selectionStore],
  )
  const scaleModeValue = useMemo<ScaleModeContextValue>(
    () => ({ scaleMode, setScaleMode }),
    [scaleMode],
  )

  return (
    <LayersContext.Provider value={layersValue}>
      <MotionContext.Provider value={prefersReducedMotion}>
        <ScaleModeContext.Provider value={scaleModeValue}>
          <SelectionStoreContext.Provider value={selectionStore}>
            <SelectionActionsContext.Provider value={selectionActionsValue}>
              {children}
            </SelectionActionsContext.Provider>
          </SelectionStoreContext.Provider>
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

function useSelectionStore(): SelectionStore {
  const store = useContext(SelectionStoreContext)
  if (!store) throw new Error('selection hooks used outside ViewerContextProvider')
  return store
}

export function useSelectionState(): SelectionStateContextValue {
  const store = useSelectionStore()
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

// Subscribes only to whether (kind, id) is the selected and/or hovered target.
// The cached slice keeps a stable reference while those two booleans are unchanged,
// so useSyncExternalStore skips re-rendering this consumer on unrelated hovers.
export function useSelectionSlice(kind: NonNullable<SelectionKind>, id: string): SelectionSlice {
  const store = useSelectionStore()
  const cacheRef = useRef<SelectionSlice | null>(null)
  const getSlice = useCallback(() => {
    const snap = store.getSnapshot()
    const isSelected = snap.selection?.kind === kind && snap.selection.id === id
    const isHovered = snap.hovered?.kind === kind && snap.hovered.id === id
    const cached = cacheRef.current
    if (cached && cached.isSelected === isSelected && cached.isHovered === isHovered) {
      return cached
    }
    const next: SelectionSlice = { isSelected, isHovered }
    cacheRef.current = next
    return next
  }, [store, kind, id])
  return useSyncExternalStore(store.subscribe, getSlice, getSlice)
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
