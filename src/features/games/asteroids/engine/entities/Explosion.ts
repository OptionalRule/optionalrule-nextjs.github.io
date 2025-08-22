import type { Vector2D } from '../../types'
import { Vector2DUtils } from '../utils/Vector2D'
import { GameMath } from '../utils/GameMath'
import { Entity } from './Entity'
import { COLORS } from '../../constants'

interface Particle {
  position: Vector2D
  velocity: Vector2D
  life: number
  maxLife: number
  size: number
  color: string
}

export class Explosion extends Entity {
  private particles: Particle[] = []
  private duration: number
  private maxDuration: number
  private explosionType: 'ship' | 'asteroid'

  constructor(position: Vector2D, explosionType: 'ship' | 'asteroid' = 'ship') {
    super(position)
    
    this.explosionType = explosionType
    this.maxDuration = explosionType === 'ship' ? 1000 : 500 // Ship explosion lasts much longer
    this.duration = this.maxDuration
    
    this.createParticles()
  }

  private createParticles(): void {
    const particleCount = this.explosionType === 'ship' ? 12 : 4
    const colors = this.explosionType === 'ship' 
      ? ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffffff']
      : ['#ff6347', '#ffa500']
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + GameMath.randomFloat(-0.3, 0.3)
      const speed = this.explosionType === 'ship' 
        ? GameMath.randomFloat(50, 150)
        : GameMath.randomFloat(20, 60)
      const life = this.explosionType === 'ship' 
        ? GameMath.randomFloat(600, 1000)
        : GameMath.randomFloat(200, 400)
      
      const particle: Particle = {
        position: Vector2DUtils.clone(this.position),
        velocity: Vector2DUtils.fromAngle(angle, speed),
        life: life,
        maxLife: life,
        size: this.explosionType === 'ship' 
          ? GameMath.randomFloat(2, 6)
          : GameMath.randomFloat(1, 3),
        color: colors[Math.floor(Math.random() * colors.length)]
      }
      
      this.particles.push(particle)
    }
    
    // Add some random debris particles for ship explosion
    if (this.explosionType === 'ship') {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = GameMath.randomFloat(20, 80)
        const life = GameMath.randomFloat(800, 1200)
        
        const particle: Particle = {
          position: Vector2DUtils.add(this.position, {
            x: GameMath.randomFloat(-5, 5),
            y: GameMath.randomFloat(-5, 5)
          }),
          velocity: Vector2DUtils.fromAngle(angle, speed),
          life: life,
          maxLife: life,
          size: GameMath.randomFloat(1, 3),
          color: COLORS.ship
        }
        
        this.particles.push(particle)
      }
    }
  }

  update(deltaTime: number, _canvasWidth: number, _canvasHeight: number): void {
    void _canvasWidth
    void _canvasHeight
    if (!this.isActive) return

    this.duration -= deltaTime
    
    // Update particles
    for (const particle of this.particles) {
      if (particle.life <= 0) continue
      
      // Update particle position
      const deltaSeconds = deltaTime / 1000
      const deltaPos = Vector2DUtils.multiply(particle.velocity, deltaSeconds)
      particle.position = Vector2DUtils.add(particle.position, deltaPos)
      
      // Apply friction/drag to particles
      particle.velocity = Vector2DUtils.multiply(particle.velocity, 0.98)
      
      // Update particle life
      particle.life -= deltaTime
    }
    
    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.life > 0)
    
    // Destroy explosion when duration is over or no particles remain
    if (this.duration <= 0 || this.particles.length === 0) {
      this.destroy()
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive || this.particles.length === 0) return

    ctx.save()
    
    for (const particle of this.particles) {
      if (particle.life <= 0) continue
      
      // Calculate alpha based on remaining life
      const lifeRatio = particle.life / particle.maxLife
      const alpha = Math.max(0, lifeRatio)
      
      // Calculate size based on life (particles shrink over time)
      const currentSize = particle.size * (0.3 + lifeRatio * 0.7)
      
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      
      // Add glow effect for brighter particles
      if (particle.color.includes('ff')) {
        ctx.shadowColor = particle.color
        ctx.shadowBlur = currentSize * 2
      }
      
      ctx.beginPath()
      ctx.arc(particle.position.x, particle.position.y, currentSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Reset shadow for next particle
      ctx.shadowBlur = 0
    }
    
    ctx.restore()
  }

  getCollisionRadius(): number {
    return 0 // Explosions don't collide with anything
  }

  getEntityType(): string {
    return 'explosion'
  }

  // Get current particle count (for debugging)
  getParticleCount(): number {
    return this.particles.length
  }

  // Get explosion progress (0 = just started, 1 = finished)
  getProgress(): number {
    return 1 - (this.duration / this.maxDuration)
  }
}