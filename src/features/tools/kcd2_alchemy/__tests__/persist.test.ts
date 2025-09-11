import { describe, it, expect, beforeEach } from 'vitest'
import { getSaveEnabled, setSaveEnabled, writePersistedFilters, readPersistedFilters, clearPersistedFilters } from '../lib/persist'

describe('local persistence utils', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('sets and gets saveEnabled flag', () => {
    expect(getSaveEnabled()).toBe(false)
    setSaveEnabled(true)
    expect(getSaveEnabled()).toBe(true)
    setSaveEnabled(false)
    expect(getSaveEnabled()).toBe(false)
  })

  it('writes and reads persisted filters', () => {
    const data = { q: 'mint', ingredients: ['mint', 'sage'], ingMode: 'only' as const, alchemyLevel: 12 }
    writePersistedFilters(data)
    const read = readPersistedFilters()
    expect(read).toEqual(data)
  })

  it('clears persisted filters', () => {
    writePersistedFilters({ q: 'x' })
    expect(readPersistedFilters()).toEqual({ q: 'x' })
    clearPersistedFilters()
    expect(readPersistedFilters()).toBeNull()
  })
})
