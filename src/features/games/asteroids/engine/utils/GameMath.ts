import type { Vector2D } from '../../types'
import { Vector2DUtils } from './Vector2D'
import { GAMEPLAY } from '../../constants'

export class GameMath {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)
  }

  static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  static radToDeg(radians: number): number {
    return radians * (180 / Math.PI)
  }

  static normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI
    while (angle < -Math.PI) angle += 2 * Math.PI
    return angle
  }

  static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  static randomBool(): boolean {
    return Math.random() < 0.5
  }

  static randomSign(): number {
    return this.randomBool() ? 1 : -1
  }

  static randomVector(minMagnitude: number, maxMagnitude: number): Vector2D {
    const angle = this.randomFloat(0, 2 * Math.PI)
    const magnitude = this.randomFloat(minMagnitude, maxMagnitude)
    return Vector2DUtils.fromAngle(angle, magnitude)
  }

  static wrapPosition(position: Vector2D, width: number, height: number, padding = 0): Vector2D {
    const wrapped = Vector2DUtils.clone(position)
    
    if (wrapped.x < -padding) wrapped.x = width + padding
    else if (wrapped.x > width + padding) wrapped.x = -padding
    
    if (wrapped.y < -padding) wrapped.y = height + padding
    else if (wrapped.y > height + padding) wrapped.y = -padding
    
    return wrapped
  }

  static isOffScreen(position: Vector2D, width: number, height: number, margin = 100): boolean {
    return position.x < -margin || 
           position.x > width + margin || 
           position.y < -margin || 
           position.y > height + margin
  }

  static circleCollision(
    posA: Vector2D, 
    radiusA: number, 
    posB: Vector2D, 
    radiusB: number
  ): boolean {
    const distance = Vector2DUtils.distance(posA, posB)
    return distance < radiusA + radiusB
  }

  static generateAsteroidVertices(size: number, irregularity = 0.3): Vector2D[] {
    const vertices: Vector2D[] = []
    const vertexCount = this.randomInt(6, 10)
    
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * 2 * Math.PI
      const radius = size * (1 + this.randomFloat(-irregularity, irregularity))
      
      vertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      })
    }
    
    return vertices
  }

  static pointInPolygon(point: Vector2D, vertices: Vector2D[]): boolean {
    let inside = false
    let j = vertices.length - 1
    
    for (let i = 0; i < vertices.length; i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y
      
      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
      j = i
    }
    
    return inside
  }

  static safeSpawnPosition(
    width: number, 
    height: number, 
    shipPosition: Vector2D, 
    minDistance: number
  ): Vector2D {
    let attempts = 0
    const maxAttempts = GAMEPLAY.asteroidSafeSpawnAttempts
    
    while (attempts < maxAttempts) {
      const position = {
        x: this.randomFloat(0, width),
        y: this.randomFloat(0, height),
      }
      
      if (Vector2DUtils.distance(position, shipPosition) >= minDistance) {
        return position
      }
      
      attempts++
    }
    
    // Fallback to edge spawn
    const edge = this.randomInt(0, 3)
    switch (edge) {
      case 0: return { x: 0, y: this.randomFloat(0, height) }
      case 1: return { x: width, y: this.randomFloat(0, height) }
      case 2: return { x: this.randomFloat(0, width), y: 0 }
      default: return { x: this.randomFloat(0, width), y: height }
    }
  }

  static easeInOut(t: number): number {
    return t * t * (3.0 - 2.0 * t)
  }

  static easeIn(t: number): number {
    return t * t
  }

  static easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t)
  }
}