'use client'

import React from 'react'
import type { GameState } from '../types'

export interface ScorePanelProps {
  gameState: GameState
  className?: string
}

export function ScorePanel({ gameState, className }: ScorePanelProps) {
  const formatScore = (score: number): string => {
    return score.toLocaleString().padStart(8, '0')
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className || ''}`}>
      <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
        SCORE
      </h3>
      
      <div className="space-y-3">
        {/* Current Score */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-mono">
            CURRENT:
          </span>
          <span className="text-xl font-mono font-bold text-game-neon-green">
            {formatScore(gameState.score)}
          </span>
        </div>
        
        {/* High Score */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-mono">
            HIGH:
          </span>
          <span className="text-lg font-mono font-bold text-game-retro-amber">
            {formatScore(gameState.highScore)}
          </span>
        </div>
        
        {/* Level */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground font-mono">
            LEVEL:
          </span>
          <span className="text-lg font-mono font-bold text-foreground">
            {gameState.level.toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* Lives */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-mono">
            LIVES:
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: Math.max(0, gameState.lives) }, (_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-game-neon-green"
                style={{
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                }}
                title="Ship life"
              />
            ))}
            {gameState.lives <= 0 && (
              <span className="text-red-500 font-mono font-bold">
                GAME OVER
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Game Status Indicator */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-mono">
            STATUS:
          </span>
          <span className={`text-sm font-mono font-bold ${getStatusColor(gameState.gameStatus)}`}>
            {getStatusText(gameState.gameStatus)}
          </span>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: GameState['gameStatus']): string {
  switch (status) {
    case 'menu':
      return 'text-blue-400'
    case 'playing':
      return 'text-game-neon-green'
    case 'paused':
      return 'text-yellow-400'
    case 'gameOver':
      return 'text-red-400'
    default:
      return 'text-muted-foreground'
  }
}

function getStatusText(status: GameState['gameStatus']): string {
  switch (status) {
    case 'menu':
      return 'READY'
    case 'playing':
      return 'ACTIVE'
    case 'paused':
      return 'PAUSED'
    case 'gameOver':
      return 'GAME OVER'
    default:
      return 'UNKNOWN'
  }
}