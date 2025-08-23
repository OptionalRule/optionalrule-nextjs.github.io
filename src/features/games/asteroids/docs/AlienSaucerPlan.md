# Alien Saucer Implementation Plan

## Overview

This document outlines the implementation plan for adding alien saucers to the Asteroids game. The saucers will provide dynamic enemy encounters, spawning from level 2 onward with intelligent behavior patterns and visual/audio effects.

## Requirements Analysis

Based on the existing codebase structure, the saucer implementation should follow these established patterns:
- Entity-based architecture using the `Entity` base class
- Consistent collision detection via the `CollisionSystem`
- Sound integration through the `SoundSystem`
- Visual rendering through the `RenderSystem`
- Configuration-driven behavior using the existing config structure

## Implementation Components

### 1. Saucer Entity Class (`engine/entities/Saucer.ts`)

#### Core Properties
- **Size variants**: Small and Large saucers with different behaviors
- **Movement pattern**: Erratic flight path with periodic direction changes
- **Shooting mechanism**: Periodic shots toward player position
- **Visual design**: Bright neon green color scheme with distinctive saucer shape
- **State tracking**: Direction, shoot timer, movement pattern state

#### Key Methods
```typescript
class Saucer extends Entity {
  private size: SaucerSize
  private direction: number
  private shootTimer: number
  private movementTimer: number
  private nextDirectionChange: number
  
  // Core entity methods
  update(deltaTime: number, canvasWidth: number, canvasHeight: number): void
  render(ctx: CanvasRenderingContext2D): void
  
  // Saucer-specific behavior
  private updateMovement(deltaTime: number): void
  private updateShooting(deltaTime: number): void
  private changeDirection(): void
  private shootAtPlayer(playerPosition: Vector2D): void
}
```

#### Movement Behavior
- **Erratic Pattern**: Random direction changes every 1-3 seconds
- **Speed Variation**: Different speeds for small vs large saucers
- **Screen Traversal**: Enter from one side, exit from opposite side
- **Boundary Behavior**: Destroy when reaching opposite boundary

#### Shooting Behavior
- **Target Tracking**: Aim bullets toward player's current position
- **Fire Rate**: Configurable interval (2 seconds default)
- **Bullet Inheritance**: Use existing `Bullet` class with saucer source ID
- **Accuracy**: Slightly inaccurate shots for gameplay balance

### 2. Spawning System Integration

#### Spawn Logic (in `AsteroidsEngine.ts`)
- **Level Requirement**: No spawning on level 1
- **Timing**: Spawn at configurable intervals (30 seconds default)
- **Weighted Selection**:
  - Early levels (2-4): 80% small saucer, 20% large saucer
  - Mid levels (5-8): 60% small saucer, 40% large saucer
  - Late levels (9+): 40% small saucer, 60% large saucer

#### Spawn Configuration
```typescript
// In config.ts
saucerSpawning: {
  minLevel: 2,
  spawnInterval: 30000, // 30 seconds
  weights: {
    early: { small: 0.8, large: 0.2 }, // levels 2-4
    mid: { small: 0.6, large: 0.4 },   // levels 5-8
    late: { small: 0.4, large: 0.6 }   // levels 9+
  }
}
```

### 3. Visual Implementation

#### Saucer Design
- **Shape**: Classic flying saucer silhouette using polygon rendering
- **Color Scheme**: Bright neon green (`#00FF41`) for visibility
- **Size Differentiation**: Large saucer (40px width), Small saucer (24px width)
- **Glow Effect**: Similar to existing bullet/asteroid glow system

#### Saucer Vertices
```typescript
// In config.ts RENDERING section
saucerVertices: {
  large: [
    // Top dome
    { x: -20, y: -8 }, { x: -15, y: -12 }, { x: 0, y: -12 }, 
    { x: 15, y: -12 }, { x: 20, y: -8 },
    // Main body
    { x: 20, y: 0 }, { x: 15, y: 4 }, { x: -15, y: 4 }, { x: -20, y: 0 }
  ],
  small: [
    // Scaled down version of large saucer
    { x: -12, y: -5 }, { x: -9, y: -7 }, { x: 0, y: -7 }, 
    { x: 9, y: -7 }, { x: 12, y: -5 },
    { x: 12, y: 0 }, { x: 9, y: 2 }, { x: -9, y: 2 }, { x: -12, y: 0 }
  ]
}
```

### 4. Explosion Effects

#### Saucer Destruction Animation
- **Color Scheme**: Green-tinted explosion particles (`#00FF41`, `#41FF00`, `#82FF41`)
- **Particle Count**: 8-12 particles for visual impact
- **Duration**: Similar to asteroid explosions (500ms)
- **Integration**: Extend existing `Explosion` class with saucer variant

#### Explosion Configuration
```typescript
// In Explosion.ts constructor
if (explosionType === 'saucer') {
  this.maxDuration = 600
  const colors = ['#00FF41', '#41FF00', '#82FF41', '#FFFFFF']
  const particleCount = this.saucerSize === 'large' ? 12 : 8
}
```

### 5. Audio Implementation

#### Required Sound Effects
1. **Saucer Movement**: Ambient humming sound while active
2. **Saucer Shoot**: Distinctive alien weapon sound
3. **Saucer Destruction**: Explosion with metallic crash element

#### Sound Files Structure
```
assets/sounds/
├── saucer_ambient.mp3     // Looping movement sound
├── saucer_shoot_1.mp3     // Shooting sound variant 1
├── saucer_shoot_2.mp3     // Shooting sound variant 2
└── saucer_destroyed.mp3   // Destruction sound
```

#### Sound Configuration
```typescript
// In config/sounds.ts
saucerAmbient: {
  path: '/games/asteroids/sounds/saucer_ambient.mp3',
  category: 'effects',
  volume: 0.3,
  loop: true,
  preload: true
},
saucerShoot: {
  path: '/games/asteroids/sounds/saucer_shoot_1.mp3',
  category: 'effects',
  volume: 0.6,
  preload: true,
  variants: [
    '/games/asteroids/sounds/saucer_shoot_1.mp3',
    '/games/asteroids/sounds/saucer_shoot_2.mp3'
  ]
},
saucerDestroyed: {
  path: '/games/asteroids/sounds/saucer_destroyed.mp3',
  category: 'effects',
  volume: 0.8,
  preload: true
}
```

### 6. Collision Integration

#### Collision Detection
- **Ship vs Saucer**: Ship destruction (unless invulnerable)
- **Bullet vs Saucer**: Saucer destruction, score award, explosion
- **Saucer vs Asteroid**: No collision (saucers phase through asteroids)

#### Collision Radii
```typescript
// In config.ts PHYSICS section
saucer: {
  large: 20,
  small: 12
}
```

### 7. Scoring System

#### Point Values
- **Large Saucer**: 200 points (consistent with config)
- **Small Saucer**: 1000 points (higher value for difficulty)
- **Score Events**: Integrate with existing ScoreEvent system

#### Score Integration
```typescript
// In collision handling
if (saucer && bullet && !saucer.getActive()) {
  const points = saucer.getPoints()
  this.addScore(points, {
    points,
    position: saucer.getPosition(),
    type: 'saucer'
  })
}
```

## Implementation Strategy

### Phase 1: Core Entity Implementation
1. Create `Saucer.ts` entity class
2. Implement basic movement and rendering
3. Add to entity system and collision detection

### Phase 2: Spawning System
1. Implement weighted spawn logic in `AsteroidsEngine.ts`
2. Add spawn timing and level restrictions
3. Configure spawn parameters in config files

### Phase 3: Combat Integration
1. Implement saucer shooting behavior
2. Add collision handling for saucer interactions
3. Integrate scoring system

### Phase 4: Audio-Visual Polish
1. Create and integrate sound effects
2. Implement saucer explosion effects
3. Add visual polish and glow effects

### Phase 5: Balancing and Testing
1. Fine-tune spawn rates and movement patterns
2. Balance scoring and difficulty progression
3. Performance testing with multiple entities

## Configuration Updates Required

### Type System (`types.ts`)
- `SaucerState` interface already exists
- `SaucerSize` enum already defined
- `ScoreEvent` type supports saucer scoring

### Constants (`config.ts`)
- Saucer-specific configuration section
- Rendering vertices and colors
- Physics collision radii
- Spawning parameters

### Sound System (`config/sounds.ts`)
- New sound definitions for saucer events
- Category assignment and volume levels
- Preload configuration

## Technical Considerations

### Performance Impact
- **Entity Limit**: Maximum 1 saucer on screen at a time
- **Collision Optimization**: Leverage existing collision system
- **Sound Management**: Use existing sound pooling system

### Code Quality
- **Type Safety**: Full TypeScript integration with existing types
- **Error Handling**: Graceful degradation if assets fail to load
- **Debugging**: Integration with existing debug systems

### Extensibility
- **Modular Design**: Easy to add new saucer variants
- **Configuration Driven**: Behavior adjustable without code changes
- **Event System**: Hooks for future gameplay mechanics

## Testing Strategy

### Unit Testing Focus
1. Saucer entity behavior and state management
2. Weighted spawning algorithm accuracy
3. Collision detection and scoring integration

### Integration Testing
1. Multi-entity scenarios (saucer + asteroids + bullets)
2. Sound system integration and cleanup
3. Performance under high entity count

### User Experience Testing
1. Difficulty progression and balance
2. Visual clarity and audio feedback
3. Mobile/touch device compatibility

## Future Enhancements

### Potential Extensions
1. **Advanced AI**: Saucers that actively hunt the player
2. **Special Weapons**: Different bullet types or patterns
3. **Boss Saucers**: Larger, more complex variants
4. **Formation Flying**: Multiple saucers with coordinated behavior

### Performance Optimizations
1. **Entity Pooling**: Reuse saucer instances
2. **LOD System**: Reduced complexity at distance
3. **Culling**: Skip updates for off-screen entities

This implementation plan provides a comprehensive roadmap for adding alien saucers while maintaining consistency with the existing codebase architecture and design patterns.