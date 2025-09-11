'use client'

import { useCallback, useEffect, useState } from 'react'

function parseList(value: string | null): string[] {
  if (!value) return []
  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

function toParamList(values: Array<string | number>): string | null {
  const arr = values.map(String).filter(Boolean)
  return arr.length ? arr.join(',') : null
}

export interface QueryState {
  q: string
  ingredients: string[]
  ingMode: 'any' | 'only'
  alchLvl: number
}

export function useQueryState(): [QueryState, (next: Partial<QueryState>) => void] {
  const [state, setLocalState] = useState<QueryState>(() => {
    if (typeof window === 'undefined') return { q: '', ingredients: [], ingMode: 'any', alchLvl: 0 }
    const sp = new URLSearchParams(window.location.search)
    return {
      q: sp.get('q') ?? '',
      ingredients: parseList(sp.get('ingredients')),
      // Back-compat: treat legacy 'all' as new 'only'
      ingMode: (sp.get('ingMode') === 'only' || sp.get('ingMode') === 'all') ? 'only' : 'any',
      alchLvl: (() => {
        const v = sp.get('alchLvl')
        const n = v ? Number(v) : 0
        return Number.isFinite(n) ? n : 0
      })(),
    }
  })

  // Keep state in sync with browser back/forward navigation
  useEffect(() => {
    const handler = () => {
      const sp = new URLSearchParams(window.location.search)
      setLocalState({
        q: sp.get('q') ?? '',
        ingredients: parseList(sp.get('ingredients')),
        ingMode: (sp.get('ingMode') === 'only' || sp.get('ingMode') === 'all') ? 'only' : 'any',
        alchLvl: (() => {
          const v = sp.get('alchLvl')
          const n = v ? Number(v) : 0
          return Number.isFinite(n) ? n : 0
        })(),
      })
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const setState = useCallback((next: Partial<QueryState>) => {
    const sp = new URLSearchParams(window.location.search)
    const nextState: QueryState = { ...state }
    if (next.q !== undefined) nextState.q = next.q
    if (next.ingredients !== undefined) nextState.ingredients = next.ingredients
    if (next.ingMode !== undefined) nextState.ingMode = next.ingMode
    if (next.alchLvl !== undefined) nextState.alchLvl = next.alchLvl

    // Short-circuit if no effective state change to avoid URL churn
    const sameState =
      (next.q === undefined || next.q === state.q) &&
      (next.ingredients === undefined || (Array.isArray(next.ingredients) && Array.isArray(state.ingredients) && next.ingredients.join(',') === state.ingredients.join(','))) &&
      (next.ingMode === undefined || next.ingMode === state.ingMode) &&
      (next.alchLvl === undefined || next.alchLvl === state.alchLvl)
    
    // Build prospective query string to compare with current
    const tmp = new URLSearchParams(window.location.search)
    if (next.q !== undefined) {
      const v = nextState.q.trim()
      if (v) tmp.set('q', v); else tmp.delete('q')
    }
    if (next.ingredients !== undefined) {
      const v = toParamList(nextState.ingredients)
      if (v) tmp.set('ingredients', v); else tmp.delete('ingredients')
    }
    if (next.ingMode !== undefined) {
      const v = nextState.ingMode
      if (v && v !== 'any') tmp.set('ingMode', v); else tmp.delete('ingMode')
    }
    if (next.alchLvl !== undefined) {
      const n = Number(nextState.alchLvl) || 0
      if (n > 0) tmp.set('alchLvl', String(n)); else tmp.delete('alchLvl')
    }
    const currentQuery = window.location.search.replace(/^\?/, '')
    const nextQuery = tmp.toString()

    if (sameState && currentQuery === nextQuery) {
      return
    }

    // Update URL params
    if (next.q !== undefined) {
      if (nextState.q.trim()) sp.set('q', nextState.q.trim())
      else sp.delete('q')
    }
    if (next.ingredients !== undefined) {
      const v = toParamList(nextState.ingredients)
      if (v) sp.set('ingredients', v)
      else sp.delete('ingredients')
    }
    if (next.ingMode !== undefined) {
      const v = nextState.ingMode
      if (v && v !== 'any') sp.set('ingMode', v)
      else sp.delete('ingMode')
    }
    if (next.alchLvl !== undefined) {
      const n = Number(nextState.alchLvl) || 0
      if (n > 0) sp.set('alchLvl', String(n))
      else sp.delete('alchLvl')
    }

    const query = sp.toString()
    const pathname = window.location.pathname // already has trailing slash
    const url = query ? `${pathname}?${query}` : pathname
    window.history.replaceState(null, '', url)

    setLocalState(nextState)
  }, [state])

  return [state, setState]
}
