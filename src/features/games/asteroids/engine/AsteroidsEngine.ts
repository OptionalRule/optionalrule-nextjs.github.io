import type { GameState, ScoreEvent } from '../types'
import { GAME_CONFIG, GAMEPLAY } from '../constants'
import { Vector2DUtils } from './utils/Vector2D'
import { Entity } from './entities/Entity'
import { Ship } from './entities/Ship'
import { Asteroid } from './entities/Asteroid'
import { Bullet } from './entities/Bullet'
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

    if (asteroid && bullet && !asteroid.getActive()) {
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

    // Handle ship destruction
    if (!this.ship.getActive()) {
      this.handleShipDestroyed()
    }
  }

  private handleShipDestroyed(): void {
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
    // TODO: Implement saucer spawning logic
    // For now, we'll skip saucers in the initial implementation
  }

  private completeLevel(): void {
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
    this.entities = this.entities.filter(e => e instanceof Ship)
    
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
    this.gameState.gameStatus = 'gameOver'
    this.events.onGameOver(this.gameState.score)
    this.notifyStateChange()
  }

  private togglePause(): void {
    if (this.gameState.gameStatus === 'playing') {
      this.gameState.gameStatus = 'paused'
    } else if (this.gameState.gameStatus === 'paused') {
      this.gameState.gameStatus = 'playing'
      this.lastFrameTime = performance.now() // Reset frame timing
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