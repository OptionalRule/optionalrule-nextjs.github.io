import type { GameState } from '../types'
import { GAMEPLAY, CONTROLS } from '../constants'
import { AsteroidsCore, type AsteroidsCoreOptions, type ShipControls } from './AsteroidsCore'
import { RenderSystem } from './systems/RenderSystem'
import { SoundSystem } from './systems/SoundSystem'

const PREVENTED_KEYS = new Set<string>([...Object.keys(CONTROLS), 'ArrowDown'])

const MENU_IGNORED_KEYS = new Set<string>(['Tab', 'Shift', 'Control', 'Alt', 'Meta'])

const HIGH_SCORE_KEY = 'asteroids_highscore'

function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    if (!stored || !/^\d+$/.test(stored)) return 0
    const parsed = Number(stored)
    return Number.isSafeInteger(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString())
  } catch {
    return
  }
}

function removeHighScore(): void {
  try {
    localStorage.removeItem(HIGH_SCORE_KEY)
  } catch {
    return
  }
}

function isBetweenGames(status: GameState['gameStatus']): boolean {
  return status === 'menu' || status === 'gameOver'
}

export class AsteroidsEngine {
  private readonly core: AsteroidsCore
  private readonly renderSystem: RenderSystem
  private readonly soundSystem: SoundSystem
  private readonly keys = new Set<string>()
  private readonly unsubscribeFromCore: () => void
  private savedHighScore: number
  private frame = 0
  private lastFrameTime = 0
  private destroyed = false
  private inputBlocked = false

  constructor(
    canvas: HTMLCanvasElement,
    createCore: (options: AsteroidsCoreOptions) => AsteroidsCore = options => new AsteroidsCore(options)
  ) {
    this.renderSystem = new RenderSystem(canvas)
    this.soundSystem = new SoundSystem()
    this.savedHighScore = loadHighScore()
    this.core = createCore({
      audio: this.soundSystem,
      highScore: this.savedHighScore,
      clock: () => performance.now(),
    })
    this.unsubscribeFromCore = this.core.subscribe(this.persistHighScore)

    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)

    this.render()
  }

  getSnapshot = (): GameState => this.core.getSnapshot()

  subscribe = (listener: () => void): (() => void) => this.core.subscribe(listener)

  start(): void {
    if (this.destroyed || this.core.getSnapshot().gameStatus !== 'menu') return
    this.core.start()
    this.runLoop()
  }

  pause(): void {
    if (this.destroyed) return
    this.core.pause()
  }

  resume(): void {
    if (this.destroyed || this.core.getSnapshot().gameStatus !== 'paused') return
    this.core.resume()
    this.lastFrameTime = performance.now()
  }

  restart(): void {
    if (this.destroyed) return
    this.keys.clear()
    this.core.restart()
    this.runLoop()
  }

  clearHighScore(): void {
    if (this.destroyed || !isBetweenGames(this.core.getSnapshot().gameStatus)) return
    this.core.clearHighScore()
    removeHighScore()
  }

  setInputBlocked(blocked: boolean): void {
    this.inputBlocked = blocked
    if (blocked) this.keys.clear()
  }

  destroy(): void {
    this.destroyed = true
    this.stopLoop()
    this.unsubscribeFromCore()
    this.soundSystem.destroy()
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    this.keys.clear()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.inputBlocked) return

    if (PREVENTED_KEYS.has(event.code)) {
      event.preventDefault()
    }

    const status = this.core.getSnapshot().gameStatus
    if (status === 'menu') {
      if (!MENU_IGNORED_KEYS.has(event.key)) {
        this.start()
      }
      return
    }

    this.keys.add(event.code)

    if (event.code === 'Enter' && status === 'gameOver') {
      this.restart()
    } else if (event.code === 'Escape') {
      this.togglePause()
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code)

    if (PREVENTED_KEYS.has(event.code)) {
      event.preventDefault()
    }
  }

  private persistHighScore = (): void => {
    const { highScore } = this.core.getSnapshot()
    if (highScore === this.savedHighScore) return

    if (highScore > 0) {
      saveHighScore(highScore)
    }
    this.savedHighScore = highScore
  }

  private togglePause(): void {
    if (this.core.getSnapshot().gameStatus === 'paused') {
      this.resume()
    } else {
      this.pause()
    }
  }

  private controls(): ShipControls {
    return {
      rotateLeft: this.keys.has('ArrowLeft'),
      rotateRight: this.keys.has('ArrowRight'),
      thrust: this.keys.has('ArrowUp'),
      fire: this.keys.has('Space'),
    }
  }

  private runLoop(): void {
    this.stopLoop()
    this.lastFrameTime = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  private stopLoop(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame)
      this.frame = 0
    }
  }

  private tick = (time: number): void => {
    const deltaTime = Math.min(time - this.lastFrameTime, GAMEPLAY.maxFrameDelta)
    this.lastFrameTime = time

    this.core.update(deltaTime, this.controls())
    this.render()

    if (!this.destroyed && this.core.getSnapshot().gameStatus !== 'gameOver') {
      this.frame = requestAnimationFrame(this.tick)
    } else {
      this.frame = 0
    }
  }

  private render(): void {
    const { gameStatus, score, lives, level, highScore, lastLevelBonus, extraLifeJustAwarded } = this.core.getSnapshot()
    const entities = this.core.getEntities()

    this.renderSystem.clear()

    if (gameStatus === 'gameOver') {
      this.renderSystem.drawGameOver(score, highScore)
      return
    }

    this.renderSystem.renderEntities(entities)
    if (gameStatus === 'menu') return

    this.renderSystem.drawHUD(score, lives, level)

    if (gameStatus === 'paused') {
      this.renderSystem.drawPauseScreen()
    } else if (gameStatus === 'loading') {
      this.renderSystem.drawLevelLoading(level, lastLevelBonus, extraLifeJustAwarded)
    }
  }
}
