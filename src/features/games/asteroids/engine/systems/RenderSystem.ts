import type { Vector2D } from '../../types'
import { COLORS, GAME_CONFIG } from '../../constants'
import type { Entity } from '../entities/Entity'

export interface RenderOptions {
  showDebugInfo: boolean
  showCollisionBounds: boolean
  showFPS: boolean
}

export class RenderSystem {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private lastFPS = 0
  private frameCount = 0
  private lastFPSUpdate = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get 2D rendering context')
    }
    this.ctx = context
    
    // Set up canvas rendering optimizations
    this.setupCanvas()
  }

  private setupCanvas(): void {
    // Enable hardware acceleration hints
    this.ctx.imageSmoothingEnabled = false
    
    // Set up pixel ratio for high DPI displays
    const pixelRatio = window.devicePixelRatio || 1
    
    // Use game config dimensions for internal canvas size
    this.canvas.width = GAME_CONFIG.canvas.width * pixelRatio
    this.canvas.height = GAME_CONFIG.canvas.height * pixelRatio
    
    this.ctx.scale(pixelRatio, pixelRatio)
    
    // Set canvas display size to match game dimensions
    this.canvas.style.width = GAME_CONFIG.canvas.width + 'px'
    this.canvas.style.height = GAME_CONFIG.canvas.height + 'px'
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawBackground()
  }

  private drawBackground(): void {
    // Create starfield background gradient
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
    )
    gradient.addColorStop(0, COLORS.background)
    gradient.addColorStop(1, COLORS.backgroundGradient)
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Add subtle stars
    this.drawStarfield()
  }

  private drawStarfield(): void {
    const starCount = 100
    const time = Date.now() * 0.0001
    
    this.ctx.save()
    
    for (let i = 0; i < starCount; i++) {
      // Use deterministic random based on star index
      const x = (Math.sin(i * 43.758) * 0.5 + 0.5) * this.canvas.width
      const y = (Math.sin(i * 67.293) * 0.5 + 0.5) * this.canvas.height
      
      // Twinkling effect
      const twinkle = Math.sin(time * 5 + i) * 0.5 + 0.5
      const alpha = 0.3 + twinkle * 0.4
      
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(x, y, 1, 1)
    }
    
    this.ctx.restore()
  }

  renderEntities(entities: Entity[], options: RenderOptions = { showDebugInfo: false, showCollisionBounds: false, showFPS: false }): void {
    // Sort entities by render priority (background to foreground)
    const sortedEntities = this.sortEntitiesByRenderPriority(entities)
    
    // Render each entity
    for (const entity of sortedEntities) {
      if (entity.getActive()) {
        entity.render(this.ctx)
        
        // Debug rendering
        if (options.showCollisionBounds) {
          this.drawCollisionBounds(entity)
        }
      }
    }
    
    // Render debug info
    if (options.showDebugInfo) {
      this.renderDebugInfo(entities)
    }
    
    if (options.showFPS) {
      this.renderFPS()
    }
  }

  private sortEntitiesByRenderPriority(entities: Entity[]): Entity[] {
    return entities.sort((a, b) => {
      const priorityA = this.getRenderPriority(a)
      const priorityB = this.getRenderPriority(b)
      return priorityA - priorityB
    })
  }

  private getRenderPriority(entity: Entity): number {
    const type = entity.constructor.name.toLowerCase()
    
    // Lower numbers render first (background)
    switch (type) {
      case 'asteroid': return 1
      case 'saucer': return 2
      case 'bullet': return 3
      case 'ship': return 4
      default: return 5
    }
  }

  private drawCollisionBounds(entity: Entity): void {
    const position = entity.getPosition()
    const radius = entity.getCollisionRadius()
    
    this.ctx.save()
    this.ctx.strokeStyle = '#ff0000'
    this.ctx.lineWidth = 1
    this.ctx.globalAlpha = 0.5
    
    this.ctx.beginPath()
    this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI)
    this.ctx.stroke()
    
    this.ctx.restore()
  }

  private renderDebugInfo(entities: Entity[]): void {
    const activeEntities = entities.filter(e => e.getActive())
    const entityCounts = this.getEntityCounts(activeEntities)
    
    this.ctx.save()
    this.ctx.fillStyle = COLORS.ui
    this.ctx.font = '14px monospace'
    this.ctx.textAlign = 'left'
    
    let y = 20
    const lineHeight = 16
    
    this.ctx.fillText(`Total Entities: ${activeEntities.length}`, 10, y)
    y += lineHeight
    
    for (const [type, count] of Object.entries(entityCounts)) {
      this.ctx.fillText(`${type}: ${count}`, 10, y)
      y += lineHeight
    }
    
    this.ctx.restore()
  }

  private getEntityCounts(entities: Entity[]): Record<string, number> {
    const counts: Record<string, number> = {}
    
    for (const entity of entities) {
      const type = entity.constructor.name
      counts[type] = (counts[type] || 0) + 1
    }
    
    return counts
  }

  private renderFPS(): void {
    this.updateFPS()
    
    this.ctx.save()
    this.ctx.fillStyle = COLORS.ui
    this.ctx.font = '14px monospace'
    this.ctx.textAlign = 'right'
    
    this.ctx.fillText(`FPS: ${this.lastFPS}`, this.canvas.width - 10, 20)
    
    this.ctx.restore()
  }

  private updateFPS(): void {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFPSUpdate >= 1000) {
      this.lastFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate))
      this.frameCount = 0
      this.lastFPSUpdate = now
    }
  }

  drawText(text: string, position: Vector2D, options: {
    font?: string
    color?: string
    align?: CanvasTextAlign
    baseline?: CanvasTextBaseline
    shadow?: boolean
  } = {}): void {
    const {
      font = '20px monospace',
      color = COLORS.ui,
      align = 'center',
      baseline = 'middle',
      shadow = true
    } = options
    
    this.ctx.save()
    
    this.ctx.font = font
    this.ctx.fillStyle = color
    this.ctx.textAlign = align
    this.ctx.textBaseline = baseline
    
    if (shadow) {
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 10
    }
    
    this.ctx.fillText(text, position.x, position.y)
    
    this.ctx.restore()
  }

  drawHUD(score: number, lives: number, level: number): void {
    const padding = 20
    const fontSize = 24
    
    this.ctx.save()
    this.ctx.font = `${fontSize}px monospace`
    this.ctx.fillStyle = COLORS.ui
    this.ctx.shadowColor = COLORS.ui
    this.ctx.shadowBlur = 10
    
    // Score (top left)
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`SCORE: ${score.toLocaleString()}`, padding, padding + fontSize)
    
    // Lives (top right)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`LIVES: ${lives}`, this.canvas.width - padding, padding + fontSize)
    
    // Level (top center)
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`LEVEL: ${level}`, this.canvas.width / 2, padding + fontSize)
    
    this.ctx.restore()
  }

  drawGameOver(finalScore: number, highScore: number): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    // Semi-transparent overlay
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Game Over text
    this.drawText('GAME OVER', { x: centerX, y: centerY - 60 }, {
      font: '48px monospace',
      color: '#ff4444',
      shadow: true
    })
    
    // Final score
    this.drawText(`FINAL SCORE: ${finalScore.toLocaleString()}`, { x: centerX, y: centerY - 10 }, {
      font: '24px monospace'
    })
    
    // High score
    this.drawText(`HIGH SCORE: ${highScore.toLocaleString()}`, { x: centerX, y: centerY + 20 }, {
      font: '20px monospace'
    })
    
    // Restart instruction
    this.drawText('PRESS ENTER TO RESTART', { x: centerX, y: centerY + 60 }, {
      font: '18px monospace',
      color: '#ffff88'
    })
    
    this.ctx.restore()
  }

  drawPauseScreen(): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    // Semi-transparent overlay
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.drawText('PAUSED', { x: centerX, y: centerY }, {
      font: '48px monospace',
      color: '#ffff00',
      shadow: true
    })
    
    this.drawText('PRESS ESC TO RESUME', { x: centerX, y: centerY + 50 }, {
      font: '18px monospace'
    })
    
    this.ctx.restore()
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  resize(width: number, height: number): void {
    const pixelRatio = window.devicePixelRatio || 1
    
    // Always use game config dimensions regardless of requested size
    this.canvas.width = GAME_CONFIG.canvas.width * pixelRatio
    this.canvas.height = GAME_CONFIG.canvas.height * pixelRatio
    this.canvas.style.width = GAME_CONFIG.canvas.width + 'px'
    this.canvas.style.height = GAME_CONFIG.canvas.height + 'px'
    
    this.ctx.scale(pixelRatio, pixelRatio)
    this.ctx.imageSmoothingEnabled = false
  }
}