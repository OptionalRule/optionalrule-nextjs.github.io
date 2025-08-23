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
        
        // Play saucer shoot sound (will be implemented later)
        // this.soundSystem.playSound('saucerShoot')
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

    // Play saucer destruction sound (will be implemented later)
    // this.soundSystem.playSound('saucerDestroyed')
  }

  private handleShipDestroyed(): void {
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

    // Check if there's already a saucer on screen
    const existingSaucer = this.entities.find(e => e instanceof Saucer && e.getActive())
    if (existingSaucer) {
      return
    }

    // Check if it's time to spawn a saucer
    const now = performance.now()
    if (now >= this.nextSaucerSpawn) {
      this.spawnSaucer()
      this.nextSaucerSpawn = now + GAME_CONFIG.saucer.spawnInterval
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
    
    // Play saucer spawn sound (will be implemented later)
    // this.soundSystem.playSound('saucerAmbient')
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

  private completeLevel(): void {
    // Play level completion sound (before bonus display, non-blocking)
    this.soundSystem.playSound('levelCompletion')
    
    // Award bonus points for level completion (before incrementing level)
    const bonusPoints = this.gameState.level * GAMEPLAY.levelCompletionBonus
    this.addScore(bonusPoints)
    
    // Store bonus points for display on loading screen
    this.gameState.lastLevelBonus = bonusPoints
    
    this.gameState.level++
    this.events.onLevelChange(this.gameState.level)
    
    // Set game state to loading to show level loading screen
    const previousState = this.gameState.gameStatus
    this.gameState.gameStatus = 'loading'
    this.notifyStateChange()
    
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
        this.notifyStateChange()
      }
    }, GAMEPLAY.levelTransitionDelay)
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
    this.nextSaucerSpawn = this.levelStartTime + GAME_CONFIG.saucer.spawnInterval
  }

  private cleanupDeadEntities(): void {
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
      this.renderSystem.drawLevelLoading(this.gameState.level, this.gameState.lastLevelBonus)
    } else if (this.gameState.gameStatus === 'gameOver') {
      this.renderSystem.drawGameOver(this.gameState.score, this.gameState.highScore)
    } else if (this.gameState.gameStatus === 'menu') {
      // For menu state, just render the background and maybe the ship
      this.renderSystem.renderEntities([this.ship])
    }
  }

  private addScore(points: number, event?: ScoreEvent): void {
    this.gameState.score += points
    
    // Update high score
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score
      this.saveHighScore(this.gameState.highScore)
    }
    
    this.events.onScoreChange(this.gameState.score, event)
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
      this.notifyStateChange()
    }
  }

  resume(): void {
    if (this.gameState.gameStatus === 'paused') {
      this.gameState.gameStatus = 'playing'
      this.lastFrameTime = performance.now()
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