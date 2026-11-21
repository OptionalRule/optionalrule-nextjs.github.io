import { GameMath } from '../utils/GameMath'
import type { Entity } from '../entities/Entity'
import { Ship } from '../entities/Ship'
import { Bullet } from '../entities/Bullet'
import { Asteroid } from '../entities/Asteroid'
import { Saucer } from '../entities/Saucer'

export type Shooter = 'player' | 'saucer'

export type CollisionOutcome =
  | { kind: 'asteroidShot'; asteroid: Asteroid; bullet: Bullet; shooter: Shooter; points: number }
  | { kind: 'saucerShot'; saucer: Saucer; bullet: Bullet; shooter: Shooter; points: number }
  | { kind: 'shipDestroyed'; ship: Ship; bullet?: Bullet }

export function collide(entities: readonly Entity[], playerShipId: string): CollisionOutcome[] {
  const outcomes: CollisionOutcome[] = []
  const consumed = new Set<Entity>()
  const isLive = (entity: Entity): boolean => entity.getActive() && !consumed.has(entity)

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]
      const b = entities[j]
      if (!isLive(a) || !isLive(b) || !touching(a, b)) continue

      const outcome = decide(a, b, playerShipId)
      if (!outcome) continue

      outcomes.push(outcome)
      for (const entity of destroyedBy(outcome)) consumed.add(entity)
    }
  }

  return outcomes
}

function touching(a: Entity, b: Entity): boolean {
  return GameMath.circleCollision(a.getPosition(), a.getCollisionRadius(), b.getPosition(), b.getCollisionRadius())
}

function decide(a: Entity, b: Entity, playerShipId: string): CollisionOutcome | null {
  const ship = pick(a, b, Ship)
  const bullet = pick(a, b, Bullet)
  const asteroid = pick(a, b, Asteroid)
  const saucer = pick(a, b, Saucer)

  if (ship && (asteroid || saucer)) {
    return ship.getCanCollide() ? { kind: 'shipDestroyed', ship } : null
  }

  if (ship && bullet) {
    if (bullet.getSourceId() === ship.getId() || !ship.getCanCollide()) return null
    return { kind: 'shipDestroyed', ship, bullet }
  }

  if (bullet && asteroid) {
    const shooter = shooterOf(bullet, playerShipId)
    return { kind: 'asteroidShot', asteroid, bullet, shooter, points: shooter === 'player' ? asteroid.getPoints() : 0 }
  }

  if (bullet && saucer) {
    if (bullet.getSourceId() === saucer.getId()) return null
    const shooter = shooterOf(bullet, playerShipId)
    return { kind: 'saucerShot', saucer, bullet, shooter, points: shooter === 'player' ? saucer.getPoints() : 0 }
  }

  return null
}

function pick<T extends Entity>(a: Entity, b: Entity, type: abstract new (...args: never[]) => T): T | null {
  if (a instanceof type) return a
  if (b instanceof type) return b
  return null
}

function shooterOf(bullet: Bullet, playerShipId: string): Shooter {
  return bullet.getSourceId() === playerShipId ? 'player' : 'saucer'
}

function destroyedBy(outcome: CollisionOutcome): Entity[] {
  switch (outcome.kind) {
    case 'asteroidShot':
      return [outcome.asteroid, outcome.bullet]
    case 'saucerShot':
      return [outcome.saucer, outcome.bullet]
    case 'shipDestroyed':
      return outcome.bullet ? [outcome.ship, outcome.bullet] : [outcome.ship]
  }
}
