import { describe, it, expect } from 'vitest'
import { CollisionSystem } from '../engine/systems/CollisionSystem'
import { Asteroid } from '../engine/entities/Asteroid'
import { Bullet } from '../engine/entities/Bullet'
import { AsteroidSize } from '../types'

const IMPACT = { x: 100, y: 100 }
const SHIP_ID = 'ship-1'

function createBullet(): Bullet {
  return new Bullet(IMPACT, 0, { x: 0, y: 0 }, SHIP_ID)
}

describe('CollisionSystem duplicate-pair handling', () => {
  it('reports one pair per overlapping bullet', () => {
    const asteroid = new Asteroid(IMPACT, AsteroidSize.LARGE, { x: 0, y: 0 })
    const bullets = [createBullet(), createBullet()]

    const pairs = new CollisionSystem().checkCollisions([asteroid, ...bullets])

    expect(pairs).toHaveLength(2)
  })

  it('damages an asteroid only once when two bullets hit in the same frame', () => {
    const system = new CollisionSystem()
    const asteroid = new Asteroid(IMPACT, AsteroidSize.LARGE, { x: 0, y: 0 })
    const bullets = [createBullet(), createBullet()]

    system.resolveCollisions(system.checkCollisions([asteroid, ...bullets]))

    expect(asteroid.getActive()).toBe(false)
    // A second resolution would drive health to -1 and consume the second bullet
    expect(asteroid.getAsteroidState().health).toBe(0)
    expect(bullets[0].getActive()).toBe(false)
    expect(bullets[1].getActive()).toBe(true)
  })

  it('skips a pair whose entity was already destroyed', () => {
    const system = new CollisionSystem()
    const asteroid = new Asteroid(IMPACT, AsteroidSize.LARGE, { x: 0, y: 0 })
    const bullet = createBullet()
    const [pair] = system.checkCollisions([asteroid, bullet])

    asteroid.destroy()
    system.resolveCollision(pair)

    expect(bullet.getActive()).toBe(true)
    expect(asteroid.getAsteroidState().health).toBe(1)
  })
})
