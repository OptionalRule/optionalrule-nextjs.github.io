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
    shipThrust: {
      path: '/games/asteroids/sounds/ship_thrust.mp3',
      category: 'effects',
      volume: 0.3,
      loop: true,
      preload: true
    },
    bulletFire: {
      path: '/games/asteroids/sounds/bullet_fire.mp3',
      category: 'effects',
      volume: 0.6,
      preload: true
    },
    asteroidDestruction: {
      path: '/games/asteroids/sounds/asteroid_destruction.mp3',
      category: 'effects',
      volume: 0.7,
      preload: true
    },
    asteroidSplit: {
      path: '/games/asteroids/sounds/asteroid_split.mp3',
      category: 'effects',
      volume: 0.6,
      preload: true
    },
    shipDestroyed: {
      path: '/games/asteroids/sounds/ship_destroyed.mp3',
      category: 'effects',
      volume: 0.8,
      preload: true
    }
  }
}