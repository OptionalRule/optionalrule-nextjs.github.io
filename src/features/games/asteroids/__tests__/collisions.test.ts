import { describe, it, expect } from 'vitest'
import { collide } from '../engine/systems/collisions'
import { Asteroid } from '../engine/entities/Asteroid'
import { Bullet } from '../engine/entities/Bullet'
import { Saucer } from '../engine/entities/Saucer'
import { Ship } from '../engine/entities/Ship'
import { Explosion } from '../engine/entities/Explosion'
import type { Entity } from '../engine/entities/Entity'
import { AsteroidSize, SaucerSize } from '../types'
import { GAME_CONFIG } from '../constants'

const HERE = { x: 300, y: 300 }
const FAR = { x: 700, y: 500 }
const STILL = { x: 0, y: 0 }

function asteroidAt(position = HERE, size = AsteroidSize.LARGE): Asteroid {
  return new Asteroid(position, size, STILL)
}

function bulletFrom(sourceId: string, position = HERE): Bullet {
  return new Bullet(position, 0, STILL, sourceId)
}

function saucerAt(position = HERE): Saucer {
  return new Saucer(position, SaucerSize.LARGE, 'left')
}

function vulnerableShip(position = HERE): Ship {
  return new Ship(position)
}

function invulnerableShip(position = HERE): Ship {
  const ship = new Ship(position)
  ship.respawn(position)
  return ship
}

describe('collide', () => {
  it('scores a Player Bullet shooting an Asteroid', () => {
    const ship = vulnerableShip(FAR)
    const asteroid = asteroidAt()
    const bullet = bulletFrom(ship.getId())

    expect(collide([ship, asteroid, bullet], ship.getId())).toEqual([
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'player', points: GAME_CONFIG.asteroids.points.large },
    ])
  })

  it('awards no points when a Saucer Bullet shoots an Asteroid', () => {
    const ship = vulnerableShip(FAR)
    const asteroid = asteroidAt()
    const bullet = bulletFrom('saucer-1')

    expect(collide([ship, asteroid, bullet], ship.getId())).toEqual([
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'saucer', points: 0 },
    ])
  })

  it('lets only one of two Bullets shoot the same Asteroid', () => {
    const ship = vulnerableShip(FAR)
    const asteroid = asteroidAt()
    const first = bulletFrom(ship.getId())
    const second = bulletFrom(ship.getId())

    const outcomes = collide([ship, asteroid, first, second], ship.getId())

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]).toMatchObject({ kind: 'asteroidShot', bullet: first })
  })

  it('scores a Player Bullet shooting a Saucer', () => {
    const ship = vulnerableShip(FAR)
    const saucer = saucerAt()
    const bullet = bulletFrom(ship.getId())

    expect(collide([ship, saucer, bullet], ship.getId())).toEqual([
      { kind: 'saucerShot', saucer, bullet, shooter: 'player', points: GAME_CONFIG.saucer.points.large },
    ])
  })

  it('ignores a Saucer touching its own Saucer Bullet', () => {
    const ship = vulnerableShip(FAR)
    const saucer = saucerAt()
    const bullet = bulletFrom(saucer.getId())

    expect(collide([ship, saucer, bullet], ship.getId())).toEqual([])
  })

  it('destroys a vulnerable Ship touching an Asteroid', () => {
    const ship = vulnerableShip()
    const asteroid = asteroidAt()

    expect(collide([ship, asteroid], ship.getId())).toEqual([{ kind: 'shipDestroyed', ship }])
  })

  it('spares an Invulnerable Ship', () => {
    const ship = invulnerableShip()

    expect(collide([ship, asteroidAt(), saucerAt()], ship.getId())).toEqual([])
  })

  it('destroys a vulnerable Ship touching a Saucer', () => {
    const ship = vulnerableShip()
    const saucer = saucerAt()

    expect(collide([ship, saucer], ship.getId())).toEqual([{ kind: 'shipDestroyed', ship }])
  })

  it('destroys a vulnerable Ship hit by a Saucer Bullet and consumes the Bullet', () => {
    const ship = vulnerableShip()
    const bullet = bulletFrom('saucer-1')

    expect(collide([ship, bullet], ship.getId())).toEqual([{ kind: 'shipDestroyed', ship, bullet }])
  })

  it('ignores the Ship touching its own Player Bullet', () => {
    const ship = vulnerableShip()

    expect(collide([ship, bulletFrom(ship.getId())], ship.getId())).toEqual([])
  })

  it('ignores pairs that never collide', () => {
    const ship = vulnerableShip(FAR)
    const entities: Entity[] = [
      ship,
      asteroidAt(),
      saucerAt(),
      new Explosion(HERE, 'asteroid'),
      asteroidAt({ x: 100, y: 100 }),
      bulletFrom('saucer-1', { x: 500, y: 100 }),
      bulletFrom('saucer-2', { x: 500, y: 100 }),
    ]

    expect(collide(entities, ship.getId())).toEqual([])
  })

  it('ignores inactive entities', () => {
    const ship = vulnerableShip(FAR)
    const asteroid = asteroidAt()
    asteroid.destroy()

    expect(collide([ship, asteroid, bulletFrom(ship.getId())], ship.getId())).toEqual([])
  })

  it('does not change any entity', () => {
    const ship = vulnerableShip()
    const asteroid = asteroidAt()
    const bullet = bulletFrom(ship.getId())

    collide([ship, asteroid, bullet], ship.getId())

    expect([ship, asteroid, bullet].map(entity => entity.getActive())).toEqual([true, true, true])
  })

  it('leaves a Saucer Bullet that spared an Invulnerable Ship free to shoot an Asteroid', () => {
    const ship = invulnerableShip()
    const bullet = bulletFrom('saucer-1')
    const asteroid = asteroidAt()

    expect(collide([ship, bullet, asteroid], ship.getId())).toEqual([
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'saucer', points: 0 },
    ])
  })

  it('leaves an Asteroid that destroyed the Ship free to be shot', () => {
    const ship = vulnerableShip()
    const asteroid = asteroidAt()
    const bullet = bulletFrom('saucer-1', { x: 330, y: 300 })

    expect(collide([ship, asteroid, bullet], ship.getId())).toEqual([
      { kind: 'shipDestroyed', ship },
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'saucer', points: 0 },
    ])
  })

  it('does not let a Bullet that shot an Asteroid also destroy the Ship', () => {
    const asteroid = asteroidAt({ x: 313, y: 300 }, AsteroidSize.SMALL)
    const bullet = bulletFrom('saucer-1')
    const ship = vulnerableShip({ x: 291, y: 300 })

    expect(collide([bullet, asteroid, ship], ship.getId())).toEqual([
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'saucer', points: 0 },
    ])
  })

  it('does not let a Bullet that shot an Asteroid also shoot a Saucer', () => {
    const ship = vulnerableShip(FAR)
    const bullet = bulletFrom(ship.getId())
    const asteroid = asteroidAt()
    const saucer = saucerAt({ x: 310, y: 300 })

    expect(collide([ship, bullet, asteroid, saucer], ship.getId())).toEqual([
      { kind: 'asteroidShot', asteroid, bullet, shooter: 'player', points: GAME_CONFIG.asteroids.points.large },
    ])
  })

  it('destroys the Ship only once when an Asteroid and a Saucer Bullet both reach it', () => {
    const ship = vulnerableShip()
    const asteroid = asteroidAt({ x: 312, y: 300 }, AsteroidSize.SMALL)
    const bullet = bulletFrom('saucer-1', { x: 293, y: 300 })

    const outcomes = collide([ship, asteroid, bullet], ship.getId())

    expect(outcomes).toEqual([{ kind: 'shipDestroyed', ship }])
  })

  it('returns outcomes in entity order', () => {
    const ship = vulnerableShip(FAR)
    const near = asteroidAt({ x: 100, y: 100 })
    const nearBullet = bulletFrom(ship.getId(), { x: 100, y: 100 })
    const far = asteroidAt({ x: 500, y: 100 })
    const farBullet = bulletFrom(ship.getId(), { x: 500, y: 100 })

    const outcomes = collide([ship, far, near, nearBullet, farBullet], ship.getId())

    expect(outcomes.map(outcome => outcome.kind === 'asteroidShot' && outcome.asteroid)).toEqual([far, near])
  })
})
