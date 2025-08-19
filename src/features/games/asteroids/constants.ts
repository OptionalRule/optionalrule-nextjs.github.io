import type { GameConfig } from './types'

export const GAME_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  ship: {
    acceleration: 300,
    maxSpeed: 400,
    rotationSpeed: 4,
    friction: 0.98,
    invulnerabilityTime: 2000,
    startingLives: 3,
  },
  bullets: {
    speed: 500,
    lifetime: 2000,
    maxCount: 10,
    cooldown: 250,
  },
  asteroids: {
    minSpeed: 20,
    maxSpeed: 80,
    splitCount: {
      large: 3,
      medium: 4,
    },
    points: {
      large: 20,
      medium: 50,
      small: 100,
    },
  },
  saucer: {
    points: {
      large: 200,
      small: 1000,
    },
    spawnInterval: 30000,
    shootInterval: 2000,
  },
}

export const CONTROLS = {
  ArrowLeft: 'rotateLeft',
  ArrowRight: 'rotateRight',
  ArrowUp: 'thrust',
  Space: 'shoot',
  Enter: 'restart',
  Escape: 'pause',
} as const

export const COLORS = {
  ship: '#00ffff',
  shipFill: '#003333',
  asteroids: '#00ff00',
  asteroidsFill: '#333333',
  bullets: '#ffff00',
  thrust: ['#ff4400', '#ff8800', '#ffaa00'],
  ui: '#00ff00',
  background: '#000011',
  backgroundGradient: '#001122',
} as const

export const PHYSICS = {
  wrapPadding: 5,
  collisionRadius: {
    ship: 8,
    bullet: 2,
    asteroid: {
      large: 40,
      medium: 25,
      small: 12,
    },
    saucer: {
      large: 20,
      small: 12,
    },
  },
} as const