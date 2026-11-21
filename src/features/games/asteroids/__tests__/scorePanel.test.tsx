import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ScorePanel } from '../components/ScorePanel'
import type { GameState } from '../types'

function stateWith(gameStatus: GameState['gameStatus']): GameState {
  return {
    score: 1200,
    lives: 3,
    level: 2,
    gameStatus,
    highScore: 1200,
    lastExtraLifeThreshold: 0,
    pendingExtraLife: false,
    extraLifeJustAwarded: false,
  }
}

function resetButton(): HTMLElement | null {
  return screen.queryByRole('button', { name: '(reset)' })
}

describe('ScorePanel High Score reset', () => {
  it.each(['menu', 'gameOver'] as const)('offers the reset in %s', status => {
    render(<ScorePanel gameState={stateWith(status)} onResetHighScore={vi.fn()} />)

    expect(resetButton()).not.toBeNull()
  })

  it.each(['playing', 'paused', 'loading'] as const)('hides the reset while a Game is in progress (%s)', status => {
    render(<ScorePanel gameState={stateWith(status)} onResetHighScore={vi.fn()} />)

    expect(resetButton()).toBeNull()
  })

  it('closes an open reset confirmation for good when a Game starts', () => {
    const onResetHighScore = vi.fn()
    const { rerender } = render(<ScorePanel gameState={stateWith('menu')} onResetHighScore={onResetHighScore} />)
    fireEvent.click(resetButton()!)
    expect(screen.queryByRole('dialog')).not.toBeNull()

    rerender(<ScorePanel gameState={stateWith('playing')} onResetHighScore={onResetHighScore} />)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onResetHighScore).not.toHaveBeenCalled()

    rerender(<ScorePanel gameState={stateWith('gameOver')} onResetHighScore={onResetHighScore} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
