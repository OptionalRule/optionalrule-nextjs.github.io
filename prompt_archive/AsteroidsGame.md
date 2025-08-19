# Asteroids Game Implementation for Next.js Blog

## Project Overview

Implement the classic arcade game Asteroids as a self-contained React component within the Optional Rule Games Next.js blog site, following the established interactive features architecture.

## Architecture Requirements

### Directory Structure

Create the following structure under `src/features/games/asteroids/`:

```txt
asteroids/
├── components/
│   ├── GameCanvas.tsx
│   ├── GameCanvas.module.css
│   ├── GameUI.tsx
│   ├── GameMenu.tsx
│   ├── ScorePanel.tsx
│   └── ControlsPanel.tsx
├── engine/
│   ├── AsteroidsEngine.ts
│   ├── entities/
│   │   ├── Ship.ts
│   │   ├── Asteroid.ts
│   │   ├── Bullet.ts
│   │   └── Saucer.ts
│   ├── systems/
│   │   ├── PhysicsSystem.ts
│   │   ├── CollisionSystem.ts
│   │   └── RenderSystem.ts
│   └── utils/
│       ├── Vector2D.ts
│       └── GameMath.ts
├── hooks/
│   ├── useAsteroids.ts
│   ├── useGameInput.ts
│   └── useGameLoop.ts
├── types.ts
├── constants.ts
└── index.tsx
```

### Component Architecture

#### Main Component (`index.tsx`)

```typescript
'use client'

export default function AsteroidsGame() {
  // Main game component following the self-contained pattern
  // Integrates with site theme for page structure
  // Uses CSS Modules for game-specific styling
}
```

#### Game Engine (`engine/AsteroidsEngine.ts`)

Implement pure TypeScript class with no React dependencies:

- Constructor accepts canvas element
- Methods: `start()`, `update(deltaTime)`, `render()`, `destroy()`
- Manages game state, entities, and physics
- Emits events for score updates, game over, etc.

#### React Integration Layer (`hooks/useAsteroids.ts`)

- Bridge between React and game engine
- Manages canvas ref and engine lifecycle
- Converts engine events to React state updates
- Handles cleanup on unmount

## Game Implementation

### Canvas Configuration

- **Resolution**: 1280x720 scaled responsively to container
- **Rendering**: Use HTML5 Canvas API with hardware acceleration
- **Frame Rate**: Target 60 FPS with requestAnimationFrame

### Core Game Mechanics

#### Player Ship

- **Entity Class**: `Ship.ts` extends base Entity class
- **Properties**:
  - Position, velocity, rotation (using Vector2D utility)
  - Lives (default: 3)
  - Invulnerability timer after respawn
- **Methods**:
  - `rotate(direction: -1 | 1)`
  - `thrust(deltaTime: number)`
  - `shoot(): Bullet`
  - `respawn()`
- **Physics**: Implement inertia with configurable friction coefficient

#### Asteroids System

- **Entity Class**: `Asteroid.ts` with size enum (LARGE, MEDIUM, SMALL)
- **Spawning Logic**:
  - Initial: 5 large asteroids, minimum 20% smallest screen resolution distance from ship
  - Random velocities within configured range
  - Irregular polygon generation for visual variety
- **Breaking Mechanics**:
  - Large → 2-4 medium asteroids
  - Medium → 2-6 small asteroids
  - Small → destroyed
- **Scoring**: 20 (large), 50 (medium), 100 (small) points

#### Bullets
- **Entity Class**: `Bullet.ts` extends base Entity class
- **Lifetime Management**:
  - Despawn when reaching canvas edge (no wrapping)
  - Despawn on collision with asteroid or saucer
  - Maximum lifetime timer (2 seconds) to prevent memory leaks
- **Properties**:
  - Position and velocity vectors
  - Source entity reference (for scoring attribution)
- **Firing Mechanics**:
  - Maximum bullets active per ship (e.g., 10)
  - Cooldown between shots (e.g., 250ms)
  - Initial velocity: ship velocity + bullet speed in ship direction

#### Collision System

- **Implementation**: Separate `CollisionSystem.ts` class
- **Detection**: Circle-based collision for performance
- **Types**:
  - Ship-Asteroid: Lose life
  - Bullet-Asteroid: Destroy/split asteroid
  - Bullet-Saucer: Destroy saucer
- **Optimization**: Spatial partitioning for large entity counts

#### Input Handling

- **Hook**: `useGameInput.ts`
- **Controls**:
  
  ```typescript
  const controls = {
    ArrowLeft: 'rotateLeft',
    ArrowRight: 'rotateRight',
    ArrowUp: 'thrust',
    Space: 'shoot',
    Enter: 'restart',
    Escape: 'pause'
  }
  ```

- **Touch Support**: Consider future mobile compatibility

### Visual Design

#### Styling Architecture

Use hybrid approach per style guide:

**Page Structure** (TailwindCSS):

```typescript
<div className="min-h-screen bg-background">
  <header className="border-b border-border p-4">
    <h1 className="text-2xl font-bold">Asteroids</h1>
  </header>
  <main className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Game canvas and UI panels */}
  </main>
</div>
```

**Game Canvas** (CSS Modules):

```css
/* GameCanvas.module.css */
.gameContainer {
  position: relative;
  background: linear-gradient(135deg, #000011 0%, #001122 100%);
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
}

.gameCanvas {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: optimizeSpeed;
}
```

#### Visual Elements

- **Background**: Dark space gradient (#000011 to #001122)
- **Ship**: Neon cyan outline (#00ffff) with dark teal fill
- **Asteroids**: Gray fill with neon green outline (#00ff00)
- **Bullets**: Bright neon yellow (#ffff00) with glow effect
- **Thrust Effect**: Animated orange-red gradient with tweening
- **HUD**: Monospace font with neon green text shadow

### Advanced Features

#### Thrust Animation System

```typescript
class ThrustEffect {
  private tweenValue: number = 0;
  private targetValue: number = 0;
  
  update(deltaTime: number, isThrusting: boolean) {
    this.targetValue = isThrusting ? 1.0 : 0.0;
    this.tweenValue += (this.targetValue - this.tweenValue) * 0.1;
  }
  
  render(ctx: CanvasRenderingContext2D, ship: Ship) {
    // Render flame with scale based on tweenValue
  }
}
```

#### Flying Saucers (Optional)

- **Entity Class**: `Saucer.ts`
- **Types**: Small (200 points), Large (1000 points)
- **AI**: Simple movement patterns with periodic shooting
- **Spawn Logic**: Random intervals after level 2

#### Level Progression

```typescript
interface LevelConfig {
  asteroidCount: number;
  asteroidSpeed: number;
  saucerSpawnRate: number;
}

class LevelSystem {
  getConfig(level: number): LevelConfig {
    // Progressive difficulty scaling
  }
}
```

### State Management

#### Game State Interface

```typescript
interface GameState {
  score: number;
  lives: number;
  level: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  highScore: number;
}
```

#### Persistence

- Use localStorage for high scores
- Key: `asteroids_highscore`
- Consider future integration with user profiles

### Performance Optimization

#### Bundle Strategy

- Lazy load game component with Next.js dynamic imports
- Create separate chunk for game assets
- Implement progressive loading for sounds/sprites

#### Rendering Optimization

- Object pooling for bullets and particles
- Dirty rectangle optimization for canvas updates
- RequestAnimationFrame with delta time calculation

### Testing Requirements

#### Unit Tests

- Entity physics calculations
- Collision detection algorithms
- Score calculation logic

#### Integration Tests

- Game state transitions
- Input handling pipeline
- React hooks lifecycle

#### E2E Tests

- Game initialization
- Complete gameplay loop
- Score persistence

## Development Guidelines

### Code Organization Principles

1. **Encapsulation**: Each class/module has single responsibility
2. **DRY**: Shared physics utilities in `GameMath.ts`
3. **Type Safety**: Strict TypeScript with no `any` types
4. **Immutability**: Use immutable state updates in React layer

### Best Practices

1. **Error Boundaries**: Wrap game component for graceful failures
2. **Accessibility**: Keyboard navigation, ARIA labels, pause on blur
3. **Documentation**: JSDoc comments for public APIs
4. **Performance Monitoring**: FPS counter in development mode

### Implementation Phases

#### Phase 1: Core Engine

- Basic entity system
- Physics and collision
- Rendering pipeline

#### Phase 2: React Integration

- Hook architecture
- State management
- UI components

#### Phase 3: Polish

- Visual effects and animations
- Sound system (Web Audio API)
- Mobile responsiveness

#### Phase 4: Enhancement

- Leaderboards
- Power-ups system
- Multiplayer consideration

## Deliverables

### Required Files

1. Complete feature implementation in `src/features/games/asteroids/`
2. Route configuration in `src/app/(interactive)/games/asteroids/page.tsx`
3. Unit tests in `__tests__/` directory
4. README.md with gameplay instructions

### Code Quality Standards

- ESLint compliance with project configuration
- Prettier formatting
- No TypeScript errors
- Test coverage > 80% for game logic

### Documentation

Include inline comments explaining:

- Complex physics calculations
- Tweening algorithms
- Performance optimizations
- React-Engine bridge pattern

## How to Play Instructions

```markdown
## Controls
- **Arrow Keys**: Rotate ship left/right
- **Up Arrow**: Thrust forward
- **Spacebar**: Fire bullets
- **Enter**: Start/Restart game
- **Escape**: Pause game

## Objective
Destroy all asteroids while avoiding collisions. Progress through increasingly difficult levels.

## Scoring
- Large Asteroid: 20 points
- Medium Asteroid: 50 points  
- Small Asteroid: 100 points
- Large Saucer: 200 points
- Small Saucer: 1000 points
```

This implementation should create a production-ready, maintainable Asteroids game that integrates seamlessly with the Next.js blog architecture while preserving the classic gameplay with modern visual enhancements.
