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

export interface GameplayConfig {
  baseAsteroidCount: number
  maxAsteroidCount: number
  asteroidIncrement: number
  levelCompletionBonus: number
  respawnDelay: number
  levelTransitionDelay: number
  asteroidMinDistance: number
  asteroidSafeSpawnAttempts: number
  bulletNoseOffset: number
  thrustAnimationSpeed: number
  invulnerabilityFlashInterval: number
  invulnerabilityFlashSkip: number
  assumedFramerate: number
}

export interface RenderingConfig {
  pixelRatioEnabled: boolean
  imageSmoothingEnabled: boolean
  starCount: number
  starTwinkleSpeed: number
  starBaseAlpha: number
  starMaxAlpha: number
  defaultFont: string
  hudFontSize: number
  gameOverTitleSize: number
  gameOverScoreSize: number
  gameOverHighScoreSize: number
  gameOverInstructionSize: number
  pauseTitleSize: number
  pauseInstructionSize: number
  debugFontSize: number
  hudPadding: number
  bulletRadius: number
  bulletGlow: number
  asteroidGlow: number
  textShadowBlur: number
  gameOverOverlayAlpha: number
  pauseOverlayAlpha: number
  debugLineWidth: number
  debugAlpha: number
  shipVertices: Vector2D[]
  thrustVertices: Vector2D[]
  fpsUpdateInterval: number
}

export interface PhysicsConfig {
  wrapPadding: number
  collisionRadius: {
    ship: number
    bullet: number
    asteroid: {
      large: number
      medium: number
      small: number
    }
    saucer: {
      large: number
      small: number
    }
  }
}

export interface ColorsConfig {
  ship: string
  shipFill: string
  asteroids: string
  asteroidsFill: string
  bullets: string
  thrust: string[]
  ui: string
  background: string
  backgroundGradient: string
}

export interface ControlsConfig {
  ArrowLeft: string
  ArrowRight: string
  ArrowUp: string
  Space: string
  Enter: string
  Escape: string
}

export interface AudioConfig {
  enabled: boolean
  masterVolume: number
  sfxVolume: number
  musicVolume: number
}

export interface DebugConfig {
  enabled: boolean
  showCollisionBounds: boolean
  showFPS: boolean
  showEntityCount: boolean
  logPerformance: boolean
}