import { describe, expect, it, vi, beforeEach } from 'vitest'

import {
  clearTorchTrackerState,
  getTorchTrackerStorageKey,
  loadTorchTrackerState,
  persistTorchTrackerState,
} from '../lib/persistence'
import { createActiveSourceFromCatalog } from '../lib/catalog'
import { lightSourceCatalog } from '../data/lightSources'
import type { TorchTrackerState } from '../types'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

const buildState = (): TorchTrackerState => {
  const instance = createActiveSourceFromCatalog(lightSourceCatalog[0], {
    instanceId: 'persist-1',
    remainingSeconds: 540,
    status: 'active',
    isPaused: false,
  })

  return {
    catalog: lightSourceCatalog,
    active: [instance],
    settings: {
      isClockRunning: true,
      lastTickTimestamp: 1700000000000,
    },
    centralTimer: {
      isInitialized: true,
      totalSeconds: 600,
      remainingSeconds: 540,
      elapsedSeconds: 60,
    },
  }
}

describe('torch tracker persistence', () => {
  const storageKey = getTorchTrackerStorageKey()
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('saves and restores tracker state snapshots', () => {
    const state = buildState()
    persistTorchTrackerState(storage, state)

    const snapshot = loadTorchTrackerState(storage)
    expect(snapshot).not.toBeNull()
    expect(snapshot?.active).toHaveLength(1)
    expect(snapshot?.centralTimer.remainingSeconds).toBe(540)
    expect(snapshot?.settings.isClockRunning).toBe(true)
  })

  it('clears stored state when requested', () => {
    persistTorchTrackerState(storage, buildState())
    clearTorchTrackerState(storage)
    expect(storage.getItem(storageKey)).toBeNull()
  })

  it('handles corrupted payloads gracefully', () => {
    storage.setItem(storageKey, '{ invalid json')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const snapshot = loadTorchTrackerState(storage)
    expect(snapshot).toBeNull()
    expect(storage.getItem(storageKey)).toBeNull()
    warnSpy.mockRestore()
  })

  it('ignores unsupported schema versions', () => {
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 99,
        savedAt: Date.now(),
        state: {},
      }),
    )

    const snapshot = loadTorchTrackerState(storage)
    expect(snapshot).toBeNull()
    expect(storage.getItem(storageKey)).toBeNull()
  })

  it('swallows quota errors when persisting', () => {
    const erroringStorage: Storage = {
      get length() {
        return storage.length
      },
      clear: storage.clear.bind(storage),
      getItem: storage.getItem.bind(storage),
      key: storage.key.bind(storage),
      removeItem: storage.removeItem.bind(storage),
      setItem() {
        throw new Error('Quota exceeded')
      },
    }
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => persistTorchTrackerState(erroringStorage, buildState())).not.toThrow()

    warnSpy.mockRestore()
  })
})
