# Interactive Features Architecture Guide

This guide outlines the best practices for implementing interactive tools and games within the Optional Rule Games Next.js blog site while maintaining clean separation, performance, and maintainability.

## Overview

Interactive features (tools and games) are implemented as self-contained React components integrated into the Next.js application, rather than standalone applications. This approach provides better maintainability, consistent user experience, and simplified deployment while preserving architectural isolation.

## Directory Structure

### Example Feature-Based Organization

```txt
src/
├── app/
├── components/
├── lib/
└── features/           # Interactive features directory
    ├── tools/
    │   ├── dice-roller/
    │   │   ├── components/
    │   │   │   ├── DiceRoller.tsx
    │   │   │   ├── DiceRoller.module.css
    │   │   │   └── RollHistory.tsx
    │   │   ├── hooks/
    │   │   │   └── useDiceRoller.ts
    │   │   ├── types.ts
    │   │   └── index.tsx
    │   └── character-generator/
    └── games/
        ├── asteroids/
        │   ├── components/
        │   │   ├── GameCanvas.tsx
        │   │   ├── GameCanvas.module.css
        │   │   ├── GameUI.tsx
        │   │   └── GameMenu.tsx
        │   ├── engine/
        │   │   ├── AsteroidsEngine.ts
        │   │   ├── entities/
        │   │   └── systems/
        │   ├── hooks/
        │   │   ├── useAsteroids.ts
        │   │   └── useGameInput.ts
        │   ├── assets/
        │   │   ├── sounds/
        │   │   └── sprites/
        │   ├── types.ts
        │   ├── constants.ts
        │   └── index.tsx
        └── shared/          # Shared game utilities
            ├── canvas-utils/
            └── input-handling/
```

### Standard Feature Template Structure

Each interactive feature follows this consistent structure:

- **`components/`**: React UI components with isolated styling
- **`engine/`** (games): Pure game logic classes (no React dependencies)
- **`hooks/`**: React integration layer for state management
- **`assets/`**: Feature-specific assets (sounds, sprites, images)
- **`types.ts`**: TypeScript interfaces and types for the feature
- **`constants.ts`**: Configuration constants
- **`index.tsx`**: Main component export (barrel export pattern)

## Route Structure

### App Router Implementation

Use App Router route groups to maintain separation:

```txt
src/app/
├── (content)/          # Existing blog routes
├── (pages)/           # Static pages  
└── (interactive)/     # Interactive features route group
    ├── layout.tsx     # Interactive-specific layout
    ├── tools/
    │   └── [tool]/
    │       └── page.tsx
    └── games/
        └── [game]/
            └── page.tsx
```

### URL Structure

```txt
/tools/                 # Tools landing page
/tools/dice-roller/
/tools/character-generator/
/games/                 # Games landing page  
/games/asteroids/
/games/dungeon-crawler/
```

## Component Architecture

### 1. Self-Contained React Components

```typescript
// src/features/games/asteroids/index.tsx
'use client'

import { AsteroidsEngine } from './engine'
import { GameCanvas } from './components/GameCanvas'
import { GameUI } from './components/GameUI'
import { useAsteroids } from './hooks/useAsteroids'

export default function AsteroidsGame() {
  const gameState = useAsteroids()
  
  return (
    <div className="asteroids-game">
      <GameCanvas {...gameState} />
      <GameUI {...gameState} />
    </div>
  )
}

// Clean barrel export
export { AsteroidsGame as default }
```

### 2. Game Engine Separation

Keep complex game logic in pure JavaScript/TypeScript classes:

```typescript
// src/features/games/asteroids/engine/AsteroidsEngine.ts
export class AsteroidsEngine {
  private canvas: HTMLCanvasElement
  private gameLoop: number
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    // Pure game logic - no React dependencies
  }
  
  start(): void { /* ... */ }
  update(deltaTime: number): void { /* ... */ }
  render(): void { /* ... */ }
  destroy(): void { /* ... */ }
}
```

### 3. React Integration Layer

```typescript
// src/features/games/asteroids/hooks/useAsteroids.ts
import { useEffect, useRef, useState } from 'react'
import { AsteroidsEngine } from '../engine'
import type { GameState } from '../types'

export function useAsteroids() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<AsteroidsEngine>()
  const [gameState, setGameState] = useState<GameState>(/* initial state */)
  
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new AsteroidsEngine(canvasRef.current)
      // Bridge between engine and React state
    }
    
    return () => {
      engineRef.current?.destroy()
    }
  }, [])
  
  return { canvasRef, gameState, /* ... */ }
}
```

## Styling Architecture

### Hybrid Styling Approach

**Page Structure**: Use TailwindCSS and site theme for consistent layout and UI elements.

**Game Canvas**: Use CSS Modules or CSS-in-JS for isolated, game-specific styling.

### Implementation Example

```typescript
// src/features/games/asteroids/index.tsx
export default function AsteroidsGame() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Site theme classes for page structure */}
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Asteroids</h1>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game canvas with isolated styling */}
          <div className="lg:col-span-3">
            <GameCanvas />
          </div>
          
          {/* UI panels use site theme */}
          <aside className="space-y-4">
            <ScorePanel className="bg-card rounded-lg p-4" />
            <ControlsPanel className="bg-card rounded-lg p-4" />
          </aside>
        </div>
      </main>
    </div>
  )
}
```

### Game Canvas with CSS Modules

```typescript
// src/features/games/asteroids/components/GameCanvas.tsx
import styles from './GameCanvas.module.css'

export function GameCanvas() {
  return (
    <div className={styles.gameContainer}>
      <canvas 
        className={styles.gameCanvas}
        width={800} 
        height={600}
      />
      <div className={styles.gameOverlay}>
        <div className={styles.hudElement}>Score: 1500</div>
        <div className={styles.hudElement}>Lives: 3</div>
      </div>
    </div>
  )
}
```

```css
/* src/features/games/asteroids/components/GameCanvas.module.css */
.gameContainer {
  position: relative;
  display: flex;
  justify-content: center;
  background: #000011;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 100, 255, 0.3);
}

.gameCanvas {
  display: block;
  image-rendering: pixelated;
  background: radial-gradient(ellipse at center, #001122 0%, #000000 100%);
}

.gameOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
}

.hudElement {
  position: absolute;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  text-shadow: 0 0 10px #00ff00;
  user-select: none;
}
```

## Performance Optimization

### 1. Lazy Loading Pattern

```typescript
// Dynamic imports for heavy interactive components
const AsteroidsGame = dynamic(() => import('@/features/games/asteroids'), {
  loading: () => <GameLoading />,
  ssr: false // Client-side only for games
})
```

### 2. Bundle Optimization

```typescript
// next.config.ts
const config = {
  experimental: {
    optimizePackageImports: ['@/features']
  },
  webpack: (config) => {
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      asteroids: {
        test: /[\\/]features[\\/]games[\\/]asteroids[\\/]/,
        name: 'asteroids',
        chunks: 'all'
      }
    }
    return config
  }
}
```

### 3. State Management Isolation

Each interactive feature should manage its own state:

- Use local state (useState, useReducer) for simple tools
- Consider Zustand stores scoped to feature directories for complex state
- Utilize Web APIs (localStorage) for game saves and preferences

## Content Management Integration

### Metadata Approach

Create frontmatter templates for interactive content:

```yaml
# content/interactive/asteroids.mdx
title: "Asteroids Game"
type: "game"
category: "arcade"
description: "Classic asteroid-shooting game recreated in JavaScript"
component: "asteroids"
difficulty: "medium"
tags: [javascript, canvas, arcade, retro]
```

### Discovery System

- Add interactive content to the existing tag system
- Create dedicated landing pages showcasing available tools/games
- Implement search integration for interactive content
- Consider featured/recommended sections

## Development Guidelines

### 1. Encapsulation Principles

- Each feature should be completely self-contained
- Use barrel exports (`index.ts`) to control exposed interfaces
- Feature-specific types in dedicated `types.ts` files
- Isolated dependencies - features manage their own state
- Shared utilities only for genuinely reusable code

### 2. Component Design Standards

- Create small, focused components with clear prop interfaces
- Use composition over inheritance
- Implement proper TypeScript interfaces for all props
- Follow accessibility guidelines (ARIA attributes, keyboard navigation)
- Implement error boundaries for graceful error handling

### 3. Testing Strategy

```txt
src/features/games/asteroids/__tests__/
├── AsteroidsEngine.test.ts    # Pure logic tests
├── useAsteroids.test.ts       # Hook tests  
└── AsteroidsGame.test.tsx     # Component tests
```

### 4. Asset Management

- Store feature-specific assets in feature directories
- Optimize game assets separately from blog images
- Use `/public/games/` and `/public/tools/` for static assets
- Consider CDN for large interactive assets

## TailwindCSS Extensions

### Game-Specific Utility Classes

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-game': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        'game': ['Courier New', 'monospace'],
        'retro': ['Press Start 2P', 'cursive'],
      },
      colors: {
        'game': {
          'neon-green': '#00ff00',
          'space-blue': '#001122',
          'retro-amber': '#ffaa00'
        }
      }
    }
  }
}
```

## Best Practices Summary

### Code Organization

1. **Feature Isolation**: Each tool/game is completely self-contained
2. **Consistent Structure**: Follow the standard template for all features
3. **Clean Interfaces**: Use barrel exports and well-defined TypeScript types
4. **Separation of Concerns**: Keep game logic separate from React components

### Performance

1. **Lazy Loading**: Use dynamic imports for heavy interactive components
2. **Bundle Splitting**: Configure webpack to create separate chunks per feature
3. **Client-Side Only**: Mark interactive components with `'use client'` and `ssr: false`
4. **Asset Optimization**: Optimize and organize assets per feature

### Styling

1. **Hybrid Approach**: TailwindCSS for page structure, CSS Modules for game-specific styling
2. **Theme Consistency**: Use site theme variables for UI elements outside the game canvas
3. **Style Isolation**: Keep game canvas styling completely separate and scoped
4. **Performance**: Avoid global style pollution from game-specific styles

### Maintainability

1. **TypeScript First**: Use strict typing throughout all features
2. **Testing**: Implement comprehensive testing for game logic, hooks, and components
3. **Documentation**: Document game mechanics, tool functionality, and component APIs
4. **Version Control**: Each feature can be developed and versioned independently

This architecture provides a solid foundation for building interactive features that remain maintainable, performant, and consistent with the overall site design while allowing creative freedom for game-specific implementations.
