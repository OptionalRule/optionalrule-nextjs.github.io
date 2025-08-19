import { useEffect, useState, useCallback } from 'react'

export interface InputState {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  shoot: boolean
  pause: boolean
  restart: boolean
}

export interface UseGameInputReturn {
  inputState: InputState
  isKeyPressed: (key: string) => boolean
  bindToElement: (element: HTMLElement | null) => void
}

export function useGameInput(): UseGameInputReturn {
  const [inputState, setInputState] = useState<InputState>({
    rotateLeft: false,
    rotateRight: false,
    thrust: false,
    shoot: false,
    pause: false,
    restart: false,
  })

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [boundElement, setBoundElement] = useState<HTMLElement | null>(null)

  // Convert key codes to game actions
  const getActionFromKey = useCallback((keyCode: string): keyof InputState | null => {
    switch (keyCode) {
      case 'ArrowLeft':
        return 'rotateLeft'
      case 'ArrowRight':
        return 'rotateRight'
      case 'ArrowUp':
        return 'thrust'
      case 'Space':
        return 'shoot'
      case 'Escape':
        return 'pause'
      case 'Enter':
        return 'restart'
      default:
        return null
    }
  }, [])

  // Handle key down events
  const handleKeyDown = useCallback((event: Event) => {
    const keyEvent = event as KeyboardEvent
    const action = getActionFromKey(keyEvent.code)
    
    if (action) {
      keyEvent.preventDefault()
      
      setPressedKeys(prev => new Set(prev).add(keyEvent.code))
      setInputState(prev => ({ ...prev, [action]: true }))
    }
  }, [getActionFromKey])

  // Handle key up events
  const handleKeyUp = useCallback((event: Event) => {
    const keyEvent = event as KeyboardEvent
    const action = getActionFromKey(keyEvent.code)
    
    if (action) {
      keyEvent.preventDefault()
      
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(keyEvent.code)
        return newSet
      })
      
      setInputState(prev => ({ ...prev, [action]: false }))
    }
  }, [getActionFromKey])

  // Handle window blur to clear all input
  const handleBlur = useCallback(() => {
    setPressedKeys(new Set())
    setInputState({
      rotateLeft: false,
      rotateRight: false,
      thrust: false,
      shoot: false,
      pause: false,
      restart: false,
    })
  }, [])

  // Bind input handlers to element or document
  useEffect(() => {
    const target = boundElement || document

    target.addEventListener('keydown', handleKeyDown)
    target.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      target.removeEventListener('keydown', handleKeyDown)
      target.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [boundElement, handleKeyDown, handleKeyUp, handleBlur])

  // Handle focus management
  useEffect(() => {
    if (boundElement) {
      // Make element focusable if it isn't already
      if (boundElement.tabIndex < 0) {
        boundElement.tabIndex = 0
      }
      
      // Focus the element to capture keyboard events
      boundElement.focus()
    }
  }, [boundElement])

  const isKeyPressed = useCallback((key: string): boolean => {
    return pressedKeys.has(key)
  }, [pressedKeys])

  const bindToElement = useCallback((element: HTMLElement | null) => {
    setBoundElement(element)
  }, [])

  return {
    inputState,
    isKeyPressed,
    bindToElement,
  }
}