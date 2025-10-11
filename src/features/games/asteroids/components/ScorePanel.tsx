'use client'

import React, { useState } from 'react'
import type { GameState } from '../types'
import { ConfirmModal } from './ConfirmModal'

export interface ScorePanelProps {
  gameState: GameState
  className?: string
  onResetHighScore?: () => void
}

export function ScorePanel({ gameState, className, onResetHighScore }: ScorePanelProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const formatScore = (score: number): string => {
    return score.toLocaleString().padStart(8, '0')
  }

  const canResetHighScore = Boolean(onResetHighScore && gameState.highScore > 0)

  const handleRequestReset = () => {
    if (!canResetHighScore) return
    setIsResetModalOpen(true)
  }

  const handleConfirmReset = () => {
    onResetHighScore?.()
    setIsResetModalOpen(false)
  }

  const handleCancelReset = () => {
    setIsResetModalOpen(false)
  }

  return (
    <>
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
            <span className="text-sm text-muted-foreground font-mono flex items-center gap-2">
              <span>HIGH:</span>
              {canResetHighScore && (
                <button
                  type="button"
                  onClick={handleRequestReset}
                  className="text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-game-retro-amber focus:outline-none focus-visible:ring-2 focus-visible:ring-game-retro-amber/60 rounded-sm"
                >
                  (reset)
                </button>
              )}
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
          
          {/* Extra Life Progress */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-mono">
                NEXT LIFE:
              </span>
              <span className="text-xs font-mono text-blue-400">
                {Math.ceil((gameState.score + 1) / 10000) * 10000}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-700 rounded">
              <div 
                className="h-1 bg-blue-400 rounded transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (gameState.score % 10000) / 100)}%` 
                }}
              />
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

      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset High Score?"
        message="This will clear your saved high score. Are you sure?"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </>
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
