import type { Vector2D, GameEvent } from '../../types'
import { Vector2DUtils } from '../utils/Vector2D'
import { GameMath } from '../utils/GameMath'
import type { Entity } from '../entities/Entity'
import type { Ship } from '../entities/Ship'
import type { Bullet } from '../entities/Bullet'
import type { Asteroid } from '../entities/Asteroid'
import type { Saucer } from '../entities/Saucer'

export interface CollisionPair {
  entityA: Entity
  entityB: Entity
  collisionPoint: Vector2D
}

export class CollisionSystem {
  private gameEvents: GameEvent[] = []

  checkCollisions(entities: Entity[]): CollisionPair[] {
    const collisions: CollisionPair[] = []
    this.gameEvents = []

    // Check all entity pairs for collisions
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i]
        const entityB = entities[j]

        if (!entityA.getActive() || !entityB.getActive()) continue

        const collision = this.checkEntityCollision(entityA, entityB)
        if (collision) {
          collisions.push(collision)
          
          // Create collision event
          this.gameEvents.push({
            type: 'collision',
            data: {
              entityA: entityA.getId(),
              entityB: entityB.getId(),
              position: collision.collisionPoint,
            }
          })
        }
      }
    }

    return collisions
  }

  private checkEntityCollision(entityA: Entity, entityB: Entity): CollisionPair | null {
    // Skip collision if entities shouldn't collide
    if (!this.shouldCollide(entityA, entityB)) {
      return null
    }

    const posA = entityA.getPosition()
    const posB = entityB.getPosition()
    const radiusA = entityA.getCollisionRadius()
    const radiusB = entityB.getCollisionRadius()

    // Simple circle collision detection
    if (GameMath.circleCollision(posA, radiusA, posB, radiusB)) {
      // Calculate collision point (midpoint between centers)
      const collisionPoint = Vector2DUtils.lerp(posA, posB, 0.5)
      
      return {
        entityA,
        entityB,
        collisionPoint,
      }
    }

    return null
  }

  private shouldCollide(entityA: Entity, entityB: Entity): boolean {
    const typeA = this.getEntityType(entityA)
    const typeB = this.getEntityType(entityB)

    // Define collision rules
    const collisionRules: Record<string, string[]> = {
      'ship': ['asteroid', 'saucer', 'bullet'],
      'bullet': ['asteroid', 'saucer'],
      'asteroid': ['ship', 'bullet'],
      'saucer': ['ship', 'bullet'],
    }

    return collisionRules[typeA]?.includes(typeB) || 
           collisionRules[typeB]?.includes(typeA)
  }

  private getEntityType(entity: Entity): string {
    return entity.getEntityType()
  }

  resolveCollisions(collisions: CollisionPair[]): void {
    for (const collision of collisions) {
      this.resolveCollision(collision)
    }
  }

  private resolveCollision(collision: CollisionPair): void {
    const { entityA, entityB } = collision
    const typeA = this.getEntityType(entityA)
    const typeB = this.getEntityType(entityB)

    // Handle ship-asteroid collision
    if ((typeA === 'ship' && typeB === 'asteroid') ||
        (typeA === 'asteroid' && typeB === 'ship')) {
      this.handleShipAsteroidCollision(
        typeA === 'ship' ? entityA as Ship : entityB as Ship
      )
    }

    // Handle bullet-asteroid collision
    if ((typeA === 'bullet' && typeB === 'asteroid') ||
        (typeA === 'asteroid' && typeB === 'bullet')) {
      this.handleBulletAsteroidCollision(
        typeA === 'bullet' ? entityA as Bullet : entityB as Bullet,
        typeA === 'asteroid' ? entityA as Asteroid : entityB as Asteroid
      )
    }

    // Handle ship-saucer collision
    if ((typeA === 'ship' && typeB === 'saucer') ||
        (typeA === 'saucer' && typeB === 'ship')) {
      this.handleShipSaucerCollision(
        typeA === 'ship' ? entityA as Ship : entityB as Ship
      )
    }

    // Handle bullet-saucer collision
    if ((typeA === 'bullet' && typeB === 'saucer') ||
        (typeA === 'saucer' && typeB === 'bullet')) {
      this.handleBulletSaucerCollision(
        typeA === 'bullet' ? entityA as Bullet : entityB as Bullet,
        typeA === 'saucer' ? entityA as Saucer : entityB as Saucer
      )
    }

    // Handle ship-bullet collision (saucer bullets hitting ship)
    if ((typeA === 'ship' && typeB === 'bullet') ||
        (typeA === 'bullet' && typeB === 'ship')) {
      this.handleShipBulletCollision(
        typeA === 'ship' ? entityA as Ship : entityB as Ship,
        typeA === 'bullet' ? entityA as Bullet : entityB as Bullet
      )
    }
  }

  private handleShipAsteroidCollision(ship: Ship): void {
    // Check if ship can actually collide (not invulnerable)
    if ('getCanCollide' in ship && typeof ship.getCanCollide === 'function') {
      if (!ship.getCanCollide()) return
    }

    // Destroy ship
    if ('takeDamage' in ship && typeof ship.takeDamage === 'function') {
      ship.takeDamage()
    }

    // Note: We don't destroy the asteroid in ship collision
    // This maintains classic Asteroids behavior
  }

  private handleBulletAsteroidCollision(bullet: Bullet, asteroid: Asteroid): void {
    // Destroy bullet
    bullet.destroy()

    // Damage asteroid
    if ('takeDamage' in asteroid && typeof asteroid.takeDamage === 'function') {
      asteroid.takeDamage()
    }
  }

  private handleShipSaucerCollision(ship: Ship): void {
    // Check if ship can actually collide (not invulnerable)
    if ('getCanCollide' in ship && typeof ship.getCanCollide === 'function') {
      if (!ship.getCanCollide()) return
    }

    // Destroy ship
    if ('takeDamage' in ship && typeof ship.takeDamage === 'function') {
      ship.takeDamage()
    }

    // Note: We don't destroy the saucer in ship collision
    // This maintains consistent behavior with asteroids
  }

  private handleBulletSaucerCollision(bullet: Bullet, saucer: Saucer): void {
    // Check if bullet was fired by the same saucer - if so, ignore collision
    if (bullet.getSourceId() === saucer.getId()) {
      return
    }

    // Destroy bullet
    bullet.destroy()

    // Destroy saucer
    saucer.destroy()
  }

  private handleShipBulletCollision(ship: Ship, bullet: Bullet): void {
    // Check if bullet was fired by the ship - if so, ignore collision
    if (bullet.getSourceId() === ship.getId()) {
      return
    }

    // Check if ship can actually collide (not invulnerable)
    if ('getCanCollide' in ship && typeof ship.getCanCollide === 'function') {
      if (!ship.getCanCollide()) return
    }

    // Destroy bullet
    bullet.destroy()

    // Destroy ship
    if ('takeDamage' in ship && typeof ship.takeDamage === 'function') {
      ship.takeDamage()
    }
  }

  getGameEvents(): GameEvent[] {
    return [...this.gameEvents]
  }

  clearEvents(): void {
    this.gameEvents = []
  }

  // Spatial partitioning optimization for large numbers of entities
  private spatialPartition(entities: Entity[], cellSize: number): Map<string, Entity[]> {
    const grid = new Map<string, Entity[]>()

    for (const entity of entities) {
      if (!entity.getActive()) continue

      const position = entity.getPosition()
      const cellX = Math.floor(position.x / cellSize)
      const cellY = Math.floor(position.y / cellSize)
      const key = `${cellX},${cellY}`

      if (!grid.has(key)) {
        grid.set(key, [])
      }
      grid.get(key)!.push(entity)
    }

    return grid
  }

  // Optimized collision detection for large entity counts
  checkCollisionsOptimized(entities: Entity[], cellSize = 100): CollisionPair[] {
    if (entities.length < 50) {
      // Use simple O(n²) for small entity counts
      return this.checkCollisions(entities)
    }

    const collisions: CollisionPair[] = []
    this.gameEvents = []
    const grid = this.spatialPartition(entities, cellSize)

    // Check collisions within each cell and adjacent cells
    for (const [key, cellEntities] of grid) {
      const [x, y] = key.split(',').map(Number)
      
      // Get entities from this cell and adjacent cells
      const nearbyEntities = new Set(cellEntities)
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const adjKey = `${x + dx},${y + dy}`
          const adjEntities = grid.get(adjKey) || []
          adjEntities.forEach(entity => nearbyEntities.add(entity))
        }
      }

      const entitiesArray = Array.from(nearbyEntities)
      
      // Check collisions within nearby entities
      for (let i = 0; i < entitiesArray.length; i++) {
        for (let j = i + 1; j < entitiesArray.length; j++) {
          const entityA = entitiesArray[i]
          const entityB = entitiesArray[j]

          if (!entityA.getActive() || !entityB.getActive()) continue

          const collision = this.checkEntityCollision(entityA, entityB)
          if (collision) {
            collisions.push(collision)
            
            this.gameEvents.push({
              type: 'collision',
              data: {
                entityA: entityA.getId(),
                entityB: entityB.getId(),
                position: collision.collisionPoint,
              }
            })
          }
        }
      }
    }

    return collisions
  }
}