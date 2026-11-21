import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AsteroidsEngine } from '../engine/AsteroidsEngine'

const HIGH_SCORE_KEY = 'asteroids_highscore'

function noOpContext(): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = {}
  const context: CanvasRenderingContext2D = new Proxy(target, {
    get: (store, property) => (property in store ? store[property] : () => context),
  }) as unknown as CanvasRenderingContext2D
  return context
}

let frames: FrameRequestCallback[] = []
let now = 0
let engine: AsteroidsEngine | undefined

function runFrame(ms = 16): void {
  now += ms
  const due = frames
  frames = []
  for (const callback of due) callback(now)
}

function press(code: string, key = code): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { code, key }))
}

function createEngine(): AsteroidsEngine {
  engine = new AsteroidsEngine(document.createElement('canvas'))
  return engine
}

describe('AsteroidsEngine browser adapter', () => {
  beforeEach(() => {
    frames = []
    now = 1000
    localStorage.clear()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => noOpContext())
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      frames = []
    })
  })

  afterEach(() => {
    engine?.destroy()
    engine = undefined
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts the Game on any non-modifier key in the menu and runs the frame loop', () => {
    const game = createEngine()

    press('ShiftLeft', 'Shift')
    expect(game.getSnapshot().gameStatus).toBe('menu')
    expect(frames).toHaveLength(0)

    press('KeyA', 'a')
    expect(game.getSnapshot().gameStatus).toBe('playing')
    runFrame()
    expect(frames).toHaveLength(1)
  })

  it('toggles Pause with Escape', () => {
    const game = createEngine()
    game.start()

    press('Escape')
    expect(game.getSnapshot().gameStatus).toBe('paused')
    press('Escape')
    expect(game.getSnapshot().gameStatus).toBe('playing')
  })

  it('notifies subscribers with snapshots', () => {
    const game = createEngine()
    const seen: string[] = []
    game.subscribe(() => seen.push(game.getSnapshot().gameStatus))

    game.start()
    game.pause()

    expect(seen).toEqual(['playing', 'paused'])
  })

  it('loads the High Score from storage and removes it when cleared', () => {
    localStorage.setItem(HIGH_SCORE_KEY, '500')
    const game = createEngine()
    expect(game.getSnapshot().highScore).toBe(500)

    game.clearHighScore()

    expect(game.getSnapshot().highScore).toBe(0)
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBeNull()
  })

  it('stops the loop and ignores input after destroy', () => {
    const game = createEngine()
    game.start()

    game.destroy()
    runFrame()
    press('Escape')
    game.restart()

    expect(frames).toHaveLength(0)
    expect(game.getSnapshot().gameStatus).toBe('playing')
  })
})
