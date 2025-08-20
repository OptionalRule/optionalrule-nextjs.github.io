import type { Vector2D, AsteroidState } from '../../types'
import { AsteroidSize } from '../../types'
import { GAME_CONFIG, COLORS, PHYSICS, RENDERING } from '../../constants'
import { Vector2DUtils } from '../utils/Vector2D'
import { GameMath } from '../utils/GameMath'
import { Entity } from './Entity'

export class Asteroid extends Entity {
  private size: AsteroidSize = AsteroidSize.MEDIUM
  private vertices: Vector2D[] = []
  private rotationSpeed: number = 0
  private health: number = 1

  constructor(position: Vector2D, size: AsteroidSize, velocity?: Vector2D) {
    super(position)
    
    this.size = size
    this.health = 1
    this.rotationSpeed = GameMath.randomFloat(-2, 2)
    
    // Set velocity if not provided
    if (velocity) {
      this.velocity = Vector2DUtils.clone(velocity)
    } else {
      const speed = GameMath.randomFloat(
        GAME_CONFIG.asteroids.minSpeed,
        GAME_CONFIG.asteroids.maxSpeed
      )
      this.velocity = GameMath.randomVector(speed, speed)
    }
    
    // Generate irregular asteroid shape
    this.generateVertices()
  }

  private generateVertices(): void {
    const baseRadius = this.getBaseRadius()
    this.vertices = GameMath.generateAsteroidVertices(baseRadius, 0.4)
  }

  private getBaseRadius(): number {
    switch (this.size) {
      case AsteroidSize.LARGE: return 40
      case AsteroidSize.MEDIUM: return 25
      case AsteroidSize.SMALL: return 12
      default: return 25
    }
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) return

    const deltaSeconds = deltaTime / 1000

    // Rotate asteroid
    this.rotation += this.rotationSpeed * deltaSeconds

    // Update position and apply wrapping
    this.updatePosition(deltaTime)
    this.applyWrapping(canvasWidth, canvasHeight, PHYSICS.wrapPadding)
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return

    // Get size-specific color
    const asteroidColor = COLORS.asteroids[this.size]

    ctx.save()
    
    // Add subtle outer glow effect
    ctx.shadowColor = asteroidColor
    ctx.shadowBlur = RENDERING.asteroidGlow
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    this.drawPolygon(ctx, this.vertices, COLORS.asteroidsFill, asteroidColor)
    
    ctx.restore()
  }

  split(): Asteroid[] {
    if (!this.canSplit()) return []

    const fragments: Asteroid[] = []
    const newSize = this.getNextSize()
    const fragmentCount = this.getFragmentCount()

    for (let i = 0; i < fragmentCount; i++) {
      // Create fragment at current position with random offset
      const offset = GameMath.randomVector(0, 10)
      const fragmentPosition = Vector2DUtils.add(this.position, offset)
      
      // Give fragments velocity based on parent + random component
      const baseSpeed = Vector2DUtils.magnitude(this.velocity)
      const fragmentSpeed = GameMath.randomFloat(baseSpeed * 0.8, baseSpeed * 1.5)
      const angle = GameMath.randomFloat(0, 2 * Math.PI)
      const fragmentVelocity = Vector2DUtils.fromAngle(angle, fragmentSpeed)
      
      const fragment = new Asteroid(fragmentPosition, newSize, fragmentVelocity)
      fragments.push(fragment)
    }

    return fragments
  }

  private canSplit(): boolean {
    return this.size === AsteroidSize.LARGE || this.size === AsteroidSize.MEDIUM
  }

  private getNextSize(): AsteroidSize {
    switch (this.size) {
      case AsteroidSize.LARGE: return AsteroidSize.MEDIUM
      case AsteroidSize.MEDIUM: return AsteroidSize.SMALL
      default: return AsteroidSize.SMALL
    }
  }

  private getFragmentCount(): number {
    switch (this.size) {
      case AsteroidSize.LARGE: return GAME_CONFIG.asteroids.splitCount.large
      case AsteroidSize.MEDIUM: return GAME_CONFIG.asteroids.splitCount.medium
      default: return 0
    }
  }

  takeDamage(): void {
    this.health--
    if (this.health <= 0) {
      this.destroy()
    }
  }

  getCollisionRadius(): number {
    return PHYSICS.collisionRadius.asteroid[this.size]
  }

  getEntityType(): string {
    return 'asteroid'
  }

  getSize(): AsteroidSize {
    return this.size
  }

  getPoints(): number {
    return GAME_CONFIG.asteroids.points[this.size]
  }

  getVertices(): Vector2D[] {
    return [...this.vertices]
  }

  getAsteroidState(): AsteroidState {
    return {
      ...this.getState(),
      size: this.size,
      vertices: this.getVertices(),
      health: this.health,
    }
  }

  static createField(
    count: number, 
    canvasWidth: number, 
    canvasHeight: number, 
    shipPosition: Vector2D,
    minDistance: number
  ): Asteroid[] {
    const asteroids: Asteroid[] = []
    
    for (let i = 0; i < count; i++) {
      const position = GameMath.safeSpawnPosition(
        canvasWidth,
        canvasHeight,
        shipPosition,
        minDistance
      )
      
      const asteroid = new Asteroid(position, AsteroidSize.LARGE)
      asteroids.push(asteroid)
    }
    
    return asteroids
  }
}