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
  effects: string[]
}

export function useQueryState(): [QueryState, (next: Partial<QueryState>) => void] {
  const [state, setLocalState] = useState<QueryState>(() => {
    if (typeof window === 'undefined') return { q: '', ingredients: [], effects: [] }
    const sp = new URLSearchParams(window.location.search)
    return {
      q: sp.get('q') ?? '',
      ingredients: parseList(sp.get('ingredients')),
      effects: parseList(sp.get('effects')),
    }
  })

  // Keep state in sync with browser back/forward navigation
  useEffect(() => {
    const handler = () => {
      const sp = new URLSearchParams(window.location.search)
      setLocalState({
        q: sp.get('q') ?? '',
        ingredients: parseList(sp.get('ingredients')),
        effects: parseList(sp.get('effects')),
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
    if (next.effects !== undefined) nextState.effects = next.effects

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
    if (next.effects !== undefined) {
      const v = toParamList(nextState.effects)
      if (v) sp.set('effects', v)
      else sp.delete('effects')
    }

    const query = sp.toString()
    const pathname = window.location.pathname // already has trailing slash
    const url = query ? `${pathname}?${query}` : pathname
    window.history.replaceState(null, '', url)

    setLocalState(nextState)
  }, [state])

  return [state, setState]
}
