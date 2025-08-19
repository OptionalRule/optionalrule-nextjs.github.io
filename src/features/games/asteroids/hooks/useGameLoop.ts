import { useEffect, useRef, useState, useCallback } from 'react'

export interface GameLoopStats {
  fps: number
  deltaTime: number
  frameCount: number
  isRunning: boolean
}

export interface UseGameLoopReturn {
  stats: GameLoopStats
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
}

export function useGameLoop(
  updateCallback: (deltaTime: number) => void,
  targetFPS = 60
): UseGameLoopReturn {
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastFrameTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const lastFPSUpdateRef = useRef<number>(0)
  const isPausedRef = useRef<boolean>(false)
  
  const [stats, setStats] = useState<GameLoopStats>({
    fps: 0,
    deltaTime: 0,
    frameCount: 0,
    isRunning: false,
  })

  const targetFrameTime = 1000 / targetFPS

  const gameLoop = useCallback((currentTime: number) => {
    if (isPausedRef.current) {
      return
    }

    const deltaTime = currentTime - lastFrameTimeRef.current
    lastFrameTimeRef.current = currentTime

    // Frame rate limiting (optional)
    if (deltaTime >= targetFrameTime) {
      // Update game logic
      updateCallback(deltaTime)
      
      // Update frame count
      frameCountRef.current++
      
      // Update FPS calculation every second
      if (currentTime - lastFPSUpdateRef.current >= 1000) {
        const fps = Math.round(
          (frameCountRef.current * 1000) / (currentTime - lastFPSUpdateRef.current)
        )
        
        setStats(prev => ({
          ...prev,
          fps,
          deltaTime,
          frameCount: frameCountRef.current,
        }))
        
        frameCountRef.current = 0
        lastFPSUpdateRef.current = currentTime
      } else {
        setStats(prev => ({
          ...prev,
          deltaTime,
          frameCount: frameCountRef.current,
        }))
      }
    }

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [updateCallback, targetFrameTime])

  const start = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    lastFrameTimeRef.current = performance.now()
    lastFPSUpdateRef.current = performance.now()
    frameCountRef.current = 0
    isPausedRef.current = false
    
    setStats(prev => ({ ...prev, isRunning: true }))
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameLoop])

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    
    isPausedRef.current = false
    setStats(prev => ({ ...prev, isRunning: false, fps: 0 }))
  }, [])

  const pause = useCallback(() => {
    isPausedRef.current = true
    setStats(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resume = useCallback(() => {
    if (animationFrameRef.current) {
      isPausedRef.current = false
      lastFrameTimeRef.current = performance.now()
      setStats(prev => ({ ...prev, isRunning: true }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Handle window visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stats.isRunning) {
        pause()
      }
    }

    const handleBlur = () => {
      if (stats.isRunning) {
        pause()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [stats.isRunning, pause])

  return {
    stats,
    start,
    stop,
    pause,
    resume,
  }
}