import { describe, it, expect, afterEach, vi } from 'vitest'
import { createFakeCanvasContext, stubCanvasContext } from './canvas'

describe('fake 2D canvas context', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts drawing calls without throwing', () => {
    const context = createFakeCanvasContext()

    expect(() => {
      context.save()
      context.beginPath()
      context.arc(0, 0, 5, 0, Math.PI)
      context.fillText('score', 0, 0)
      context.restore()
    }).not.toThrow()
  })

  it('keeps assigned properties', () => {
    const context = createFakeCanvasContext()

    context.fillStyle = '#00ff00'
    context.lineWidth = 3

    expect(context.fillStyle).toBe('#00ff00')
    expect(context.lineWidth).toBe(3)
  })

  it('answers text measurement', () => {
    expect(createFakeCanvasContext().measureText('abc').width).toEqual(expect.any(Number))
  })

  it('serves the fake from canvas.getContext once stubbed', () => {
    stubCanvasContext()

    const context = document.createElement('canvas').getContext('2d')

    expect(context).not.toBeNull()
    expect(() => context?.clearRect(0, 0, 10, 10)).not.toThrow()
  })
})
