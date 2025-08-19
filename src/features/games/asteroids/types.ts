export interface Vector2D {
  x: number
  y: number
}

export interface GameState {
  score: number
  lives: number
  level: number
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver'
  highScore: number
}

export interface EntityState {
  position: Vector2D
  velocity: Vector2D
  rotation: number
  isActive: boolean
}

export interface ShipState extends EntityState {
  isThrusting: boolean
  isInvulnerable: boolean
  invulnerabilityTimer: number
}

export interface AsteroidState extends EntityState {
  size: AsteroidSize
  vertices: Vector2D[]
  health: number
}

export interface BulletState extends EntityState {
  lifetime: number
  sourceId: string
}

export interface SaucerState extends EntityState {
  size: SaucerSize
  direction: number
  shootTimer: number
}

export enum AsteroidSize {
  LARGE = 'large',
  MEDIUM = 'medium',
  SMALL = 'small'
}

export enum SaucerSize {
  LARGE = 'large',
  SMALL = 'small'
}

export interface LevelConfig {
  asteroidCount: number
  asteroidSpeed: number
  saucerSpawnRate: number
  saucerSpeed: number
}

export interface GameConfig {
  canvas: {
    width: number
    height: number
  }
  ship: {
    acceleration: number
    maxSpeed: number
    rotationSpeed: number
    friction: number
    invulnerabilityTime: number
    startingLives: number
  }
  bullets: {
    speed: number
    lifetime: number
    maxCount: number
    cooldown: number
  }
  asteroids: {
    minSpeed: number
    maxSpeed: number
    splitCount: {
      large: number
      medium: number
    }
    points: {
      large: number
      medium: number
      small: number
    }
  }
  saucer: {
    points: {
      large: number
      small: number
    }
    spawnInterval: number
    shootInterval: number
  }
}

export interface CollisionEvent {
  entityA: string
  entityB: string
  position: Vector2D
}

export interface ScoreEvent {
  points: number
  position: Vector2D
  type: 'asteroid' | 'saucer'
}

export interface GameEvent {
  type: 'collision' | 'score' | 'levelComplete' | 'gameOver' | 'shipDestroyed'
  data: CollisionEvent | ScoreEvent | number
}