import type { Vector2D, ShipState } from '../../types'
import { GAME_CONFIG, COLORS, PHYSICS, GAMEPLAY, RENDERING } from '../../constants'
import { Vector2DUtils } from '../utils/Vector2D'
import { Entity } from './Entity'

export class Ship extends Entity {
  private isThrusting = false
  private isInvulnerable = false
  private invulnerabilityTimer = 0
  private thrustTween = 0
  private shipVertices: Vector2D[] = RENDERING.shipVertices
  private thrustVertices: Vector2D[] = RENDERING.thrustVertices

  constructor(position: Vector2D) {
    super(position)
    this.rotation = -Math.PI / 2 // Point upward initially
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) return

    const deltaSeconds = deltaTime / 1000
    const config = GAME_CONFIG.ship

    // Update invulnerability
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= deltaTime
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false
      }
    }

    // Apply friction
    this.velocity = Vector2DUtils.multiply(this.velocity, config.friction)

    // Limit speed
    const speed = Vector2DUtils.magnitude(this.velocity)
    if (speed > config.maxSpeed) {
      this.velocity = Vector2DUtils.multiply(
        Vector2DUtils.normalize(this.velocity),
        config.maxSpeed
      )
    }

    // Update thrust animation
    const targetTween = this.isThrusting ? 1.0 : 0.0
    this.thrustTween += (targetTween - this.thrustTween) * GAMEPLAY.thrustAnimationSpeed * deltaSeconds

    // Update position and apply wrapping
    this.updatePosition(deltaTime)
    this.applyWrapping(canvasWidth, canvasHeight, PHYSICS.wrapPadding)
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return

    // Render thrust flame first (behind ship)
    if (this.thrustTween > 0.1) {
      this.renderThrust(ctx)
    }

    // Render ship with invulnerability flashing (slower flash, more visible)
    if (!this.isInvulnerable || Math.floor(Date.now() / GAMEPLAY.invulnerabilityFlashInterval) % GAMEPLAY.invulnerabilityFlashSkip !== 0) {
      this.drawPolygon(ctx, this.shipVertices, COLORS.shipFill, COLORS.ship)
    }
  }

  private renderThrust(ctx: CanvasRenderingContext2D): void {
    const intensity = this.thrustTween * (0.8 + 0.2 * Math.sin(Date.now() * 0.02))
    const scaledVertices = this.thrustVertices.map(vertex => 
      Vector2DUtils.multiply(vertex, intensity)
    )

    ctx.save()
    ctx.translate(this.position.x, this.position.y)
    ctx.rotate(this.rotation)

    // Create gradient for flame effect
    const gradient = ctx.createLinearGradient(0, 8, 0, 16)
    gradient.addColorStop(0, COLORS.thrust[0])
    gradient.addColorStop(0.5, COLORS.thrust[1])
    gradient.addColorStop(1, COLORS.thrust[2])

    ctx.beginPath()
    ctx.moveTo(scaledVertices[0].x, scaledVertices[0].y)
    for (let i = 1; i < scaledVertices.length; i++) {
      ctx.lineTo(scaledVertices[i].x, scaledVertices[i].y)
    }
    ctx.closePath()

    ctx.fillStyle = gradient
    ctx.fill()

    ctx.restore()
  }

  rotate(direction: -1 | 1): void {
    if (!this.isActive) return
    const deltaTime = 1000 / GAMEPLAY.assumedFramerate // Assume configured framerate for rotation smoothness
    this.rotation += direction * GAME_CONFIG.ship.rotationSpeed * (deltaTime / 1000)
  }

  thrust(): void {
    if (!this.isActive) return
    
    this.isThrusting = true
    const deltaTime = 1000 / GAMEPLAY.assumedFramerate // Assume configured framerate
    const deltaSeconds = deltaTime / 1000
    
    const thrustVector = Vector2DUtils.fromAngle(
      this.rotation, 
      GAME_CONFIG.ship.acceleration * deltaSeconds
    )
    
    this.velocity = Vector2DUtils.add(this.velocity, thrustVector)
  }

  stopThrust(): void {
    this.isThrusting = false
  }

  respawn(position: Vector2D): void {
    this.position = Vector2DUtils.clone(position)
    this.velocity = Vector2DUtils.zero()
    this.rotation = -Math.PI / 2
    this.isActive = true
    this.isInvulnerable = true
    this.invulnerabilityTimer = GAME_CONFIG.ship.invulnerabilityTime
    this.isThrusting = false
    this.thrustTween = 0
  }

  takeDamage(): void {
    if (this.isInvulnerable) return
    this.destroy()
  }

  getCollisionRadius(): number {
    return PHYSICS.collisionRadius.ship
  }

  getCanCollide(): boolean {
    return this.isActive && !this.isInvulnerable
  }

  getShipState(): ShipState {
    return {
      ...this.getState(),
      isThrusting: this.isThrusting,
      isInvulnerable: this.isInvulnerable,
      invulnerabilityTimer: this.invulnerabilityTimer,
    }
  }
}