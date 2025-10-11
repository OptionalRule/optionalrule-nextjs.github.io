'use client'

import React from 'react'
import { GameCanvas } from './components/GameCanvas'
import { GameUI } from './components/GameUI'
import { useAsteroids } from './hooks/useAsteroids'

export interface AsteroidsGameProps {
  className?: string
}

export default function AsteroidsGame({ className }: AsteroidsGameProps) {
  const {
    canvasRef,
    gameState,
    isEngineReady,
    isMobile,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    clearHighScore,
  } = useAsteroids()

  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold font-mono text-game-neon-green">
            ASTEROIDS
          </h1>
          <p className="text-muted-foreground mt-1">
            Classic space shooter reimagined with modern graphics.
          </p>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas - Takes up 3/4 on large screens */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <GameCanvas
              canvasRef={canvasRef}
              gameState={gameState}
              isEngineReady={isEngineReady}
              isMobile={isMobile}
              onStartGame={startGame}
              className="w-full"
            />
          </div>

          {/* Game UI Panel - Takes up 1/4 on large screens */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <GameUI
              gameState={gameState}
              onPause={pauseGame}
              onResume={resumeGame}
              onRestart={restartGame}
              onResetHighScore={clearHighScore}
            />
          </div>
        </div>

        {/* Game Instructions - Below game on mobile */}
        <div className="mt-8 lg:hidden">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-xl font-bold font-mono mb-4">How to Play</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Objective</h3>
                <p className="text-muted-foreground">
                  Destroy all asteroids while avoiding collisions. Each level adds more asteroids and increases difficulty.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Strategy</h3>
                <p className="text-muted-foreground">
                  Large asteroids split into medium ones, which split into small ones. Plan your shots carefully!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <footer className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            Asteroids clone built with TypeScript, HTML5 Canvas, and React as a test of coding CLIs.
            Original game by Atari (1979).
          </p>
        </footer>
      </main>
    </div>
  )
}

// Clean barrel export
export { AsteroidsGame }
