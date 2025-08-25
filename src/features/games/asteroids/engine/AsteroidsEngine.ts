import type { GameState, ScoreEvent } from '../types'
import { SaucerSize } from '../types'
import { GAME_CONFIG, GAMEPLAY, COLORS } from '../constants'
import { Vector2DUtils } from './utils/Vector2D'
import { GameMath } from './utils/GameMath'
import { Entity } from './entities/Entity'
import { Ship } from './entities/Ship'
import { Asteroid } from './entities/Asteroid'
import { Bullet } from './entities/Bullet'
import { Explosion } from './entities/Explosion'
import { Saucer } from './entities/Saucer'
import { CollisionSystem } from './systems/CollisionSystem'
import { RenderSystem } from './systems/RenderSystem'
import { SoundSystem } from './systems/SoundSystem'

export interface AsteroidsEngineEvents {
  onGameStateChange: (gameState: GameState) => void
  onScoreChange: (score: number, event?: ScoreEvent) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onGameOver: (finalScore: number) => void
  onExtraLife: (threshold: number) => void
}

export class AsteroidsEngine {
  private canvas: HTMLCanvasElement
  private renderSystem: RenderSystem
  private collisionSystem: CollisionSystem
  private soundSystem: SoundSystem
  private ship: Ship
  private entities: Entity[] = []
  private gameState: GameState
  private gameLoop: number = 0
  private lastFrameTime = 0
  private events: AsteroidsEngineEvents
  private keys: Set<string> = new Set()
  private lastShotTime = 0
  private levelStartTime = 0
  private nextSaucerSpawn = 0
  private isThrusting = false
  private isProcessingShipDeath = false
  private isFirstSaucerSpawnForLevel = true
  private hasCalculatedFirstSpawn = false

  constructor(canvas: HTMLCanvasElement, events: AsteroidsEngineEvents) {
    this.canvas = canvas
    this.events = events
    this.renderSystem = new RenderSystem(canvas)
    this.collisionSystem = new CollisionSystem()
    this.soundSystem = new SoundSystem()
    
    // Initialize game state
    this.gameState = {
      score: 0,
      lives: GAME_CONFIG.ship.startingLives,
      level: 1,
      gameStatus: 'menu',
      highScore: this.loadHighScore(),
      lastLevelBonus: undefined,
      lastExtraLifeThreshold: 0,
      pendingExtraLife: false,
      extraLifeJustAwarded: false,
    }

    // Initialize ship at center
    const centerX = GAME_CONFIG.canvas.width / 2
    const centerY = GAME_CONFIG.canvas.height / 2
    this.ship = new Ship({ x: centerX, y: centerY })
    this.entities.push(this.ship)

    // Set up input handling
    this.setupInputHandling()
    
    // Render initial state
    this.render()
  }

  private setupInputHandling(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      this.keys.add(event.code)
      
      // Handle special keys
      if (event.code === 'Enter' && this.gameState.gameStatus === 'gameOver') {
        this.restart()
      } else if (event.code === 'Escape') {
        this.togglePause()
      }
      
      event.preventDefault()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      this.keys.delete(event.code)
      event.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Store references for cleanup
    this.canvas.setAttribute('data-keydown-handler', 'true')
  }

  start(): void {
    if (this.gameState.gameStatus === 'menu') {
      this.initializeLevel()
      this.gameState.gameStatus = 'playing'
      this.notifyStateChange()
      
      // Play game start sound
      this.soundSystem.playSound('gameStart')
    }
    
    this.lastFrameTime = performance.now()
    this.gameLoop = requestAnimationFrame((time) => this.update(time))
  }

  private update(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    if (this.gameState.gameStatus === 'playing') {
      this.handleInput()
      this.updateEntities(deltaTime)
      this.updateSaucerShooting()
      this.checkCollisions()
      this.updateGameLogic()
      this.cleanupDeadEntities()
    }

    this.render()
    
    if (this.gameState.gameStatus !== 'gameOver') {
      this.gameLoop = requestAnimationFrame((time) => this.update(time))
    }
  }

  private handleInput(): void {
    if (!this.ship.getActive()) return

    // Ship rotation
    if (this.keys.has('ArrowLeft')) {
      this.ship.rotate(-1)
    }
    if (this.keys.has('ArrowRight')) {
      this.ship.rotate(1)
    }

    // Ship thrust
    if (this.keys.has('ArrowUp')) {
      this.ship.thrust()
      // Start thrust sound if not already playing
      if (!this.isThrusting) {
        this.soundSystem.playSound('shipThrust')
        this.isThrusting = true
      }
    } else {
      this.ship.stopThrust()
      // Stop thrust sound if playing
      if (this.isThrusting) {
        this.soundSystem.stopSound('shipThrust')
        this.isThrusting = false
      }
    }

    // Shooting
    if (this.keys.has('Space')) {
      this.handleShooting()
    }
  }

  private handleShooting(): void {
    // Guard against shooting when ship is not active
    if (!this.ship.getActive()) return
    
    const now = performance.now()
    
    if (now - this.lastShotTime >= GAME_CONFIG.bullets.cooldown) {
      const activeBullets = this.entities.filter(e => 
        e instanceof Bullet && e.getActive()
      ).length

      if (activeBullets < GAME_CONFIG.bullets.maxCount) {
        const shipPos = this.ship.getPosition()
        const shipVel = this.ship.getVelocity()
        const shipRot = this.ship.getRotation()
        
        // Offset bullet spawn position to ship nose
        const noseOffset = Vector2DUtils.fromAngle(shipRot, GAMEPLAY.bulletNoseOffset)
        const bulletPos = Vector2DUtils.add(shipPos, noseOffset)
        
        const bullet = new Bullet(bulletPos, shipRot, shipVel, this.ship.getId())
        this.entities.push(bullet)
        
        // Play bullet fire sound
        this.soundSystem.playSound('bulletFire')
        
        this.lastShotTime = now
      }
    }
  }

  private updateEntities(deltaTime: number): void {
    for (const entity of this.entities) {
      if (entity.getActive()) {
        entity.update(deltaTime, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height)
      }
    }
  }

  private updateSaucerShooting(): void {
    // Find active saucers that can shoot
    const saucers = this.entities.filter(e => 
      e instanceof Saucer && e.getActive()
    ) as Saucer[]

    for (const saucer of saucers) {
      if (saucer.canShoot() && this.ship.getActive()) {
        const shootDirection = saucer.calculateShootDirection(this.ship.getPosition())
        const shootPosition = saucer.getShootPosition()
        
        // Create saucer bullet with yellow color
        const bullet = new Bullet(
          shootPosition, 
          shootDirection, 
          Vector2DUtils.zero(), // Saucers don't inherit velocity
          saucer.getId(),
          COLORS.saucerBullets
        )
        
        this.entities.push(bullet)
        saucer.resetShootTimer()
        
        // Play saucer fire sound (with variants)
        this.soundSystem.playSound('saucerFire')
      }
    }
  }

  private checkCollisions(): void {
    const collisions = this.collisionSystem.checkCollisions(this.entities)
    this.collisionSystem.resolveCollisions(collisions)

    // Handle post-collision effects
    for (const collision of collisions) {
      this.handleCollisionEffects(collision.entityA, collision.entityB)
    }
  }

  private handleCollisionEffects(entityA: Entity, entityB: Entity): void {
    // Handle asteroid destruction and splitting
    const asteroid = entityA instanceof Asteroid ? entityA : 
                    entityB instanceof Asteroid ? entityB : null
    const bullet = entityA instanceof Bullet ? entityA : 
                  entityB instanceof Bullet ? entityB : null
    const saucer = entityA instanceof Saucer ? entityA : 
                  entityB instanceof Saucer ? entityB : null

    if (asteroid && bullet && !asteroid.getActive()) {
      // Create small explosion at asteroid position
      const explosion = new Explosion(asteroid.getPosition(), 'asteroid')
      this.entities.push(explosion)
      
      // Award points
      const points = asteroid.getPoints()
      this.addScore(points, {
        points,
        position: asteroid.getPosition(),
        type: 'asteroid'
      })

      // Split asteroid if possible
      const fragments = asteroid.split()
      if (fragments.length > 0) {
        // Play asteroid split sound
        this.soundSystem.playSound('asteroidSplit')
        for (const fragment of fragments) {
          this.entities.push(fragment)
        }
      } else {
        // Play asteroid destruction sound (no fragments = completely destroyed)
        this.soundSystem.playSound('asteroidDestruction')
      }
    }

    // Handle saucer destruction by player bullets
    if (saucer && bullet && !saucer.getActive()) {
      // Only award points if bullet was fired by the player (not another saucer)
      if (bullet.getSourceId() === this.ship.getId()) {
        this.handleSaucerDestroyed(saucer)
      }
    }

    // Handle ship destruction
    if (!this.ship.getActive()) {
      this.handleShipDestroyed()
    }
  }

  private handleSaucerDestroyed(saucer: Saucer): void {
    // Create explosion at saucer position
    const explosion = new Explosion(saucer.getPosition(), 'saucer')
    this.entities.push(explosion)
    
    // Award points
    const points = saucer.getPoints()
    this.addScore(points, {
      points,
      position: saucer.getPosition(),
      type: 'saucer'
    })

    // Play saucer destruction sound
    this.soundSystem.playSound('saucerDestroyed')
    
    // Stop the looping arrival sound when saucer is destroyed
    this.soundSystem.stopSound('saucerArrival')
  }

  private handleShipDestroyed(): void {
    // Prevent multiple death processing
    if (this.isProcessingShipDeath) return
    this.isProcessingShipDeath = true

    // Create explosion at ship position
    const explosion = new Explosion(this.ship.getPosition(), 'ship')
    this.entities.push(explosion)
    
    // Play ship destruction sound
    this.soundSystem.playSound('shipDestroyed')
    
    // Stop thrust sound if playing
    if (this.isThrusting) {
      this.soundSystem.stopSound('shipThrust')
      this.isThrusting = false
    }
    
    this.gameState.lives--
    this.events.onLivesChange(this.gameState.lives)

    if (this.gameState.lives <= 0) {
      this.gameOver()
    } else {
      // Respawn ship after delay
      setTimeout(() => {
        if (this.gameState.gameStatus === 'playing') {
          const centerX = GAME_CONFIG.canvas.width / 2
          const centerY = GAME_CONFIG.canvas.height / 2
          this.ship.respawn({ x: centerX, y: centerY })
          
          // Play ship respawn sound
          this.soundSystem.playSound('shipRespawn')
        }
        this.isProcessingShipDeath = false
      }, GAMEPLAY.respawnDelay)
    }
  }

  private updateGameLogic(): void {
    // Check for level completion
    const asteroidsRemaining = this.entities.filter(e => 
      e instanceof Asteroid && e.getActive()
    ).length

    if (asteroidsRemaining === 0) {
      this.completeLevel()
    }

    // Handle saucer spawning
    this.updateSaucerSpawning()
  }

  private updateSaucerSpawning(): void {
    // Only spawn saucers from level 2 onward
    if (this.gameState.level < GAME_CONFIG.saucer.minLevel) {
      return
    }

    // Calculate first spawn time when first needed (not during initialization)
    if (this.isFirstSaucerSpawnForLevel && !this.hasCalculatedFirstSpawn) {
      const now = performance.now()
      const randomizedFirstDelay = Math.max(5000, this.getRandomizedSaucerDelay(GAME_CONFIG.saucer.firstSpawnDelay))
      this.nextSaucerSpawn = now + randomizedFirstDelay
      this.hasCalculatedFirstSpawn = true
      console.log(`First saucer spawn scheduled for level ${this.gameState.level} in ${randomizedFirstDelay}ms`)
      return
    }

    // Check if there's already a saucer on screen
    const existingSaucer = this.entities.find(e => e instanceof Saucer && e.getActive())
    if (existingSaucer) {
      return
    }

    // Check if it's time to spawn a saucer
    const now = performance.now()
    if (this.nextSaucerSpawn > 0 && now >= this.nextSaucerSpawn) {
      this.spawnSaucer()
      
      // Mark that first spawn is complete
      this.isFirstSaucerSpawnForLevel = false
      
      // Schedule next spawn with regular interval
      const randomizedInterval = Math.max(10000, this.getRandomizedSaucerDelay(GAME_CONFIG.saucer.spawnInterval))
      this.nextSaucerSpawn = now + randomizedInterval
      console.log(`Next saucer spawn scheduled in ${randomizedInterval}ms`)
    }
  }

  private spawnSaucer(): void {
    // Determine saucer size based on level
    const saucerSize = this.getSaucerSizeByLevel(this.gameState.level)
    
    // Randomly choose spawn side
    const startSide = Math.random() < 0.5 ? 'left' : 'right'
    
    // Set spawn position
    const spawnX = startSide === 'left' ? -50 : GAME_CONFIG.canvas.width + 50
    const spawnY = GameMath.randomFloat(50, GAME_CONFIG.canvas.height - 50)
    
    const saucer = new Saucer(
      { x: spawnX, y: spawnY },
      saucerSize,
      startSide
    )
    
    this.entities.push(saucer)
    
    // Play saucer arrival sound (looping)
    this.soundSystem.playSound('saucerArrival')
  }

  private getSaucerSizeByLevel(level: number): SaucerSize {
    let weights: { small: number, large: number }
    
    if (level <= 4) {
      weights = GAME_CONFIG.saucer.weights.early
    } else if (level <= 8) {
      weights = GAME_CONFIG.saucer.weights.mid
    } else {
      weights = GAME_CONFIG.saucer.weights.late
    }
    
    return Math.random() < weights.small ? 'small' as SaucerSize : 'large' as SaucerSize
  }

  private getRandomizedSaucerDelay(baseDelay: number): number {
    const variance = GAME_CONFIG.saucer.spawnDelayVariance
    return baseDelay + GameMath.randomFloat(-variance, variance)
  }

  private completeLevel(): void {
    // Play level completion sound (before bonus display, non-blocking)
    this.soundSystem.playSound('levelCompletion')
    
    // Check for pending extra life award
    if (this.gameState.pendingExtraLife) {
      this.awardExtraLife()
    }
    
    // Award bonus points for level completion (before incrementing level)
    const bonusPoints = this.gameState.level * GAMEPLAY.levelCompletionBonus
    this.addScore(bonusPoints)
    
    // Store bonus points for display on loading screen
    this.gameState.lastLevelBonus = bonusPoints
    
    this.gameState.level++
    this.events.onLevelChange(this.gameState.level)
    
    // Reset saucer spawn state for next level
    this.isFirstSaucerSpawnForLevel = true
    this.hasCalculatedFirstSpawn = false
    this.nextSaucerSpawn = -1
    
    // Set game state to loading to show level loading screen
    const previousState = this.gameState.gameStatus
    this.gameState.gameStatus = 'loading'
    this.notifyStateChange()
    
    // Stop any active saucer sounds before clearing entities
    const activeSaucers = this.entities.filter(e => e instanceof Saucer && e.getActive())
    if (activeSaucers.length > 0) {
      this.soundSystem.stopSound('saucerArrival')
    }
    
    // Clear asteroids and bullets immediately to prevent visual artifacts
    // Keep ship and explosions for visual continuity
    this.entities = this.entities.filter(e => e instanceof Ship || e instanceof Explosion)
    
    // Add ship back if it was removed
    if (!this.entities.includes(this.ship)) {
      this.entities.push(this.ship)
    }
    
    // Start next level after brief delay
    setTimeout(() => {
      if (this.gameState.gameStatus === 'loading') {
        this.initializeLevel()
        this.gameState.gameStatus = previousState
        this.gameState.extraLifeJustAwarded = false // Reset extra life notification
        this.notifyStateChange()
      }
    }, GAMEPLAY.levelTransitionDelay)
  }

  private awardExtraLife(): void {
    // Calculate the threshold that was crossed
    const threshold = GAMEPLAY.extraLifeThreshold
    const newThreshold = Math.floor(this.gameState.score / threshold) * threshold
    
    // Award the extra life
    this.gameState.lives++
    this.gameState.lastExtraLifeThreshold = newThreshold
    this.gameState.pendingExtraLife = false
    this.gameState.extraLifeJustAwarded = true
    
    // Notify UI of lives change
    this.events.onLivesChange(this.gameState.lives)
  }

  private initializeLevel(): void {
    // Entities should already be cleared in completeLevel(), but ensure ship is present
    if (!this.entities.includes(this.ship)) {
      this.entities = [this.ship]
    }

    // Spawn asteroids for this level
    const asteroidCount = Math.min(
      GAMEPLAY.baseAsteroidCount + (this.gameState.level - 1) * GAMEPLAY.asteroidIncrement, 
      GAMEPLAY.maxAsteroidCount
    )
    const shipPos = this.ship.getPosition()
    const minDistance = GAMEPLAY.asteroidMinDistance

    const asteroids = Asteroid.createField(
      asteroidCount,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height,
      shipPos,
      minDistance
    )

    this.entities.push(...asteroids)
    this.levelStartTime = performance.now()
    
    // Reset saucer spawn state for new level
    this.isFirstSaucerSpawnForLevel = true
    this.hasCalculatedFirstSpawn = false
    this.nextSaucerSpawn = -1 // Indicates first spawn not calculated yet
  }

  private cleanupDeadEntities(): void {
    // Check for saucers that need sound cleanup before filtering
    const deadSaucers = this.entities.filter(entity => 
      entity instanceof Saucer && !entity.getActive()
    ) as Saucer[]
    
    // Stop arrival sound for any saucers being cleaned up (they exited screen)
    for (const saucer of deadSaucers) {
      if (saucer.hasExitedScreen()) {
        // Saucer exited naturally (not destroyed), just stop the sound
        this.soundSystem.stopSound('saucerArrival')
      }
    }

    // Keep the ship entity even when inactive (for respawning)
    this.entities = this.entities.filter(entity => 
      entity.getActive() || entity instanceof Ship
    )
  }

  private render(): void {
    this.renderSystem.clear()
    
    if (this.gameState.gameStatus === 'playing') {
      this.renderSystem.renderEntities(this.entities)
      this.renderSystem.drawHUD(
        this.gameState.score,
        this.gameState.lives,
        this.gameState.level
      )
    } else if (this.gameState.gameStatus === 'paused') {
      this.renderSystem.renderEntities(this.entities)
      this.renderSystem.drawHUD(
        this.gameState.score,
        this.gameState.lives,
        this.gameState.level
      )
      this.renderSystem.drawPauseScreen()
    } else if (this.gameState.gameStatus === 'loading') {
      this.renderSystem.renderEntities(this.entities)
      this.renderSystem.drawHUD(
        this.gameState.score,
        this.gameState.lives,
        this.gameState.level
      )
      this.renderSystem.drawLevelLoading(this.gameState.level, this.gameState.lastLevelBonus, this.gameState.extraLifeJustAwarded)
    } else if (this.gameState.gameStatus === 'gameOver') {
      this.renderSystem.drawGameOver(this.gameState.score, this.gameState.highScore)
    } else if (this.gameState.gameStatus === 'menu') {
      // For menu state, just render the background and maybe the ship
      this.renderSystem.renderEntities([this.ship])
    }
  }

  private addScore(points: number, event?: ScoreEvent): void {
    const previousScore = this.gameState.score
    this.gameState.score += points
    
    // Check for extra life threshold crossing
    this.checkExtraLifeThreshold(previousScore, this.gameState.score)
    
    // Update high score
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score
      this.saveHighScore(this.gameState.highScore)
    }
    
    this.events.onScoreChange(this.gameState.score, event)
  }

  private checkExtraLifeThreshold(previousScore: number, currentScore: number): void {
    const threshold = GAMEPLAY.extraLifeThreshold
    
    // Calculate which thresholds were crossed
    const previousThreshold = Math.floor(previousScore / threshold) * threshold
    const currentThreshold = Math.floor(currentScore / threshold) * threshold
    
    // If we crossed a new threshold
    if (currentThreshold > previousThreshold && currentThreshold > this.gameState.lastExtraLifeThreshold) {
      // Mark that an extra life is pending (to be awarded on next level completion)
      this.gameState.pendingExtraLife = true
      
      // Trigger extra life notification event immediately for UI feedback
      this.events.onExtraLife(currentThreshold)
    }
  }

  private gameOver(): void {
    // Stop all sounds and play game over sound
    this.soundSystem.stopAllSounds()
    this.soundSystem.playSound('gameOver')
    
    this.gameState.gameStatus = 'gameOver'
    this.events.onGameOver(this.gameState.score)
    this.notifyStateChange()
  }

  private togglePause(): void {
    if (this.gameState.gameStatus === 'playing') {
      this.gameState.gameStatus = 'paused'
      
      // Pause effects and ambient sounds, but allow UI sounds
      this.soundSystem.pauseCategory('effects')
      this.soundSystem.pauseCategory('ambient')
      this.soundSystem.playSound('pause')
      
      // Reset thrust state so it can restart when unpaused
      this.isThrusting = false
    } else if (this.gameState.gameStatus === 'paused') {
      this.gameState.gameStatus = 'playing'
      this.lastFrameTime = performance.now() // Reset frame timing
      
      // UI sounds still work, so play unpause sound
      this.soundSystem.playSound('unpause')
      
      // Resume paused effects and ambient sounds
      this.soundSystem.resumeCategory('effects')
      this.soundSystem.resumeCategory('ambient')
    }
    this.notifyStateChange()
  }

  restart(): void {
    // Reset game state
    this.gameState = {
      score: 0,
      lives: GAME_CONFIG.ship.startingLives,
      level: 1,
      gameStatus: 'playing',
      highScore: this.gameState.highScore,
      lastLevelBonus: undefined,
      lastExtraLifeThreshold: 0,
      pendingExtraLife: false,
      extraLifeJustAwarded: false,
    }

    // Clear all entities and reset ship
    this.entities = []
    const centerX = GAME_CONFIG.canvas.width / 2
    const centerY = GAME_CONFIG.canvas.height / 2
    this.ship.respawn({ x: centerX, y: centerY })
    this.entities.push(this.ship)

    // Clear input state
    this.keys.clear()
    this.lastShotTime = 0
    this.isThrusting = false
    this.isProcessingShipDeath = false
    this.isFirstSaucerSpawnForLevel = true
    this.hasCalculatedFirstSpawn = false

    // Stop all sounds
    this.soundSystem.stopAllSounds()

    // Initialize first level
    this.initializeLevel()
    this.notifyStateChange()
    
    // Start game loop
    this.start()
  }

  pause(): void {
    if (this.gameState.gameStatus === 'playing') {
      this.gameState.gameStatus = 'paused'
      
      // Pause effects and ambient sounds, but allow UI sounds
      this.soundSystem.pauseCategory('effects')
      this.soundSystem.pauseCategory('ambient')
      this.soundSystem.playSound('pause')
      
      // Reset thrust state so it can restart when unpaused
      this.isThrusting = false
      
      this.notifyStateChange()
    }
  }

  resume(): void {
    if (this.gameState.gameStatus === 'paused') {
      this.gameState.gameStatus = 'playing'
      this.lastFrameTime = performance.now()
      
      // UI sounds still work, so play unpause sound
      this.soundSystem.playSound('unpause')
      
      // Resume paused effects and ambient sounds
      this.soundSystem.resumeCategory('effects')
      this.soundSystem.resumeCategory('ambient')
      
      // DEBUG: Also try to directly play saucer sound if there are active saucers
      const activeSaucers = this.entities.filter(e => e instanceof Saucer && e.getActive())
      console.log('Resume - Active saucers found:', activeSaucers.length)
      if (activeSaucers.length > 0) {
        console.log('Directly playing saucer arrival sound')
        this.soundSystem.playSound('saucerArrival')
      }
      
      this.notifyStateChange()
    }
  }

  destroy(): void {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop)
    }
    
    // Clean up sound system
    this.soundSystem.destroy()
    
    // Clean up event listeners
    // Note: In a real implementation, we'd store and remove the actual listeners
    this.keys.clear()
  }

  getGameState(): GameState {
    return { ...this.gameState }
  }

  private notifyStateChange(): void {
    this.events.onGameStateChange(this.getGameState())
  }

  private loadHighScore(): number {
    try {
      const stored = localStorage.getItem('asteroids_highscore')
      return stored ? parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('asteroids_highscore', score.toString())
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  // Development/debug methods
  getEntities(): Entity[] {
    return [...this.entities]
  }

  getRenderSystem(): RenderSystem {
    return this.renderSystem
  }

  getSoundSystem(): SoundSystem {
    return this.soundSystem
  }
}