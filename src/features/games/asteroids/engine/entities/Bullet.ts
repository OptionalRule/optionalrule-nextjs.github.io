import type { Vector2D, BulletState } from '../../types'
import { GAME_CONFIG, COLORS, PHYSICS, RENDERING } from '../../constants'
import { Vector2DUtils } from '../utils/Vector2D'
import { GameMath } from '../utils/GameMath'
import { Entity } from './Entity'

export class Bullet extends Entity {
  private lifetime: number
  private sourceId: string
  private maxLifetime: number
  private bulletColor: string

  constructor(position: Vector2D, direction: number, sourceVelocity: Vector2D, sourceId: string, color?: string) {
    super(position)
    
    this.sourceId = sourceId
    this.maxLifetime = GAME_CONFIG.bullets.lifetime
    this.lifetime = this.maxLifetime
    this.bulletColor = color || COLORS.bullets
    
    // Set bullet velocity: source velocity + bullet speed in direction
    const bulletVelocity = Vector2DUtils.fromAngle(direction, GAME_CONFIG.bullets.speed)
    this.velocity = Vector2DUtils.add(sourceVelocity, bulletVelocity)
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) return

    // Update lifetime
    this.lifetime -= deltaTime
    if (this.lifetime <= 0) {
      this.destroy()
      return
    }

    // Update position
    this.updatePosition(deltaTime)

    // Destroy if off screen (bullets don't wrap)
    if (GameMath.isOffScreen(this.position, canvasWidth, canvasHeight, 50)) {
      this.destroy()
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return

    // Calculate fade based on remaining lifetime
    const fadeRatio = this.lifetime / this.maxLifetime
    const alpha = Math.min(1.0, fadeRatio)
    
    ctx.save()
    ctx.globalAlpha = alpha
    
    // Draw bullet as glowing circle
    ctx.shadowColor = this.bulletColor
    ctx.shadowBlur = RENDERING.bulletGlow
    
    this.drawCircle(ctx, RENDERING.bulletRadius, this.bulletColor)
    
    ctx.restore()
  }

  getCollisionRadius(): number {
    return PHYSICS.collisionRadius.bullet
  }

  getEntityType(): string {
    return 'bullet'
  }

  getSourceId(): string {
    return this.sourceId
  }

  getRemainingLifetime(): number {
    return this.lifetime
  }

  getBulletState(): BulletState {
    return {
      ...this.getState(),
      lifetime: this.lifetime,
      sourceId: this.sourceId,
    }
  }
}