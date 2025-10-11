'use client'

import React from 'react'
import type { GameState } from '../types'
import { ScorePanel } from './ScorePanel'
import { ControlsPanel } from './ControlsPanel'

export interface GameUIProps {
  gameState: GameState
  onPause?: () => void
  onResume?: () => void
  onRestart?: () => void
  onResetHighScore?: () => void
  className?: string
}

export function GameUI({ 
  gameState, 
  onPause, 
  onResume, 
  onRestart,
  onResetHighScore,
  className 
}: GameUIProps) {
  return (
    <aside className={`space-y-6 ${className || ''}`}>
      {/* Score and Status Panel */}
      <ScorePanel gameState={gameState} onResetHighScore={onResetHighScore} />
      
      {/* Controls and Actions Panel */}
      <ControlsPanel
        gameState={gameState}
        onPause={onPause}
        onResume={onResume}
        onRestart={onRestart}
      />
    </aside>
  )
}
