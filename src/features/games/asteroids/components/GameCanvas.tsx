'use client'

import React, { useEffect } from 'react'
import type { GameState } from '../types'
import { GAME_CONFIG } from '../constants'
import styles from './GameCanvas.module.css'

export interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  gameState: GameState
  isEngineReady: boolean
  onStartGame: () => void
  className?: string
}

export function GameCanvas({ 
  canvasRef, 
  gameState, 
  isEngineReady, 
  onStartGame,
  className 
}: GameCanvasProps) {
  // Handle click to start on menu
  const handleCanvasClick = () => {
    if (gameState.gameStatus === 'menu') {
      onStartGame()
    }
  }

  // Handle keyboard focus for accessibility
  useEffect(() => {
    if (canvasRef.current && isEngineReady) {
      canvasRef.current.tabIndex = 0
      canvasRef.current.focus()
    }
  }, [canvasRef, isEngineReady])

  return (
    <div className={`${styles.gameContainer} ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className={styles.gameCanvas}
        width={GAME_CONFIG.canvas.width}
        height={GAME_CONFIG.canvas.height}
        onClick={handleCanvasClick}
        aria-label="Asteroids game canvas"
        role="application"
      />
      
      {/* Loading overlay */}
      {!isEngineReady && (
        <div className={styles.menuOverlay}>
          <div className={styles.loadingText}>
            INITIALIZING ASTEROIDS...
          </div>
        </div>
      )}
      
      {/* Menu overlay */}
      {isEngineReady && gameState.gameStatus === 'menu' && (
        <div className={styles.menuOverlay}>
          <h1 className={styles.menuTitle}>ASTEROIDS</h1>
          
          <div className={styles.menuInstructions}>
            <div className={styles.menuInstruction}>
              <strong>ARROW KEYS</strong> - Rotate and thrust
            </div>
            <div className={styles.menuInstruction}>
              <strong>SPACEBAR</strong> - Fire bullets
            </div>
            <div className={styles.menuInstruction}>
              <strong>ESCAPE</strong> - Pause game
            </div>
            <div className={styles.menuInstruction}>
              <strong>ENTER</strong> - Restart when game over
            </div>
          </div>
          
          <div className={styles.startPrompt}>
            CLICK TO START OR PRESS ANY KEY
          </div>
        </div>
      )}
      
      {/* Game overlay for future UI elements */}
      <div className={styles.gameOverlay}>
        {/* Future: particle effects, score popups, etc. */}
      </div>
    </div>
  )
}