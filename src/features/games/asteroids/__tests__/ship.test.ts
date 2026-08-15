import { describe, it, expect } from 'vitest'
import { Ship } from '../engine/entities/Ship'
import { GAME_CONFIG } from '../constants'

const CANVAS_WIDTH = GAME_CONFIG.canvas.width
const CANVAS_HEIGHT = GAME_CONFIG.canvas.height

function createShip(): Ship {
  return new Ship({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
}

describe('Ship frame-rate independence', () => {
  it('rotates the same amount regardless of step size', () => {
    const coarse = createShip()
    coarse.rotate(1, 32)

    const fine = createShip()
    fine.rotate(1, 16)
    fine.rotate(1, 16)

    expect(fine.getRotation()).toBeCloseTo(coarse.getRotation(), 10)
  })

  it('accelerates the same amount regardless of step size', () => {
    const coarse = createShip()
    coarse.thrust(32)

    const fine = createShip()
    fine.thrust(16)
    fine.thrust(16)

    expect(fine.getVelocity().x).toBeCloseTo(coarse.getVelocity().x, 10)
    expect(fine.getVelocity().y).toBeCloseTo(coarse.getVelocity().y, 10)
  })

  it('decays velocity by the same factor over the same elapsed time', () => {
    const coarse = createShip()
    coarse.setVelocity({ x: 100, y: 0 })
    coarse.update(100, CANVAS_WIDTH, CANVAS_HEIGHT)

    const fine = createShip()
    fine.setVelocity({ x: 100, y: 0 })
    for (let i = 0; i < 4; i++) {
      fine.update(25, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    expect(fine.getVelocity().x).toBeCloseTo(coarse.getVelocity().x, 8)
  })

  it('matches the legacy per-frame friction at the reference framerate', () => {
    const ship = createShip()
    ship.setVelocity({ x: 100, y: 0 })
    ship.update(1000 / 60, CANVAS_WIDTH, CANVAS_HEIGHT)

    expect(ship.getVelocity().x).toBeCloseTo(100 * GAME_CONFIG.ship.friction, 8)
  })
})
