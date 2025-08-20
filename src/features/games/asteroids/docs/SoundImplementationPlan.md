# Asteroids Game Sound Plan

## Comprehensive Sound Events List

Based on the classic Asteroids game and the current implementation, here are all events that should receive sounds:

Core Gameplay Events

1. Ship Thrust - Continuous engine sound while thrusting
2. Ship Rotation - Brief mechanical rotation sound (optional)
3. Bullet Fire - Sharp laser/projectile firing sound
4. Asteroid Hit - Impact sound when bullet hits asteroid
5. Asteroid Destruction - Explosion sound when asteroid is destroyed
6. Asteroid Split - Rock breaking/cracking sound when asteroid splits

Ship Events

7. Ship Destroyed - Large explosion sound when ship is hit
8. Ship Respawn - Teleportation/materialization sound
9. Ship Invulnerability - Subtle energy shield sound (looping while invulnerable)

Game State Events

10. Game Start - Power-up/activation sound
11. Level Complete - Success/completion sound
12. Level Start - New level announcement sound
13. Game Over - Defeat/shutdown sound
14. High Score - Achievement sound when new high score is reached
15. Pause/Unpause - UI confirmation sounds

UI Events

16. Menu Navigation - Button hover/click sounds
17. Score Increment - Points awarded sound (pitched based on points)

Future Enhancement Events

18. Saucer Appearance - UFO arrival sound
19. Saucer Fire - Different bullet sound for enemy
20. Saucer Destroyed - Unique explosion for saucer
21. Power-up Collect - Item collection sound (if power-ups added)

## Sound System Architecture Plan

### Core Components

SoundSystem Class (src/features/games/asteroids/engine/systems/SoundSystem.ts)

- Centralized audio management
- Sound loading, caching, and playback
- Volume control and muting
- Audio context management
  
SoundManager Service

- Singleton pattern for global sound control
- Handles audio preloading
- Manages audio context lifecycle

Sound Configuration

- JSON configuration file for all sound mappings
- Volume levels per sound type
- Enable/disable flags for different sound categories

Integration Points

- AsteroidsEngine: Add SoundSystem as a dependency
- Entities: Emit sound events through the engine
- UI Components: Trigger menu/UI sounds
- Game Events: Hook into existing GameEvent system

## Sound Configuration Structure

Configuration File: src/features/games/asteroids/config/sounds.ts

```typescript
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

  interface SoundCategory {
    enabled: boolean
    volume: number
  }

  interface SoundDefinition {
    path: string
    category: keyof SoundConfig['categories']
    volume?: number
    loop?: boolean
    preload?: boolean
    variants?: string[] // For randomized sound variations
  }
```

Example Configuration

```yaml
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
        path: '/sounds/ship-thrust.mp3',
        category: 'effects',
        volume: 0.3,
        loop: true,
        preload: true
      },
      bulletFire: {
        path: '/sounds/bullet-fire.mp3',
        category: 'effects',
        volume: 0.6,
        variants: ['/sounds/bullet-fire-1.mp3', '/sounds/bullet-fire-2.mp3']
      },
      asteroidHit: {
        path: '/sounds/asteroid-hit.mp3',
        category: 'effects',
        volume: 0.7
      }
      // ... etc
    }
  }
```

## Implementation Plan

  Phase 1: Core Sound System Infrastructure

  1. Create SoundSystem class
    - Audio context management
    - Sound loading and caching
    - Playback controls (play, pause, stop, volume)
    - Error handling for missing/failed audio files
  2. Add sound configuration
    - Create sounds.ts config file
    - Add sound settings to main game config
    - Include user preference persistence
  3. Integrate with AsteroidsEngine
    - Add SoundSystem as engine dependency
    - Create sound event emission methods
    - Add sound initialization to engine constructor

  Phase 2: Entity Sound Integration

  4. Ship sound events
    - Thrust sound (continuous while thrusting)
    - Destruction sound
    - Respawn sound
  5. Bullet sound events
    - Fire sound in handleShooting() method
    - Impact sound in collision resolution
  6. Asteroid sound events
    - Hit sound in takeDamage() method
    - Split sound in split() method
    - Destruction sound in collision handling

  Phase 3: Game State Sounds

  7. Game flow sounds
    - Start game sound
    - Level completion sound
    - Game over sound
    - Pause/unpause sounds
  8. UI sounds
    - Menu navigation sounds
    - Score increment sounds
    - High score achievement sound

  Phase 4: User Controls

  9. Sound settings UI
    - Master volume control
    - Category volume controls
    - Mute toggles
    - Settings persistence
  10. Audio optimization
    - Preload critical sounds
    - Implement sound pooling for repeated effects
    - Add audio format fallbacks (MP3/OGG/WAV)

  Phase 5: Enhancement Features

  11. Advanced audio features
    - 3D positioning for directional audio
    - Dynamic volume based on distance
    - Sound variations to prevent repetition
    - Ambient background music

  File Structure Changes

  src/features/games/asteroids/
  ├── config/
  │   └── sounds.ts                 # Sound configuration
  ├── engine/
  │   ├── systems/
  │   │   └── SoundSystem.ts        # Core sound system
  │   └── services/
  │       └── SoundManager.ts       # Global sound service
  ├── types/
  │   └── sound.ts                  # Sound-related types
  └── assets/
      └── sounds/                   # Sound files directory
          ├── ship-thrust.mp3
          ├── bullet-fire.mp3
          ├── asteroid-hit.mp3
          └── ...

  Key Implementation Considerations

  - Browser Compatibility: Handle Web Audio API vs HTML5 Audio fallbacks
  - User Interaction Requirement: Modern browsers require user interaction before audio playback
  - Performance: Implement audio pooling for frequently played sounds
  - Accessibility: Provide visual alternatives for audio cues
  - Static Site: Ensure audio files are properly included in static build