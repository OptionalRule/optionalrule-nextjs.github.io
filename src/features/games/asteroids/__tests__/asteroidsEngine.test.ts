import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AsteroidsEngine } from '../engine/AsteroidsEngine'
import { AsteroidsCore } from '../engine/AsteroidsCore'
import { Asteroid } from '../engine/entities/Asteroid'
import { Ship } from '../engine/entities/Ship'
import { stubCanvasContext } from '@/test-utils/canvas'

const HIGH_SCORE_KEY = 'asteroids_highscore'

let frames: FrameRequestCallback[] = []
let now = 0
let engine: AsteroidsEngine | undefined
let core: AsteroidsCore

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
  engine = new AsteroidsEngine(document.createElement('canvas'), options => {
    core = new AsteroidsCore(options)
    return core
  })
  return engine
}

function release(code: string): void {
  document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code }))
}

function asteroids(): Asteroid[] {
  return core.getEntities().filter((entity): entity is Asteroid => entity instanceof Asteroid && entity.getActive())
}

function ship(): Ship {
  const found = core.getEntities().find((entity): entity is Ship => entity instanceof Ship)
  if (!found) throw new Error('no ship')
  return found
}

function parkAsteroids(): void {
  for (const asteroid of asteroids()) {
    asteroid.setPosition({ x: 40, y: 40 })
    asteroid.setVelocity({ x: 0, y: 0 })
  }
}

function clearLevel(): void {
  for (const asteroid of asteroids()) asteroid.destroy()
  runFrame()
}

function loseLife(): void {
  while (!ship().getCanCollide()) {
    parkAsteroids()
    runFrame(50)
  }
  const [asteroid] = asteroids()
  asteroid.setPosition(ship().getPosition())
  runFrame()
}

describe('AsteroidsEngine browser adapter', () => {
  beforeEach(() => {
    frames = []
    now = 1000
    localStorage.clear()
    stubCanvasContext()
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

  it('ignores game keys while input is blocked', () => {
    const game = createEngine()

    game.setInputBlocked(true)
    press('Escape')
    press('Enter')
    press('KeyA', 'a')
    expect(game.getSnapshot().gameStatus).toBe('menu')
    expect(frames).toHaveLength(0)

    game.setInputBlocked(false)
    press('KeyA', 'a')
    expect(game.getSnapshot().gameStatus).toBe('playing')
  })

  it('drops held keys when input is blocked', () => {
    const game = createEngine()
    game.start()
    parkAsteroids()

    press('ArrowUp')
    game.setInputBlocked(true)
    runFrame()

    expect(ship().getVelocity()).toEqual({ x: 0, y: 0 })
  })

  it('keeps the High Score when a clear arrives mid-Game', () => {
    localStorage.setItem(HIGH_SCORE_KEY, '500')
    const game = createEngine()
    game.start()

    game.clearHighScore()

    expect(game.getSnapshot().highScore).toBe(500)
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('500')
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

  it('drives the Ship from held keys', () => {
    const game = createEngine()
    game.start()
    parkAsteroids()

    press('ArrowUp')
    runFrame()
    expect(ship().getVelocity().y).toBeLessThan(0)

    release('ArrowUp')
    const rotation = ship().getRotation()
    press('ArrowRight')
    runFrame()
    expect(ship().getRotation()).toBeGreaterThan(rotation)
  })

  it('restarts with Enter only after Game Over', () => {
    const game = createEngine()
    game.start()
    clearLevel()
    press('Enter')
    expect(game.getSnapshot()).toMatchObject({ gameStatus: 'loading', score: 100 })

    while (game.getSnapshot().gameStatus !== 'gameOver') {
      parkAsteroids()
      runFrame(50)
      if (game.getSnapshot().gameStatus === 'playing') loseLife()
    }
    expect(frames).toHaveLength(0)

    press('Enter')
    expect(game.getSnapshot()).toMatchObject({ gameStatus: 'playing', score: 0, level: 1 })
    expect(frames).toHaveLength(1)
  })

  it('saves a beaten High Score, including a lower one after a clear', () => {
    localStorage.setItem(HIGH_SCORE_KEY, '5000')
    const game = createEngine()
    game.clearHighScore()

    game.start()
    clearLevel()

    expect(game.getSnapshot().highScore).toBe(100)
    expect(localStorage.getItem(HIGH_SCORE_KEY)).toBe('100')
  })

  it('stops the loop and ignores input after destroy', () => {
    const game = createEngine()
    game.start()

    const removed = vi.spyOn(document, 'removeEventListener')
    game.destroy()
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['keydown', 'keyup']))
    runFrame()
    press('Escape')
    game.restart()

    expect(frames).toHaveLength(0)
    expect(game.getSnapshot().gameStatus).toBe('playing')
  })
})
