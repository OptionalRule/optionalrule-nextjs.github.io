import { describe, it, expect, vi } from 'vitest'
import { AsteroidsEngine, type AsteroidsEngineEvents } from '../engine/AsteroidsEngine'
import { Asteroid } from '../engine/entities/Asteroid'
import { Bullet } from '../engine/entities/Bullet'
import type { Entity } from '../engine/entities/Entity'
import { AsteroidSize } from '../types'

function noOpSystem(): object {
  return new Proxy({}, { get: () => () => undefined })
}

vi.mock('../engine/systems/RenderSystem', () => ({
  RenderSystem: function RenderSystem() {
    return noOpSystem()
  },
}))

vi.mock('../engine/systems/SoundSystem', () => ({
  SoundSystem: function SoundSystem() {
    return noOpSystem()
  },
}))

interface EngineInternals {
  ship: Entity
  handleCollisionEffects(entityA: Entity, entityB: Entity): void
}

function createEngine(): AsteroidsEngine {
  const events: AsteroidsEngineEvents = {
    onGameStateChange: vi.fn(),
    onScoreChange: vi.fn(),
    onLivesChange: vi.fn(),
    onLevelChange: vi.fn(),
    onGameOver: vi.fn(),
    onExtraLife: vi.fn(),
  }
  return new AsteroidsEngine(document.createElement('canvas'), events)
}

function destroyAsteroidWith(engine: AsteroidsEngine, sourceId: string): void {
  const internals = engine as unknown as EngineInternals
  const asteroid = new Asteroid({ x: 100, y: 100 }, AsteroidSize.LARGE, { x: 0, y: 0 })
  asteroid.setActive(false)
  const bullet = new Bullet({ x: 100, y: 100 }, 0, { x: 0, y: 0 }, sourceId)
  internals.handleCollisionEffects(asteroid, bullet)
}

describe('asteroid scoring', () => {
  it('awards points when the player destroys an asteroid', () => {
    const engine = createEngine()
    const shipId = (engine as unknown as EngineInternals).ship.getId()

    destroyAsteroidWith(engine, shipId)

    expect(engine.getGameState().score).toBeGreaterThan(0)
  })

  it('awards no points when a saucer destroys an asteroid', () => {
    const engine = createEngine()

    destroyAsteroidWith(engine, 'saucer-1')

    expect(engine.getGameState().score).toBe(0)
  })
})
