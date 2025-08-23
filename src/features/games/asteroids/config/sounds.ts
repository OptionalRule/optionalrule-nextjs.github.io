export interface SoundConfig {
  enabled: boolean
  masterVolume: number
  categories: {
    effects: SoundCategory
    ui: SoundCategory
    ambient: SoundCategory
    music: SoundCategory
  }
  sounds: Record<string, SoundDefinition>
}

export interface SoundCategory {
  enabled: boolean
  volume: number
}

export interface SoundDefinition {
  path: string
  category: keyof SoundConfig['categories']
  volume?: number
  loop?: boolean
  preload?: boolean
  variants?: string[]
}

export const SOUND_CONFIG: SoundConfig = {
  enabled: true,
  masterVolume: 0.7,
  categories: {
    effects: { enabled: true, volume: 0.8 },
    ui: { enabled: true, volume: 0.6 },
    ambient: { enabled: true, volume: 0.4 },
    music: { enabled: false, volume: 0.5 }
  },
  sounds: {
    // Ship sounds
    shipThrust: {
      path: '/games/asteroids/sounds/ship_thrust.mp3',
      category: 'effects',
      volume: 0.3,
      loop: true,
      preload: true
    },
    shipDestroyed: {
      path: '/games/asteroids/sounds/ship_destroyed.mp3',
      category: 'effects',
      volume: 0.8,
      preload: true
    },
    shipRespawn: {
      path: '/games/asteroids/sounds/ship_respawn.mp3',
      category: 'effects',
      volume: 0.7,
      preload: true
    },

    // Weapon sounds with variations
    bulletFire: {
      path: '/games/asteroids/sounds/bullet_fire_1.mp3',
      category: 'effects',
      volume: 0.6,
      preload: true,
      variants: [
        '/games/asteroids/sounds/bullet_fire_1.mp3',
        '/games/asteroids/sounds/bullet_fire_2.mp3',
        '/games/asteroids/sounds/bullet_fire_3.mp3'
      ]
    },

    // Asteroid sounds with variations
    asteroidDestruction: {
      path: '/games/asteroids/sounds/asteroid_destruction_1.mp3',
      category: 'effects',
      volume: 0.7,
      preload: true,
      variants: [
        '/games/asteroids/sounds/asteroid_destruction_1.mp3',
        '/games/asteroids/sounds/asteroid_destruction_2.mp3',
        '/games/asteroids/sounds/asteroid_destruction_3.mp3'
      ]
    },
    asteroidSplit: {
      path: '/games/asteroids/sounds/asteroid_split_1.mp3',
      category: 'effects',
      volume: 0.6,
      preload: true,
      variants: [
        '/games/asteroids/sounds/asteroid_split_1.mp3',
        '/games/asteroids/sounds/asteroid_split_2.mp3',
        '/games/asteroids/sounds/asteroid_split_3.mp3'
      ]
    },

    // Game state sounds
    gameStart: {
      path: '/games/asteroids/sounds/game_start.mp3',
      category: 'ui',
      volume: 0.8,
      preload: true
    },
    gameOver: {
      path: '/games/asteroids/sounds/game_over.mp3',
      category: 'ui',
      volume: 0.9,
      preload: true
    },
    levelCompletion: {
      path: '/games/asteroids/sounds/level_completion.mp3',
      category: 'ui',
      volume: 0.8,
      preload: true
    },
    pause: {
      path: '/games/asteroids/sounds/pause.mp3',
      category: 'ui',
      volume: 0.6,
      preload: false
    },
    unpause: {
      path: '/games/asteroids/sounds/unpause.mp3',
      category: 'ui',
      volume: 0.6,
      preload: false
    },

    // Saucer sounds
    saucerAmbient: {
      path: '/games/asteroids/sounds/saucer_ambient.mp3',
      category: 'effects',
      volume: 0.3,
      loop: true,
      preload: false
    },
    saucerShoot: {
      path: '/games/asteroids/sounds/saucer_shoot_1.mp3',
      category: 'effects',
      volume: 0.6,
      preload: false,
      variants: [
        '/games/asteroids/sounds/saucer_shoot_1.mp3',
        '/games/asteroids/sounds/saucer_shoot_2.mp3'
      ]
    },
    saucerDestroyed: {
      path: '/games/asteroids/sounds/saucer_destroyed.mp3',
      category: 'effects',
      volume: 0.8,
      preload: false
    }
  }
}