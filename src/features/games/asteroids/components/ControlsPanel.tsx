'use client'

import React from 'react'
import type { GameState } from '../types'

export interface ControlsPanelProps {
  gameState: GameState
  onPause?: () => void
  onResume?: () => void
  onRestart?: () => void
  className?: string
}

interface ControlItem {
  key: string
  action: string
  description?: string
}

const GAME_CONTROLS: ControlItem[] = [
  { key: '←/→', action: 'Rotate', description: 'Turn ship left/right' },
  { key: '↑', action: 'Thrust', description: 'Accelerate forward' },
  { key: 'SPACE', action: 'Fire', description: 'Shoot bullets' },
  { key: 'ESC', action: 'Pause', description: 'Pause/resume game' },
  { key: 'ENTER', action: 'Restart', description: 'Restart when game over' },
]

const GAME_TIPS = [
  'Destroy all asteroids to advance levels',
  'Large asteroids split into smaller ones',
  'Ship wraps around screen edges',
  'Bullets disappear at screen edges',
  'Stay moving to avoid collisions',
]

export function ControlsPanel({ 
  gameState, 
  onPause, 
  onResume, 
  onRestart,
  className 
}: ControlsPanelProps) {
  const canPause = gameState.gameStatus === 'playing'
  const canResume = gameState.gameStatus === 'paused'
  const canRestart = gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'playing'

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Controls Reference */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
          CONTROLS
        </h3>
        
        <div className="space-y-2">
          {GAME_CONTROLS.map((control, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <kbd className="px-2 py-1 text-xs font-mono border border-border rounded">
                  {control.key}
                </kbd>
                <span className="text-sm font-mono text-foreground">
                  {control.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Actions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
          ACTIONS
        </h3>
        
        <div className="space-y-2">
          {canPause && (
            <button
              onClick={onPause}
              className="w-full px-3 py-2 text-sm font-mono bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors"
            >
              PAUSE GAME
            </button>
          )}
          
          {canResume && (
            <button
              onClick={onResume}
              className="w-full px-3 py-2 text-sm font-mono bg-transparent border-2 border-green-500 text-green-500 hover:bg-green-500/10 rounded transition-colors"
            >
              RESUME GAME
            </button>
          )}
          
          {canRestart && (
            <button
              onClick={onRestart}
              className="w-full px-3 py-2 text-sm font-mono bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
            >
              RESTART GAME
            </button>
          )}
        </div>
      </div>

      {/* Game Tips */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
          TIPS
        </h3>
        
        <div className="space-y-2">
          {GAME_TIPS.map((tip, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-game-neon-green font-mono text-xs mt-1">
                •
              </span>
              <span className="text-sm text-muted-foreground">
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Information */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
          SCORING
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Large Asteroid:
            </span>
            <span className="text-sm font-mono font-bold text-game-neon-green">
              20 pts
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Medium Asteroid:
            </span>
            <span className="text-sm font-mono font-bold text-game-neon-green">
              50 pts
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Small Asteroid:
            </span>
            <span className="text-sm font-mono font-bold text-game-neon-green">
              100 pts
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Level Bonus:
            </span>
            <span className="text-sm font-mono font-bold text-game-retro-amber">
              Level × 100
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}