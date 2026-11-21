import { describe, it, expect } from 'vitest'
import { AsteroidsCore, type GameAudio, type ShipControls } from '../engine/AsteroidsCore'
import { Asteroid } from '../engine/entities/Asteroid'
import { Bullet } from '../engine/entities/Bullet'
import { Saucer } from '../engine/entities/Saucer'
import { Ship } from '../engine/entities/Ship'
import { AsteroidSize } from '../types'
import { GAME_CONFIG, GAMEPLAY } from '../constants'

const FRAME = 16
const IDLE: ShipControls = { rotateLeft: false, rotateRight: false, thrust: false, fire: false }
const FIRE: ShipControls = { ...IDLE, fire: true }
const CENTER = { x: GAME_CONFIG.canvas.width / 2, y: GAME_CONFIG.canvas.height / 2 }
const PARKED = { x: 40, y: 40 }

class RecordingAudio implements GameAudio {
  calls: string[] = []

  async playSound(key: string): Promise<void> {
    this.calls.push(`play:${key}`)
  }

  stopSound(key: string): void {
    this.calls.push(`stop:${key}`)
  }

  pauseCategory(category: string): void {
    this.calls.push(`pause:${category}`)
  }

  resumeCategory(category: string): void {
    this.calls.push(`resume:${category}`)
  }

  stopAllSounds(): void {
    this.calls.push('stopAll')
  }
}

interface Harness {
  core: AsteroidsCore
  audio: RecordingAudio
  clock: { now: number }
}

function createCore(highScore = 0): Harness {
  const audio = new RecordingAudio()
  const clock = { now: GAME_CONFIG.bullets.cooldown }
  const core = new AsteroidsCore({ audio, highScore, clock: () => clock.now })
  return { core, audio, clock }
}

function asteroids(core: AsteroidsCore): Asteroid[] {
  return core.getEntities().filter((entity): entity is Asteroid => entity instanceof Asteroid && entity.getActive())
}

function playerBullets(core: AsteroidsCore): Bullet[] {
  return core.getEntities().filter((entity): entity is Bullet => entity instanceof Bullet && entity.getActive())
}

function ship(core: AsteroidsCore): Ship {
  const found = core.getEntities().find((entity): entity is Ship => entity instanceof Ship)
  if (!found) throw new Error('no ship')
  return found
}

function hasSaucer(core: AsteroidsCore): boolean {
  return core.getEntities().some(entity => entity instanceof Saucer && entity.getActive())
}

function parkAsteroids(core: AsteroidsCore, except?: Asteroid): void {
  for (const asteroid of asteroids(core)) {
    if (asteroid === except) continue
    asteroid.setPosition(PARKED)
    asteroid.setVelocity({ x: 0, y: 0 })
  }
}

function step(core: AsteroidsCore, ms: number, controls: ShipControls = IDLE): void {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME) {
    core.update(Math.min(FRAME, ms - elapsed), controls)
  }
}

function stepParked(core: AsteroidsCore, ms: number): void {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME) {
    parkAsteroids(core)
    core.update(Math.min(FRAME, ms - elapsed), IDLE)
  }
}

function clearLevel(core: AsteroidsCore): void {
  for (const asteroid of asteroids(core)) asteroid.destroy()
  core.update(FRAME, IDLE)
}

function crashShip(core: AsteroidsCore): void {
  const [asteroid] = asteroids(core)
  asteroid.setPosition(ship(core).getPosition())
  asteroid.setVelocity({ x: 0, y: 0 })
  core.update(FRAME, IDLE)
}

function waitUntilShipVulnerable(core: AsteroidsCore): void {
  while (!ship(core).getCanCollide()) stepParked(core, FRAME)
}

describe('AsteroidsCore', () => {
  it('waits in the menu until started', () => {
    const { core, audio } = createCore()
    const before = core.getSnapshot()

    step(core, 1000)

    expect(core.getSnapshot()).toBe(before)
    expect(before.gameStatus).toBe('menu')
    expect(audio.calls).toEqual([])
  })

  it('starts Level 1 with an Asteroid Field of four Large Asteroids', () => {
    const { core, audio } = createCore()

    core.start()

    expect(core.getSnapshot()).toMatchObject({ gameStatus: 'playing', level: 1, lives: 3, score: 0 })
    expect(asteroids(core)).toHaveLength(4)
    expect(asteroids(core).every(asteroid => asteroid.getAsteroidState().size === AsteroidSize.LARGE)).toBe(true)
    expect(audio.calls).toContain('play:gameStart')
  })

  it('runs a Level Transition with a Level Bonus after the field is cleared', () => {
    const { core } = createCore()
    core.start()

    clearLevel(core)

    expect(core.getSnapshot()).toMatchObject({ gameStatus: 'loading', level: 2, score: 100, lastLevelBonus: 100 })
    step(core, GAMEPLAY.levelTransitionDelay - FRAME)
    expect(core.getSnapshot().gameStatus).toBe('loading')
    step(core, FRAME)
    expect(core.getSnapshot().gameStatus).toBe('playing')
    expect(asteroids(core)).toHaveLength(5)
  })

  it('gives a Level Transition after a restart its full length', () => {
    const { core } = createCore()
    core.start()
    clearLevel(core)

    core.restart()
    stepParked(core, 1500)
    clearLevel(core)

    expect(core.getSnapshot()).toMatchObject({ gameStatus: 'loading', level: 2 })
    stepParked(core, GAMEPLAY.levelTransitionDelay - FRAME)
    expect(core.getSnapshot().gameStatus).toBe('loading')
    stepParked(core, FRAME)
    expect(core.getSnapshot().gameStatus).toBe('playing')
  })

  it('loses a Life when the Ship is hit and Respawns after the delay', () => {
    const { core } = createCore()
    core.start()

    crashShip(core)

    expect(core.getSnapshot().lives).toBe(2)
    expect(ship(core).getActive()).toBe(false)
    stepParked(core, GAMEPLAY.respawnDelay - FRAME)
    expect(ship(core).getActive()).toBe(false)
    stepParked(core, FRAME)
    expect(ship(core).getActive()).toBe(true)
    expect(ship(core).getPosition()).toEqual(CENTER)
  })

  it('freezes a pending Respawn while paused', () => {
    const { core } = createCore()
    core.start()
    crashShip(core)

    core.pause()
    step(core, 10_000)
    core.resume()

    expect(ship(core).getActive()).toBe(false)
    stepParked(core, GAMEPLAY.respawnDelay)
    expect(ship(core).getActive()).toBe(true)
  })

  it('ends the Game when the last Life is lost', () => {
    const { core, audio } = createCore()
    core.start()

    for (let life = 0; life < 3; life++) {
      waitUntilShipVulnerable(core)
      crashShip(core)
    }

    const over = core.getSnapshot()
    expect(over).toMatchObject({ gameStatus: 'gameOver', lives: 0 })
    expect(audio.calls).toContain('play:gameOver')
    step(core, 5000)
    expect(core.getSnapshot()).toBe(over)
  })

  it('sends the first Saucer at Level 2 after the first spawn delay of play, not counting pauses', () => {
    const { core } = createCore()
    core.start()
    clearLevel(core)
    stepParked(core, GAMEPLAY.levelTransitionDelay)
    expect(core.getSnapshot()).toMatchObject({ gameStatus: 'playing', level: 2 })

    stepParked(core, 3000)
    core.pause()
    step(core, 60_000)
    core.resume()
    expect(hasSaucer(core)).toBe(false)

    let played = 3000
    while (!hasSaucer(core) && played < 30_000) {
      stepParked(core, FRAME)
      played += FRAME
    }

    const { firstSpawnDelay, spawnDelayVariance } = GAME_CONFIG.saucer
    expect(played).toBeGreaterThanOrEqual(Math.max(5000, firstSpawnDelay - spawnDelayVariance))
    expect(played).toBeLessThanOrEqual(firstSpawnDelay + spawnDelayVariance + 2 * FRAME)
  })

  it('pauses and resumes only between playing and paused', () => {
    const { core, audio } = createCore()
    core.pause()
    expect(core.getSnapshot().gameStatus).toBe('menu')

    core.start()
    audio.calls = []
    core.pause()
    core.pause()
    expect(core.getSnapshot().gameStatus).toBe('paused')
    expect(audio.calls).toEqual(['pause:effects', 'pause:ambient', 'play:pause'])

    audio.calls = []
    core.togglePause()
    core.resume()
    expect(core.getSnapshot().gameStatus).toBe('playing')
    expect(audio.calls).toEqual(['play:unpause', 'resume:effects', 'resume:ambient'])

    core.togglePause()
    expect(core.getSnapshot().gameStatus).toBe('paused')
  })

  it('fires Player Bullets no faster than the cooldown', () => {
    const { core, clock } = createCore()
    core.start()
    parkAsteroids(core)

    core.update(FRAME, FIRE)
    expect(playerBullets(core)).toHaveLength(1)

    clock.now += GAME_CONFIG.bullets.cooldown - 1
    core.update(FRAME, FIRE)
    expect(playerBullets(core)).toHaveLength(1)

    clock.now += 1
    core.update(FRAME, FIRE)
    expect(playerBullets(core)).toHaveLength(2)
  })

  it('scores and Splits an Asteroid shot by a Player Bullet', () => {
    const { core } = createCore()
    core.start()
    const [target] = asteroids(core)
    target.setPosition({ x: CENTER.x, y: CENTER.y - 150 })
    target.setVelocity({ x: 0, y: 0 })
    parkAsteroids(core, target)

    core.update(FRAME, FIRE)
    for (let elapsed = 0; elapsed < 500; elapsed += FRAME) {
      parkAsteroids(core, target)
      core.update(FRAME, IDLE)
    }

    expect(target.getActive()).toBe(false)
    expect(core.getSnapshot().score).toBe(GAME_CONFIG.asteroids.points.large)
    const fragments = asteroids(core).filter(asteroid => asteroid.getAsteroidState().size === AsteroidSize.MEDIUM)
    expect(fragments).toHaveLength(GAME_CONFIG.asteroids.splitCount.large)
  })

  it('grants a Pending Extra Life when the next Level is cleared', () => {
    const { core } = createCore()
    core.start()

    while (!core.getSnapshot().pendingExtraLife) {
      clearLevel(core)
      stepParked(core, GAMEPLAY.levelTransitionDelay)
    }
    expect(core.getSnapshot().score).toBeGreaterThanOrEqual(GAMEPLAY.extraLifeThreshold)
    const lives = core.getSnapshot().lives

    clearLevel(core)

    expect(core.getSnapshot()).toMatchObject({ lives: lives + 1, pendingExtraLife: false, extraLifeJustAwarded: true })
    stepParked(core, GAMEPLAY.levelTransitionDelay)
    expect(core.getSnapshot().extraLifeJustAwarded).toBe(false)
  })

  it('tracks the High Score', () => {
    const { core } = createCore(50)
    expect(core.getSnapshot().highScore).toBe(50)

    core.start()
    clearLevel(core)
    expect(core.getSnapshot().highScore).toBe(100)

    core.clearHighScore()
    expect(core.getSnapshot().highScore).toBe(0)
  })

  it('starts a fresh Game on restart and keeps the High Score', () => {
    const { core } = createCore()
    core.start()
    clearLevel(core)

    core.restart()

    expect(core.getSnapshot()).toMatchObject({ gameStatus: 'playing', level: 1, score: 0, lives: 3, highScore: 100 })
    expect(asteroids(core)).toHaveLength(4)
  })

  it('publishes a new snapshot only when something changed', () => {
    const { core } = createCore()
    let notified = 0
    const unsubscribe = core.subscribe(() => {
      notified++
    })

    core.update(FRAME, IDLE)
    core.resume()
    expect(notified).toBe(0)

    core.start()
    expect(notified).toBe(1)
    const playing = core.getSnapshot()
    parkAsteroids(core)
    core.update(FRAME, IDLE)
    expect(core.getSnapshot()).toBe(playing)

    unsubscribe()
    core.pause()
    expect(notified).toBe(1)
  })
})
