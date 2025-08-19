import type { Vector2D } from '../../types'

export class Vector2DUtils {
  static create(x = 0, y = 0): Vector2D {
    return { x, y }
  }

  static clone(vector: Vector2D): Vector2D {
    return { x: vector.x, y: vector.y }
  }

  static add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y }
  }

  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y }
  }

  static multiply(vector: Vector2D, scalar: number): Vector2D {
    return { x: vector.x * scalar, y: vector.y * scalar }
  }

  static divide(vector: Vector2D, scalar: number): Vector2D {
    if (scalar === 0) return { x: 0, y: 0 }
    return { x: vector.x / scalar, y: vector.y / scalar }
  }

  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y
  }

  static magnitude(vector: Vector2D): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  }

  static magnitudeSquared(vector: Vector2D): number {
    return vector.x * vector.x + vector.y * vector.y
  }

  static normalize(vector: Vector2D): Vector2D {
    const mag = this.magnitude(vector)
    if (mag === 0) return { x: 0, y: 0 }
    return this.divide(vector, mag)
  }

  static distance(a: Vector2D, b: Vector2D): number {
    return this.magnitude(this.subtract(a, b))
  }

  static distanceSquared(a: Vector2D, b: Vector2D): number {
    return this.magnitudeSquared(this.subtract(a, b))
  }

  static angle(vector: Vector2D): number {
    return Math.atan2(vector.y, vector.x)
  }

  static fromAngle(angle: number, magnitude = 1): Vector2D {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude,
    }
  }

  static rotate(vector: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: vector.x * cos - vector.y * sin,
      y: vector.x * sin + vector.y * cos,
    }
  }

  static lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    }
  }

  static equals(a: Vector2D, b: Vector2D, epsilon = 1e-10): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
  }

  static zero(): Vector2D {
    return { x: 0, y: 0 }
  }

  static one(): Vector2D {
    return { x: 1, y: 1 }
  }

  static up(): Vector2D {
    return { x: 0, y: -1 }
  }

  static down(): Vector2D {
    return { x: 0, y: 1 }
  }

  static left(): Vector2D {
    return { x: -1, y: 0 }
  }

  static right(): Vector2D {
    return { x: 1, y: 0 }
  }
}