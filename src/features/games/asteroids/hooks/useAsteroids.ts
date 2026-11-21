import { useEffect, useRef, useState, useCallback, useMemo, useSyncExternalStore } from 'react'
import type { GameState } from '../types'
import { AsteroidsEngine } from '../engine/AsteroidsEngine'
import { GAME_CONFIG } from '../constants'

export interface UseAsteroidsReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  gameState: GameState
  isEngineReady: boolean
  isMobile: boolean
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  restartGame: () => void
  clearHighScore: () => void
  setInputBlocked: (blocked: boolean) => void
}

const INITIAL_GAME_STATE: GameState = Object.freeze({
  score: 0,
  lives: GAME_CONFIG.ship.startingLives,
  level: 1,
  gameStatus: 'menu',
  highScore: 0,
  lastExtraLifeThreshold: 0,
  pendingExtraLife: false,
  extraLifeJustAwarded: false,
})

const getInitialGameState = (): GameState => INITIAL_GAME_STATE

const subscribeToNothing = (): (() => void) => () => undefined

export function useAsteroids(): UseAsteroidsReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [engine, setEngine] = useState<AsteroidsEngine | null>(null)
  const [isEngineReady, setIsEngineReady] = useState(false)

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false

    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || ''
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    const isMobileUserAgent = mobileRegex.test(userAgent)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth <= 1024

    return isMobileUserAgent || (isTouchDevice && isSmallScreen)
  }, [])

  const gameState = useSyncExternalStore(
    engine ? engine.subscribe : subscribeToNothing,
    engine ? engine.getSnapshot : getInitialGameState,
    getInitialGameState
  )

  useEffect(() => {
    if (!canvasRef.current || isMobile) {
      if (isMobile) {
        setIsEngineReady(true)
      }
      return
    }

    let created: AsteroidsEngine | undefined
    const timeoutId = setTimeout(() => {
      try {
        const canvas = canvasRef.current!
        canvas.width = GAME_CONFIG.canvas.width
        canvas.height = GAME_CONFIG.canvas.height

        created = new AsteroidsEngine(canvas)
        setEngine(created)
        setIsEngineReady(true)
      } catch (error) {
        console.error('Failed to initialize Asteroids engine:', error)
        setIsEngineReady(false)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      created?.destroy()
      setEngine(null)
      setIsEngineReady(false)
    }
  }, [isMobile])

  useEffect(() => {
    if (!engine) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        engine.pause()
      }
    }

    const handleBlur = () => {
      engine.pause()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [engine])

  const startGame = useCallback(() => engine?.start(), [engine])
  const pauseGame = useCallback(() => engine?.pause(), [engine])
  const resumeGame = useCallback(() => engine?.resume(), [engine])
  const restartGame = useCallback(() => engine?.restart(), [engine])
  const clearHighScore = useCallback(() => engine?.clearHighScore(), [engine])
  const setInputBlocked = useCallback((blocked: boolean) => engine?.setInputBlocked(blocked), [engine])

  return {
    canvasRef,
    gameState,
    isEngineReady,
    isMobile,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    clearHighScore,
    setInputBlocked,
  }
}
