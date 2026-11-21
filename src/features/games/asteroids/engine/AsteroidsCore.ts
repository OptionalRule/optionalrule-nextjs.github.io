import type { GameState } from '../types'
import { SaucerSize } from '../types'
import { GAME_CONFIG, GAMEPLAY, COLORS } from '../constants'
import { Vector2DUtils } from './utils/Vector2D'
import { GameMath } from './utils/GameMath'
import type { Entity } from './entities/Entity'
import { Ship } from './entities/Ship'
import { Asteroid } from './entities/Asteroid'
import { Bullet } from './entities/Bullet'
import { Explosion } from './entities/Explosion'
import { Saucer } from './entities/Saucer'
import { collide, type CollisionOutcome } from './systems/collisions'
import type { SoundSystem } from './systems/SoundSystem'

export interface ShipControls {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  fire: boolean
}

export type GameAudio = Pick<SoundSystem, 'playSound' | 'stopSound' | 'pauseCategory' | 'resumeCategory' | 'stopAllSounds'>

export interface AsteroidsCoreOptions {
  audio: GameAudio
  highScore: number
  clock: () => number
}

const NO_TIMER = -1

function newGameState(gameStatus: GameState['gameStatus'], highScore: number): GameState {
  return {
    score: 0,
    lives: GAME_CONFIG.ship.startingLives,
    level: 1,
    gameStatus,
    highScore,
    lastLevelBonus: undefined,
    lastExtraLifeThreshold: 0,
    pendingExtraLife: false,
    extraLifeJustAwarded: false,
  }
}

function sameState(a: GameState, b: GameState): boolean {
  return (Object.keys(a) as (keyof GameState)[]).every(key => a[key] === b[key])
    && (Object.keys(b) as (keyof GameState)[]).every(key => a[key] === b[key])
}

export class AsteroidsCore {
  private readonly audio: GameAudio
  private readonly clock: () => number
  private readonly listeners = new Set<() => void>()
  private readonly ship: Ship
  private entities: Entity[] = []
  private state: GameState
  private snapshot: GameState
  private simulatedTime = 0
  private lastShotTime = 0
  private isThrusting = false
  private respawnRemaining = NO_TIMER
  private levelTransitionRemaining = NO_TIMER
  private nextSaucerSpawnAt = NO_TIMER

  constructor({ audio, highScore, clock }: AsteroidsCoreOptions) {
    this.audio = audio
    this.clock = clock
    this.state = newGameState('menu', highScore)
    this.snapshot = Object.freeze({ ...this.state })
    this.ship = new Ship({ x: GAME_CONFIG.canvas.width / 2, y: GAME_CONFIG.canvas.height / 2 })
    this.entities.push(this.ship)
  }

  getSnapshot = (): GameState => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getEntities(): readonly Entity[] {
    return this.entities
  }

  update(dt: number, controls: ShipControls): void {
    const status = this.state.gameStatus
    if (status !== 'playing' && status !== 'loading') return

    this.simulatedTime += dt
    this.tickRespawn(dt)
    this.tickLevelTransition(dt)

    if (this.state.gameStatus === 'playing') {
      this.applyControls(dt, controls)
      this.updateEntities(dt)
      this.updateSaucerShooting()
      this.applyCollisions()
      this.updateGameLogic()
      this.cleanupDeadEntities()
    }

    this.publish()
  }

  start(): void {
    if (this.state.gameStatus !== 'menu') return

    this.initializeLevel()
    this.state.gameStatus = 'playing'
    this.audio.playSound('gameStart')
    this.publish()
  }

  pause(): void {
    this.setPaused(true)
  }

  resume(): void {
    this.setPaused(false)
  }

  togglePause(): void {
    this.setPaused(this.state.gameStatus === 'playing')
  }

  restart(): void {
    this.state = newGameState('playing', this.state.highScore)
    this.respawnRemaining = NO_TIMER
    this.levelTransitionRemaining = NO_TIMER
    this.lastShotTime = 0
    this.isThrusting = false

    this.entities = []
    this.ship.respawn({ x: GAME_CONFIG.canvas.width / 2, y: GAME_CONFIG.canvas.height / 2 })
    this.entities.push(this.ship)

    this.audio.stopAllSounds()
    this.initializeLevel()
    this.publish()
  }

  clearHighScore(): void {
    this.state.highScore = 0
    this.publish()
  }

  private setPaused(paused: boolean): void {
    if (paused && this.state.gameStatus === 'playing') {
      this.state.gameStatus = 'paused'
      this.audio.pauseCategory('effects')
      this.audio.pauseCategory('ambient')
      this.audio.playSound('pause')
    } else if (!paused && this.state.gameStatus === 'paused') {
      this.state.gameStatus = 'playing'
      this.audio.playSound('unpause')
      this.audio.resumeCategory('effects')
      this.audio.resumeCategory('ambient')
    }
    this.publish()
  }

  private publish(): void {
    if (sameState(this.snapshot, this.state)) return
    this.snapshot = Object.freeze({ ...this.state })
    for (const listener of [...this.listeners]) listener()
  }

  private tickRespawn(dt: number): void {
    if (this.respawnRemaining === NO_TIMER) return
    this.respawnRemaining -= dt
    if (this.respawnRemaining > 0) return

    this.respawnRemaining = NO_TIMER
    this.ship.respawn({ x: GAME_CONFIG.canvas.width / 2, y: GAME_CONFIG.canvas.height / 2 })
    this.audio.playSound('shipRespawn')
  }

  private tickLevelTransition(dt: number): void {
    if (this.levelTransitionRemaining === NO_TIMER) return
    this.levelTransitionRemaining -= dt
    if (this.levelTransitionRemaining > 0) return

    this.levelTransitionRemaining = NO_TIMER
    this.initializeLevel()
    this.state.gameStatus = 'playing'
    this.state.extraLifeJustAwarded = false
  }

  private applyControls(dt: number, controls: ShipControls): void {
    if (!this.ship.getActive()) return

    if (controls.rotateLeft) this.ship.rotate(-1, dt)
    if (controls.rotateRight) this.ship.rotate(1, dt)

    if (controls.thrust) {
      this.ship.thrust(dt)
      if (!this.isThrusting) {
        this.audio.playSound('shipThrust')
        this.isThrusting = true
      }
    } else {
      this.ship.stopThrust()
      if (this.isThrusting) {
        this.audio.stopSound('shipThrust')
        this.isThrusting = false
      }
    }

    if (controls.fire) this.fire()
  }

  private fire(): void {
    const now = this.clock()
    if (now - this.lastShotTime < GAME_CONFIG.bullets.cooldown) return

    const activeBullets = this.entities.filter(entity => entity instanceof Bullet && entity.getActive()).length
    if (activeBullets >= GAME_CONFIG.bullets.maxCount) return

    const rotation = this.ship.getRotation()
    const nose = Vector2DUtils.add(this.ship.getPosition(), Vector2DUtils.fromAngle(rotation, GAMEPLAY.bulletNoseOffset))
    this.entities.push(new Bullet(nose, rotation, this.ship.getVelocity(), this.ship.getId()))
    this.audio.playSound('bulletFire')
    this.lastShotTime = now
  }

  private updateEntities(dt: number): void {
    for (const entity of this.entities) {
      if (entity.getActive()) {
        entity.update(dt, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height)
      }
    }
  }

  private updateSaucerShooting(): void {
    if (!this.ship.getActive()) return

    for (const saucer of this.activeSaucers()) {
      if (!saucer.canShoot()) continue

      const direction = saucer.calculateShootDirection(this.ship.getPosition())
      this.entities.push(new Bullet(saucer.getShootPosition(), direction, Vector2DUtils.zero(), saucer.getId(), COLORS.saucerBullets))
      saucer.resetShootTimer()
      this.audio.playSound('saucerFire')
    }
  }

  private applyCollisions(): void {
    for (const outcome of collide(this.entities, this.ship.getId())) {
      this.applyCollisionOutcome(outcome)
    }
  }

  private applyCollisionOutcome(outcome: CollisionOutcome): void {
    switch (outcome.kind) {
      case 'asteroidShot':
        outcome.bullet.destroy()
        outcome.asteroid.destroy()
        this.handleAsteroidShot(outcome)
        break
      case 'saucerShot':
        outcome.bullet.destroy()
        outcome.saucer.destroy()
        if (outcome.shooter === 'player') {
          this.handleSaucerDestroyed(outcome.saucer, outcome.points)
        }
        break
      case 'shipDestroyed':
        outcome.bullet?.destroy()
        outcome.ship.destroy()
        this.handleShipDestroyed()
        break
    }
  }

  private handleAsteroidShot({ asteroid, shooter, points }: Extract<CollisionOutcome, { kind: 'asteroidShot' }>): void {
    this.entities.push(new Explosion(asteroid.getPosition(), 'asteroid'))

    if (shooter === 'player') {
      this.addScore(points)
    }

    const fragments = asteroid.split()
    if (fragments.length > 0) {
      this.audio.playSound('asteroidSplit')
      this.entities.push(...fragments)
    } else {
      this.audio.playSound('asteroidDestruction')
    }
  }

  private handleSaucerDestroyed(saucer: Saucer, points: number): void {
    this.entities.push(new Explosion(saucer.getPosition(), 'saucer'))
    this.addScore(points)
    this.audio.playSound('saucerDestroyed')
    this.audio.stopSound('saucerArrival')
  }

  private handleShipDestroyed(): void {
    if (this.respawnRemaining !== NO_TIMER) return

    this.entities.push(new Explosion(this.ship.getPosition(), 'ship'))
    this.audio.playSound('shipDestroyed')

    if (this.isThrusting) {
      this.audio.stopSound('shipThrust')
      this.isThrusting = false
    }

    this.state.lives--

    if (this.state.lives <= 0) {
      this.gameOver()
    } else {
      this.respawnRemaining = GAMEPLAY.respawnDelay
    }
  }

  private updateGameLogic(): void {
    if (this.state.gameStatus !== 'playing') return

    const asteroidsRemaining = this.entities.filter(entity => entity instanceof Asteroid && entity.getActive()).length
    if (asteroidsRemaining === 0) {
      this.completeLevel()
      return
    }

    this.updateSaucerSpawning()
  }

  private updateSaucerSpawning(): void {
    if (this.state.level < GAME_CONFIG.saucer.minLevel) return

    if (this.nextSaucerSpawnAt === NO_TIMER) {
      this.nextSaucerSpawnAt = this.simulatedTime + Math.max(5000, this.randomizedSaucerDelay(GAME_CONFIG.saucer.firstSpawnDelay))
      return
    }

    if (this.activeSaucers().length > 0) return

    if (this.simulatedTime >= this.nextSaucerSpawnAt) {
      this.spawnSaucer()
      this.nextSaucerSpawnAt = this.simulatedTime + Math.max(10000, this.randomizedSaucerDelay(GAME_CONFIG.saucer.spawnInterval))
    }
  }

  private spawnSaucer(): void {
    const startSide = Math.random() < 0.5 ? 'left' : 'right'
    const spawnX = startSide === 'left' ? -50 : GAME_CONFIG.canvas.width + 50
    const spawnY = GameMath.randomFloat(50, GAME_CONFIG.canvas.height - 50)

    this.entities.push(new Saucer({ x: spawnX, y: spawnY }, this.saucerSizeForLevel(this.state.level), startSide))
    this.audio.playSound('saucerArrival')
  }

  private saucerSizeForLevel(level: number): SaucerSize {
    const { weights } = GAME_CONFIG.saucer
    const levelWeights = level <= 4 ? weights.early : level <= 8 ? weights.mid : weights.late
    return Math.random() < levelWeights.small ? SaucerSize.SMALL : SaucerSize.LARGE
  }

  private randomizedSaucerDelay(baseDelay: number): number {
    const variance = GAME_CONFIG.saucer.spawnDelayVariance
    return baseDelay + GameMath.randomFloat(-variance, variance)
  }

  private activeSaucers(): Saucer[] {
    return this.entities.filter((entity): entity is Saucer => entity instanceof Saucer && entity.getActive())
  }

  private completeLevel(): void {
    this.audio.playSound('levelCompletion')

    if (this.state.pendingExtraLife) {
      this.awardExtraLife()
    }

    const bonusPoints = this.state.level * GAMEPLAY.levelCompletionBonus
    this.addScore(bonusPoints)
    this.state.lastLevelBonus = bonusPoints
    this.state.level++
    this.nextSaucerSpawnAt = NO_TIMER
    this.state.gameStatus = 'loading'

    if (this.activeSaucers().length > 0) {
      this.audio.stopSound('saucerArrival')
    }

    this.entities = this.entities.filter(entity => entity instanceof Ship || entity instanceof Explosion)
    if (!this.entities.includes(this.ship)) {
      this.entities.push(this.ship)
    }

    this.levelTransitionRemaining = GAMEPLAY.levelTransitionDelay
  }

  private awardExtraLife(): void {
    const threshold = GAMEPLAY.extraLifeThreshold
    this.state.lives++
    this.state.lastExtraLifeThreshold = Math.floor(this.state.score / threshold) * threshold
    this.state.pendingExtraLife = false
    this.state.extraLifeJustAwarded = true
  }

  private initializeLevel(): void {
    if (!this.entities.includes(this.ship)) {
      this.entities = [this.ship]
    }

    const asteroidCount = Math.min(
      GAMEPLAY.baseAsteroidCount + (this.state.level - 1) * GAMEPLAY.asteroidIncrement,
      GAMEPLAY.maxAsteroidCount
    )

    this.entities.push(...Asteroid.createField(
      asteroidCount,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height,
      this.ship.getPosition(),
      GAMEPLAY.asteroidMinDistance
    ))

    this.nextSaucerSpawnAt = NO_TIMER
  }

  private cleanupDeadEntities(): void {
    for (const entity of this.entities) {
      if (entity instanceof Saucer && !entity.getActive() && entity.hasExitedScreen()) {
        this.audio.stopSound('saucerArrival')
      }
    }

    this.entities = this.entities.filter(entity => entity.getActive() || entity instanceof Ship)
  }

  private addScore(points: number): void {
    const previousScore = this.state.score
    this.state.score += points

    const threshold = GAMEPLAY.extraLifeThreshold
    const previousThreshold = Math.floor(previousScore / threshold) * threshold
    const currentThreshold = Math.floor(this.state.score / threshold) * threshold
    if (currentThreshold > previousThreshold && currentThreshold > this.state.lastExtraLifeThreshold) {
      this.state.pendingExtraLife = true
    }

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score
    }
  }

  private gameOver(): void {
    this.audio.stopAllSounds()
    this.audio.playSound('gameOver')
    this.state.gameStatus = 'gameOver'
  }
}
