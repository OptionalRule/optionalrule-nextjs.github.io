"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQueryState, type QueryState } from './useQueryState'
import { getSaveEnabled as getPersistFlag, setSaveEnabled as setPersistFlag, readPersistedFilters, writePersistedFilters, clearPersistedFilters } from '../lib/persist'

export interface PersistenceCallbacks {
  onEnabled?: () => void
  onDisabled?: () => void
  onRestored?: () => void
}

export function usePersistentAlchemyState(callbacks: PersistenceCallbacks = {}) {
  const { onEnabled, onDisabled, onRestored } = callbacks
  const [qs, setQs] = useQueryState()
  const [saveEnabled, setSaveEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const hasSaved = Boolean(readPersistedFilters())
    return hasSaved ? true : getPersistFlag()
  })
  const hydrated = useRef(false)

  // Hydrate once before any writes
  useLayoutEffect(() => {
    if (hydrated.current) return
    const saved = readPersistedFilters()
    if (saved) {
      try { setPersistFlag(true) } catch {}
      const sp = new URLSearchParams(window.location.search)
      const patch: Partial<QueryState> = {}
      if (!sp.get('q') && saved.q !== undefined) patch.q = saved.q
      if (!sp.get('ingredients') && saved.ingredients) patch.ingredients = saved.ingredients.map(String)
      if (!sp.get('ingMode') && saved.ingMode) patch.ingMode = saved.ingMode
      if (!sp.get('alchLvl') && typeof saved.alchemyLevel === 'number') patch.alchLvl = saved.alchemyLevel
      if (Object.keys(patch).length) setQs(patch)
      onRestored?.()
    }
    hydrated.current = true
  }, [onRestored, setQs])

  // Write after hydration when enabled
  useLayoutEffect(() => {
    if (!hydrated.current) return
    setPersistFlag(saveEnabled)
    if (!saveEnabled) {
      clearPersistedFilters()
      return
    }
    writePersistedFilters({
      q: qs.q,
      ingredients: qs.ingredients,
      ingMode: qs.ingMode,
      alchemyLevel: qs.alchLvl ?? 0,
    })
  }, [saveEnabled, qs.q, qs.ingredients, qs.ingMode, qs.alchLvl])

  const setAlchemyLevel = useCallback((lvl: number) => setQs({ alchLvl: lvl }), [setQs])

  const api = useMemo(() => ({
    queryState: qs,
    setQueryState: setQs,
    alchemyLevel: qs.alchLvl ?? 0,
    setAlchemyLevel,
    saveEnabled,
    setSaveEnabled: (v: boolean) => {
      setSaveEnabled(v)
      if (v) onEnabled?.()
      else onDisabled?.()
    },
  }), [qs, setQs, saveEnabled, setAlchemyLevel, onEnabled, onDisabled])

  return api
}

