import type { GameConfig } from './types'

// Main game configuration - all values should be adjusted here
export const ASTEROIDS_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  ship: {
    acceleration: 300,
    maxSpeed: 400,
    rotationSpeed: 3,
    friction: 0.99,
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
      large: 2,
      medium: 3,
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

// Input configuration
export const CONTROLS = {
  ArrowLeft: 'rotateLeft',
  ArrowRight: 'rotateRight',
  ArrowUp: 'thrust',
  Space: 'shoot',
  Enter: 'restart',
  Escape: 'pause',
} as const

// Visual styling configuration
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

// Physics and collision configuration
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

// Gameplay configuration
export const GAMEPLAY = {
  // Level progression
  baseAsteroidCount: 5,
  maxAsteroidCount: 12,
  asteroidIncrement: 1,
  levelCompletionBonus: 100,
  
  // Ship respawn
  respawnDelay: 2000,
  
  // Level timing
  levelTransitionDelay: 2000,
  
  // Asteroid spawning
  asteroidMinDistance: 150,
  asteroidSafeSpawnAttempts: 100,
  
  // Entity limits
  bulletNoseOffset: 15,
  
  // Animation and effects
  thrustAnimationSpeed: 8,
  invulnerabilityFlashInterval: 300,
  invulnerabilityFlashSkip: 3,
  
  // Performance settings
  assumedFramerate: 60, // For time-independent calculations
} as const

// Rendering configuration
export const RENDERING = {
  // Canvas settings
  pixelRatioEnabled: true,
  imageSmoothingEnabled: false,
  
  // Background effects
  starCount: 100,
  starTwinkleSpeed: 5,
  starBaseAlpha: 0.3,
  starMaxAlpha: 0.7,
  
  // Text styling
  defaultFont: 'monospace',
  hudFontSize: 24,
  gameOverTitleSize: 48,
  gameOverScoreSize: 24,
  gameOverHighScoreSize: 20,
  gameOverInstructionSize: 18,
  pauseTitleSize: 48,
  pauseInstructionSize: 18,
  debugFontSize: 14,
  
  // UI positioning
  hudPadding: 20,
  
  // Effects
  bulletRadius: 3,
  bulletGlow: 10,
  asteroidGlow: 5,
  textShadowBlur: 10,
  
  // Overlay alphas
  gameOverOverlayAlpha: 0.7,
  pauseOverlayAlpha: 0.5,
  
  // Debug rendering
  debugLineWidth: 1,
  debugAlpha: 0.5,
  
  // Entity shapes
  shipVertices: [
    { x: 12, y: 0 },    // Nose (pointing right)
    { x: -8, y: -8 },   // Left wing
    { x: -4, y: 0 },    // Rear center
    { x: -8, y: 8 },    // Right wing
  ],
  thrustVertices: [
    { x: -8, y: -4 },   // Left
    { x: -16, y: 0 },   // Tip
    { x: -8, y: 4 },    // Right
  ],
  
  // FPS monitoring
  fpsUpdateInterval: 1000,
} as const

// Audio configuration (for future implementation)
export const AUDIO = {
  enabled: true,
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
} as const

// Development and debug configuration
export const DEBUG = {
  enabled: false,
  showCollisionBounds: false,
  showFPS: false,
  showEntityCount: false,
  logPerformance: false,
} as const

// Consolidated export for backwards compatibility
export const GAME_CONFIG = ASTEROIDS_CONFIG