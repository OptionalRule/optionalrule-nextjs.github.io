import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { GameState, ScoreEvent } from '../types'
import { AsteroidsEngine, type AsteroidsEngineEvents } from '../engine/AsteroidsEngine'
import { GAME_CONFIG } from '../constants'

export interface UseAsteroidsReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  gameState: GameState
  isEngineReady: boolean
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  restartGame: () => void
}

export function useAsteroids(): UseAsteroidsReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<AsteroidsEngine | undefined>(undefined)
  const [isEngineReady, setIsEngineReady] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: GAME_CONFIG.ship.startingLives,
    level: 1,
    gameStatus: 'menu',
    highScore: 0,
  })


  // Engine event handlers wrapped in useMemo to prevent recreation on every render
  const engineEvents: AsteroidsEngineEvents = useMemo(() => ({
    onGameStateChange: (newState: GameState) => {
      setGameState(newState)
    },

    onScoreChange: (score: number, event?: ScoreEvent) => {
      setGameState(prev => ({ ...prev, score }))
      
      // TODO: Handle score event for visual effects
      if (event) {
        // Could trigger particle effects or score popup animations
        console.log('Score event:', event)
      }
    },

    onLivesChange: (lives: number) => {
      setGameState(prev => ({ ...prev, lives }))
    },

    onLevelChange: (level: number) => {
      setGameState(prev => ({ ...prev, level }))
    },

    onGameOver: (finalScore: number) => {
      setGameState(prev => ({ 
        ...prev, 
        gameStatus: 'gameOver',
        highScore: Math.max(prev.highScore, finalScore)
      }))
    },
  }), []) // Empty dependency array since these handlers don't depend on external values

  // Initialize engine when canvas is ready
  useEffect(() => {
    if (!canvasRef.current) return

    const timeoutId = setTimeout(() => {
      try {
        // Set canvas size
        const canvas = canvasRef.current!
        canvas.width = GAME_CONFIG.canvas.width
        canvas.height = GAME_CONFIG.canvas.height

        // Create engine
        const engine = new AsteroidsEngine(canvas, engineEvents)
        engineRef.current = engine
        
        // Set initial game state from engine
        setGameState(engine.getGameState())
        setIsEngineReady(true)

      } catch (error) {
        console.error('Failed to initialize Asteroids engine:', error)
        setIsEngineReady(false)
      }
    }, 100) // Small delay to ensure canvas is properly mounted

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = undefined
      }
      setIsEngineReady(false)
    }
  }, [engineEvents])


  // Handle window blur/focus for automatic pause/resume
  useEffect(() => {
    if (!isEngineReady || !engineRef.current) return

    const handleVisibilityChange = () => {
      if (!engineRef.current) return
      
      if (document.hidden) {
        if (gameState.gameStatus === 'playing') {
          engineRef.current.pause()
        }
      }
      // Note: We don't auto-resume to avoid surprising the player
    }

    const handleBlur = () => {
      if (!engineRef.current) return
      
      if (gameState.gameStatus === 'playing') {
        engineRef.current.pause()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isEngineReady, gameState.gameStatus])

  // Game control functions
  const startGame = useCallback(() => {
    if (engineRef.current && gameState.gameStatus === 'menu') {
      engineRef.current.start()
    }
  }, [gameState.gameStatus])

  const pauseGame = useCallback(() => {
    if (engineRef.current && gameState.gameStatus === 'playing') {
      engineRef.current.pause()
    }
  }, [gameState.gameStatus])

  const resumeGame = useCallback(() => {
    if (engineRef.current && gameState.gameStatus === 'paused') {
      engineRef.current.resume()
    }
  }, [gameState.gameStatus])

  const restartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restart()
    }
  }, [])

  return {
    canvasRef,
    gameState,
    isEngineReady,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
  }
}