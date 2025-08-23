import type { Vector2D, SaucerState } from '../../types'
import { SaucerSize } from '../../types'
import { GAME_CONFIG, COLORS, PHYSICS, RENDERING } from '../../constants'
import { Vector2DUtils } from '../utils/Vector2D'
import { GameMath } from '../utils/GameMath'
import { Entity } from './Entity'

export class Saucer extends Entity {
  private size: SaucerSize
  private direction: number
  private shootTimer: number
  private movementTimer: number
  private nextDirectionChange: number
  private speed: number
  private saucerVertices: Vector2D[]
  private startSide: 'left' | 'right'
  private hasExited: boolean = false

  constructor(position: Vector2D, size: SaucerSize, startSide: 'left' | 'right') {
    super(position)
    
    this.size = size
    this.startSide = startSide
    this.direction = startSide === 'left' ? 0 : Math.PI // Start moving right or left
    this.shootTimer = 0
    this.movementTimer = 0
    this.nextDirectionChange = GameMath.randomFloat(1000, 3000) // 1-3 seconds
    
    // Set speed based on size
    this.speed = size === SaucerSize.LARGE ? 80 : 120
    
    // Set vertices based on size
    this.saucerVertices = size === SaucerSize.LARGE 
      ? RENDERING.saucerVertices.large 
      : RENDERING.saucerVertices.small
    
    // Set initial velocity
    this.velocity = Vector2DUtils.fromAngle(this.direction, this.speed)
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) return

    this.updateMovement(deltaTime)
    this.updateShooting(deltaTime)
    this.updatePosition(deltaTime)
    this.checkBoundaries(canvasWidth, canvasHeight)
  }

  private updateMovement(deltaTime: number): void {
    this.movementTimer += deltaTime
    
    // Check if it's time to change direction
    if (this.movementTimer >= this.nextDirectionChange) {
      this.changeDirection()
      this.movementTimer = 0
      this.nextDirectionChange = GameMath.randomFloat(1000, 3000)
    }
    
    // Update velocity based on current direction
    this.velocity = Vector2DUtils.fromAngle(this.direction, this.speed)
  }

  private changeDirection(): void {
    // Add some randomness to the direction while maintaining general forward movement
    const baseDirection = this.startSide === 'left' ? 0 : Math.PI
    const variation = GameMath.randomFloat(-Math.PI / 3, Math.PI / 3) // ±60 degrees
    this.direction = baseDirection + variation
  }

  private updateShooting(deltaTime: number): void {
    this.shootTimer += deltaTime
  }

  private checkBoundaries(canvasWidth: number, canvasHeight: number): void {
    // Check if saucer has exited the screen on the opposite side
    if (this.startSide === 'left' && this.position.x > canvasWidth + 50) {
      this.hasExited = true
      this.destroy()
    } else if (this.startSide === 'right' && this.position.x < -50) {
      this.hasExited = true
      this.destroy()
    }
    
    // Vertical wrapping to keep saucer on screen
    if (this.position.y < -50) {
      this.position.y = canvasHeight + 50
    } else if (this.position.y > canvasHeight + 50) {
      this.position.y = -50
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return

    // Draw saucer with neon green color and glow effect
    ctx.save()
    
    // Add glow effect
    ctx.shadowColor = COLORS.saucer
    ctx.shadowBlur = RENDERING.saucerGlow
    
    // Draw main saucer body
    this.drawPolygon(ctx, this.saucerVertices, COLORS.saucerFill, COLORS.saucer)
    
    // Draw additional details for visual interest
    this.renderDetails(ctx)
    
    ctx.restore()
  }

  private renderDetails(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    
    // Draw dome highlights
    const domeRadius = this.size === SaucerSize.LARGE ? 8 : 5
    ctx.strokeStyle = COLORS.saucer
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(0, -6, domeRadius, 0, Math.PI, true)
    ctx.stroke()
    
    // Draw small lights on the saucer
    const lightPositions = this.size === SaucerSize.LARGE 
      ? [{ x: -15, y: 0 }, { x: -5, y: 0 }, { x: 5, y: 0 }, { x: 15, y: 0 }]
      : [{ x: -8, y: 0 }, { x: 0, y: 0 }, { x: 8, y: 0 }]
    
    ctx.fillStyle = COLORS.saucer
    for (const light of lightPositions) {
      ctx.beginPath()
      ctx.arc(light.x, light.y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }

  canShoot(): boolean {
    return this.shootTimer >= GAME_CONFIG.saucer.shootInterval
  }

  resetShootTimer(): void {
    this.shootTimer = 0
  }

  getShootPosition(): Vector2D {
    // Return position slightly offset from center for bullet spawn
    return Vector2DUtils.add(this.position, { x: 0, y: 5 })
  }

  calculateShootDirection(targetPosition: Vector2D): number {
    // Calculate direction to target with some inaccuracy for balance
    const toTarget = Vector2DUtils.subtract(targetPosition, this.position)
    const baseDirection = Math.atan2(toTarget.y, toTarget.x)
    
    // Add some inaccuracy based on saucer size (small saucers are more accurate)
    const inaccuracy = this.size === SaucerSize.LARGE ? 0.3 : 0.15
    const variation = GameMath.randomFloat(-inaccuracy, inaccuracy)
    
    return baseDirection + variation
  }

  getPoints(): number {
    return GAME_CONFIG.saucer.points[this.size]
  }

  getCollisionRadius(): number {
    return PHYSICS.collisionRadius.saucer[this.size]
  }

  getEntityType(): string {
    return 'saucer'
  }

  getSize(): SaucerSize {
    return this.size
  }

  hasExitedScreen(): boolean {
    return this.hasExited
  }

  getSaucerState(): SaucerState {
    return {
      ...this.getState(),
      size: this.size,
      direction: this.direction,
      shootTimer: this.shootTimer,
    }
  }
}