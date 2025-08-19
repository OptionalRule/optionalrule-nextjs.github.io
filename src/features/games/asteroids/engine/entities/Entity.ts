import type { Vector2D, EntityState } from '../../types'
import { Vector2DUtils } from '../utils/Vector2D'

// Fallback UUID generator for environments without crypto.randomUUID
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback to simple random ID
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36)
}

export abstract class Entity {
  protected id: string
  protected position: Vector2D
  protected velocity: Vector2D
  protected rotation: number
  protected isActive: boolean

  constructor(position: Vector2D = Vector2DUtils.zero()) {
    this.id = generateId()
    this.position = Vector2DUtils.clone(position)
    this.velocity = Vector2DUtils.zero()
    this.rotation = 0
    this.isActive = true
  }

  abstract update(deltaTime: number, canvasWidth: number, canvasHeight: number): void
  abstract render(ctx: CanvasRenderingContext2D): void
  abstract getCollisionRadius(): number

  getId(): string {
    return this.id
  }

  getPosition(): Vector2D {
    return Vector2DUtils.clone(this.position)
  }

  setPosition(position: Vector2D): void {
    this.position = Vector2DUtils.clone(position)
  }

  getVelocity(): Vector2D {
    return Vector2DUtils.clone(this.velocity)
  }

  setVelocity(velocity: Vector2D): void {
    this.velocity = Vector2DUtils.clone(velocity)
  }

  getRotation(): number {
    return this.rotation
  }

  setRotation(rotation: number): void {
    this.rotation = rotation
  }

  getActive(): boolean {
    return this.isActive
  }

  setActive(active: boolean): void {
    this.isActive = active
  }

  destroy(): void {
    this.isActive = false
  }

  getState(): EntityState {
    return {
      position: this.getPosition(),
      velocity: this.getVelocity(),
      rotation: this.rotation,
      isActive: this.isActive,
    }
  }

  protected updatePosition(deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000
    const deltaPos = Vector2DUtils.multiply(this.velocity, deltaSeconds)
    this.position = Vector2DUtils.add(this.position, deltaPos)
  }

  protected applyWrapping(canvasWidth: number, canvasHeight: number, padding = 50): void {
    if (this.position.x < -padding) {
      this.position.x = canvasWidth + padding
    } else if (this.position.x > canvasWidth + padding) {
      this.position.x = -padding
    }

    if (this.position.y < -padding) {
      this.position.y = canvasHeight + padding
    } else if (this.position.y > canvasHeight + padding) {
      this.position.y = -padding
    }
  }

  protected drawPolygon(ctx: CanvasRenderingContext2D, vertices: Vector2D[], fillColor?: string, strokeColor?: string): void {
    if (vertices.length < 3) return

    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)

    ctx.beginPath()
    ctx.moveTo(vertices[0].x, vertices[0].y)
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y)
    }
    
    ctx.closePath()

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.restore()
  }

  protected drawCircle(ctx: CanvasRenderingContext2D, radius: number, fillColor?: string, strokeColor?: string): void {
    ctx.save()
    ctx.translate(this.position.x, this.position.y)

    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, 2 * Math.PI)

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.restore()
  }
}